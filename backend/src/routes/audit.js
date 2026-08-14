import { Router } from 'express';
import { pool } from '../lib/db.js';
import { requireAuth } from '../middleware/auth.js';

const router = Router();

router.get('/projects/:id/audit-trail', requireAuth, async (req, res) => {
  const { id } = req.params;
  const [rows] = await pool.query(
    `SELECT a.*, u.name AS actor_name
     FROM audit_log a
     JOIN users u ON a.actor_id = u.id
     WHERE a.project_id = ?
     ORDER BY a.created_at DESC`,
    [id]
  );
  res.json({ data: rows });
});

export default router;
