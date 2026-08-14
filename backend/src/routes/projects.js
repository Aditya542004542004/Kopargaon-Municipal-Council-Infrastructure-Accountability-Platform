import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { pool } from '../lib/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { computeTrustIndex, computeBudgetProgress } from '../services/trustIndex.js';
import { writeAudit } from '../services/audit.js';

const router = Router();

// GET /projects — Dashboard overview list
router.get('/', requireAuth, async (req, res) => {
  const [projects] = await pool.query(
    `SELECT p.*, u1.name AS contractor_name, u2.name AS authority_name
     FROM projects p
     JOIN users u1 ON p.contractor_id = u1.id
     JOIN users u2 ON p.authority_id = u2.id
     ORDER BY p.created_at DESC`
  );

  if (projects.length === 0) return res.json({ data: [] });

  const projectIds = projects.map((p) => p.id);

  // Subquery only counts UNRESOLVED / PENDING flags for the dashboard Trust Index
  const [allMilestones] = await pool.query(
    `SELECT m.*, 
            (SELECT COUNT(*) FROM flags f WHERE f.milestone_id = m.id AND (f.status IS NULL OR f.status = 'pending')) AS pending_flag_count
     FROM milestones m WHERE m.project_id IN (?)`,
    [projectIds]
  );

  const milestonesByProject = {};
  for (const m of allMilestones) {
    (milestonesByProject[m.project_id] ||= []).push(m);
  }

  const enriched = projects.map((p) => {
    const milestones = milestonesByProject[p.id] || [];
    const trustIndex = computeTrustIndex(
      milestones.map((m) => ({
        status: m.status,
        note: m.note,
        submittedAt: m.submitted_at,
        flags: Array(m.pending_flag_count || 0).fill({ status: 'pending' }),
      }))
    );
    const budget = computeBudgetProgress(p, milestones);
    return {
      ...p,
      milestoneCount: milestones.length,
      trustScore: trustIndex.score,
      budgetSpentPercent: budget.spentPercent,
      physicalProgressPercent: budget.physicalPercent,
    };
  });

  res.json({ data: enriched });
});

// POST /projects — Create new project passport
router.post('/', requireAuth, requireRole('authority'), async (req, res) => {
  const { name, ward, department, budgetTotal, contractorId, startDate, endDate, latitude, longitude } = req.body;
  if (!name || !ward || !department || !budgetTotal || !contractorId || !startDate || !endDate) {
    return res.status(422).json({ error: 'name, ward, department, budgetTotal, contractorId, startDate, endDate are required' });
  }

  const lat = latitude !== undefined && latitude !== null && latitude !== '' ? Number(latitude) : 19.8887;
  const lng = longitude !== undefined && longitude !== null && longitude !== '' ? Number(longitude) : 74.4784;

  const [contractorRows] = await pool.query('SELECT id, role FROM users WHERE id = ?', [contractorId]);
  if (contractorRows.length === 0 || contractorRows[0].role !== 'contractor') {
    return res.status(422).json({ error: 'contractorId must reference a user with role=contractor' });
  }

  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const id = uuid();
    await connection.query(
      `INSERT INTO projects (id, name, ward, department, budget_total, budget_spent, contractor_id, authority_id, start_date, end_date, latitude, longitude)
       VALUES (?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?)`,
      [id, name, ward, department, budgetTotal, contractorId, req.user.id, startDate, endDate, lat, lng]
    );
    await writeAudit(connection, {
      projectId: id,
      eventType: 'project_created',
      actorId: req.user.id,
      detail: { name, ward, budgetTotal, latitude: lat, longitude: lng },
    });
    await connection.commit();
    res.status(201).json({ data: { id } });
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
});

// GET /projects/:id — Single project passport detail view
router.get('/:id', requireAuth, async (req, res) => {
  const { id } = req.params;

  const [projectRows] = await pool.query(
    `SELECT p.*, u1.name AS contractor_name, u2.name AS authority_name
     FROM projects p
     JOIN users u1 ON p.contractor_id = u1.id
     JOIN users u2 ON p.authority_id = u2.id
     WHERE p.id = ?`,
    [id]
  );
  const project = projectRows[0];
  if (!project) return res.status(404).json({ error: 'Project not found' });

  const [milestones] = await pool.query(
    `SELECT m.*, u.name AS submitted_by_name, e.name AS engineer_name
     FROM milestones m
     JOIN users u ON m.submitted_by = u.id
     LEFT JOIN users e ON m.engineer_id = e.id
     WHERE m.project_id = ?
     ORDER BY m.submitted_at ASC`,
    [id]
  );

  const milestoneIds = milestones.map((m) => m.id);
  let flagsByMilestone = {};
  if (milestoneIds.length > 0) {
    const [flags] = await pool.query(
      `SELECT f.*, u.name AS citizen_name FROM flags f JOIN users u ON f.citizen_id = u.id WHERE f.milestone_id IN (?)`,
      [milestoneIds]
    );
    flagsByMilestone = flags.reduce((acc, f) => {
      (acc[f.milestone_id] ||= []).push(f);
      return acc;
    }, {});
  }

  const milestonesWithFlags = milestones.map((m) => ({
    ...m,
    flags: flagsByMilestone[m.id] || [],
  }));

  const trustIndex = computeTrustIndex(
    milestonesWithFlags.map((m) => ({
      status: m.status,
      note: m.note,
      submittedAt: m.submitted_at,
      flags: m.flags,
    }))
  );
  const budget = computeBudgetProgress(project, milestones);

  res.json({ data: { project, milestones: milestonesWithFlags, trustIndex, budget } });
});

export default router;