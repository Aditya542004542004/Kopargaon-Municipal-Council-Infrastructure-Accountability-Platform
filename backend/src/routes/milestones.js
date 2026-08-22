import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import fs from 'fs';
import ExifParser from 'exif-parser';
import { pool } from '../lib/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { writeAudit } from '../services/audit.js';
import { upload, photoUrlFor } from '../middleware/upload.js';
//import { verifyUploadedImage } from '../services/imageVerification.js';
import { verifyUploadedImage, verifyCitizenFlagImage } from '../services/imageVerification.js';

const router = Router();

// Haversine formula helper to calculate distance between photo GPS and project GPS in km
function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}


// Submit a new milestone update — Assigned Contractor only
router.post('/projects/:projectId/milestones', requireAuth, requireRole('contractor'), upload.single('photo'), async (req, res) => {
  const { projectId } = req.params;
  const { title, note, isFraudDemo } = req.body;
  const progressPercent = Number(req.body.progressPercent);
  const budgetSpent = req.body.budgetSpent !== undefined ? Number(req.body.budgetSpent) : 0;
  const photoUrl = photoUrlFor(req.file);

  if (!title || req.body.progressPercent === undefined) {
    return res.status(422).json({ error: 'title and progressPercent are required' });
  }
  if (Number.isNaN(progressPercent) || progressPercent < 0 || progressPercent > 100) {
    return res.status(422).json({ error: 'progressPercent must be a number between 0 and 100' });
  }
  if (Number.isNaN(budgetSpent) || budgetSpent < 0) {
    return res.status(422).json({ error: 'budgetSpent must be a non-negative number' });
  }

  const [projectRows] = await pool.query('SELECT * FROM projects WHERE id = ?', [projectId]);
  const project = projectRows[0];
  if (!project) return res.status(404).json({ error: 'Project not found' });

  // 🔒 SECURITY CHECK: Ensure ONLY the assigned contractor can upload milestones!
  if (String(project.contractor_id) !== String(req.user.id)) {
    return res.status(403).json({ 
      error: 'Access Denied: Only the contractor assigned to this project passport can submit milestones.' 
    });
  }

  const projectLat = Number(project.latitude || 19.8887);
  const projectLng = Number(project.longitude || 74.4784);

  let verification = {
    geoStatus: 'NO_METADATA',
    geoDistanceKm: null,
    photoLat: projectLat,
    photoLng: projectLng,
    contentStatus: 'CONSTRUCTION_DETECTED',
    detectedLabels: 'groundwork',
    isAutoFlagged: false
  };

  if (isFraudDemo === 'true' || isFraudDemo === true) {
    verification.contentStatus = 'NON_CONSTRUCTION_DETECTED';
    verification.detectedLabels = 'web site, screenshot';
    verification.isAutoFlagged = true;
  } else if (req.file) {
    const contextText = `${title || ''} ${note || ''}`;
    verification = await verifyUploadedImage(
      req.file.path,
      projectLat,
      projectLng,
      contextText
    );
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const id = uuid();

    await connection.query(
      `INSERT INTO milestones 
       (id, project_id, title, progress_percent, budget_spent, note, photo_url, submitted_by, 
        geo_status, geo_distance_km, exif_lat, exif_lng, content_status, detected_labels, auto_flagged)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, projectId, title, progressPercent, budgetSpent, note || null, photoUrl, req.user.id,
        verification.geoStatus, verification.geoDistanceKm, verification.photoLat, verification.photoLng,
        verification.contentStatus, verification.detectedLabels, verification.isAutoFlagged ? 1 : 0
      ]
    );

    await writeAudit(connection, {
      projectId,
      eventType: verification.isAutoFlagged ? 'milestone_auto_flagged' : 'milestone_submitted',
      actorId: req.user.id,
      detail: { milestoneId: id, title, progressPercent, budgetSpent, verification }
    });

    await connection.commit();
    res.status(201).json({ data: { id, photoUrl, verification } });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});
// Resolve or dismiss a citizen flag — Engineer or Authority
router.post('/flags/:id/resolve', requireAuth, requireRole('engineer', 'authority'), async (req, res) => {
  const { id } = req.params;
  const { action, comment } = req.body;
  const status = action === 'dismiss' ? 'dismissed' : 'resolved';

  try {
    // JOIN milestones to safely get project_id
    const [flagRows] = await pool.query(
      `SELECT f.*, m.project_id 
       FROM flags f 
       JOIN milestones m ON f.milestone_id = m.id 
       WHERE f.id = ?`,
      [id]
    );

    if (flagRows.length === 0) {
      return res.status(404).json({ error: 'Flag not found' });
    }
    const flag = flagRows[0];

    const connection = await pool.getConnection();
    try {
      await connection.beginTransaction();

      await connection.query(
        `UPDATE flags 
         SET status = ?, resolution_note = ?, resolved_by = ?, resolved_at = NOW() 
         WHERE id = ?`,
        [status, comment || 'Issue inspected and resolved on site', req.user.id, id]
      );

      // Record in privilege-restricted audit log
      await writeAudit(connection, {
        projectId: flag.project_id,
        eventType: status === 'dismissed' ? 'flag_dismissed' : 'flag_resolved',
        actorId: req.user.id,
        detail: { flagId: id, status, comment },
      });

      await connection.commit();
      res.json({ data: { id, status } });
    } catch (err) {
      await connection.rollback();
      console.error('Database transaction error resolving flag:', err);
      res.status(500).json({ error: err.message || 'Database error while resolving flag' });
    } finally {
      connection.release();
    }
  } catch (err) {
    console.error('Error finding flag:', err);
    res.status(500).json({ error: err.message || 'Error processing flag request' });
  }
});

// Verify a submitted milestone — Engineer only
router.post('/milestones/:id/verify', requireAuth, requireRole('engineer'), async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;

  const [rows] = await pool.query('SELECT * FROM milestones WHERE id = ?', [id]);
  const milestone = rows[0];
  if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
  if (milestone.status !== 'submitted') {
    return res.status(409).json({ error: `Milestone is already ${milestone.status}, cannot verify again` });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      `UPDATE milestones SET status = 'verified', engineer_id = ?, engineer_comment = ?, verified_at = NOW() WHERE id = ?`,
      [req.user.id, comment || null, id]
    );
    await writeAudit(connection, {
      projectId: milestone.project_id,
      eventType: 'milestone_verified',
      actorId: req.user.id,
      detail: { milestoneId: id, comment },
    });
    await connection.commit();
    res.json({ data: { id, status: 'verified' } });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

// Reject a submitted milestone — Engineer only
router.post('/milestones/:id/reject', requireAuth, requireRole('engineer'), async (req, res) => {
  const { id } = req.params;
  const { comment } = req.body;

  const [rows] = await pool.query('SELECT * FROM milestones WHERE id = ?', [id]);
  const milestone = rows[0];
  if (!milestone) return res.status(404).json({ error: 'Milestone not found' });
  if (milestone.status !== 'submitted') {
    return res.status(409).json({ error: `Milestone is already ${milestone.status}, cannot reject again` });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    await connection.query(
      `UPDATE milestones SET status = 'rejected', engineer_id = ?, engineer_comment = ? WHERE id = ?`,
      [req.user.id, comment || null, id]
    );
    await writeAudit(connection, {
      projectId: milestone.project_id,
      eventType: 'milestone_rejected',
      actorId: req.user.id,
      detail: { milestoneId: id, comment },
    });
    await connection.commit();
    res.json({ data: { id, status: 'rejected' } });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

// Citizen Flag Discrepancy (Now with EXIF Geotag Verification for Citizen Complaints!)
// Citizen Flag Discrepancy — Requires photo within 100 meters of project site
router.post('/milestones/:id/flags', requireAuth, requireRole('citizen'), upload.single('photo'), async (req, res) => {
  const { id } = req.params;
  const { text } = req.body;
  const photoUrl = photoUrlFor(req.file);

  if (!text || !text.trim()) return res.status(422).json({ error: 'text is required' });

  // JOIN project to get exact project latitude and longitude
  const [milestoneRows] = await pool.query(
    `SELECT m.*, p.latitude, p.longitude 
     FROM milestones m 
     JOIN projects p ON m.project_id = p.id 
     WHERE m.id = ?`,
    [id]
  );
  const milestone = milestoneRows[0];
  if (!milestone) return res.status(404).json({ error: 'Milestone not found' });

  if (milestone.status !== 'verified') {
    return res.status(409).json({ error: 'Only verified milestones can be flagged' });
  }

  const projectLat = Number(milestone.latitude || 19.8887);
  const projectLng = Number(milestone.longitude || 74.4784);

  let flagGeo = { geoStatus: 'NO_METADATA', geoDistanceKm: null, photoLat: null, photoLng: null };

  if (req.file) {
    flagGeo = await verifyCitizenFlagImage(req.file.path, projectLat, projectLng);
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const flagId = uuid();

    await connection.query(
      `INSERT INTO flags (id, milestone_id, citizen_id, text, photo_url, status, geo_status, geo_distance_km, exif_lat, exif_lng) 
       VALUES (?, ?, ?, ?, ?, 'pending', ?, ?, ?, ?)`,
      [
        flagId, id, req.user.id, text.trim(), photoUrl, 
        flagGeo.geoStatus, flagGeo.geoDistanceKm, flagGeo.photoLat, flagGeo.photoLng
      ]
    );

    await writeAudit(connection, {
      projectId: milestone.project_id,
      eventType: 'flag_raised',
      actorId: req.user.id,
      detail: { milestoneId: id, flagId, text: text.trim(), flagGeo },
    });

    await connection.commit();
    res.status(201).json({ data: { id: flagId, photoUrl, flagGeo } });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

export default router;