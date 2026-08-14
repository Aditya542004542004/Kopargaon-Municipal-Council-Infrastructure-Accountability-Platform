import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { pool } from '../lib/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';
import { upload, photoUrlFor } from '../middleware/upload.js';

const router = Router();

// List demands, ranked by support count — this is the "ranked demand list"
// an Authority sees instead of scattered individual complaints.
router.get('/', requireAuth, async (req, res) => {
  const [rows] = await pool.query(
    `SELECT d.*, u.name AS created_by_name,
            (SELECT COUNT(*) FROM demand_votes v WHERE v.demand_id = d.id) AS support_count
     FROM community_demands d
     JOIN users u ON d.created_by = u.id
     ORDER BY support_count DESC, d.created_at DESC`
  );
  res.json({ data: rows });
});

// Raise a new demand — Citizen only.
router.post('/', requireAuth, requireRole('citizen'), upload.single('photo'), async (req, res) => {
  const { title, ward, category, description } = req.body;
  if (!title || !ward || !category) {
    return res.status(422).json({ error: 'title, ward, and category are required' });
  }
  const id = uuid();
  await pool.query(
    `INSERT INTO community_demands (id, title, ward, category, description, photo_url, created_by)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [id, title, ward, category, description || null, photoUrlFor(req.file), req.user.id]
  );
  res.status(201).json({ data: { id } });
});

// Upvote a demand — Citizen only, one vote per citizen per demand (DB-enforced
// via the unique(demand_id, citizen_id) constraint, not just app logic).
router.post('/:id/vote', requireAuth, requireRole('citizen'), async (req, res) => {
  const { id } = req.params;
  const [demandRows] = await pool.query('SELECT id FROM community_demands WHERE id = ?', [id]);
  if (demandRows.length === 0) return res.status(404).json({ error: 'Demand not found' });

  try {
    await pool.query('INSERT INTO demand_votes (id, demand_id, citizen_id) VALUES (?, ?, ?)', [
      uuid(),
      id,
      req.user.id,
    ]);
    res.status(201).json({ data: { voted: true } });
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ error: 'You already voted for this demand' });
    }
    throw err;
  }
});

// Link a demand to a newly-created project — Authority only. This is what
// turns "450 citizens supported this" into a traceable line back to why a
// project got approved in the first place.
router.post('/:id/link', requireAuth, requireRole('authority'), async (req, res) => {
  const { id } = req.params;
  const { projectId } = req.body;
  if (!projectId) return res.status(422).json({ error: 'projectId is required' });

  const [projectRows] = await pool.query('SELECT id FROM projects WHERE id = ?', [projectId]);
  if (projectRows.length === 0) return res.status(404).json({ error: 'Project not found' });

  const [result] = await pool.query(
    `UPDATE community_demands SET status = 'linked', linked_project_id = ? WHERE id = ?`,
    [projectId, id]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: 'Demand not found' });
  res.json({ data: { id, status: 'linked', linkedProjectId: projectId } });
});

export default router;
