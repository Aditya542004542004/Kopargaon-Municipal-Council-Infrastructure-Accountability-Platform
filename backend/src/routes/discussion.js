import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { pool } from '../lib/db.js';
import { requireAuth } from '../middleware/auth.js';
import { summarizeDiscussion } from '../services/discussionSummary.js';

const router = Router();

const CATEGORIES = ['general', 'technical', 'budget', 'suggestion'];

router.get('/projects/:projectId/discussion', requireAuth, async (req, res) => {
  const { projectId } = req.params;
  const [rows] = await pool.query(
    `SELECT p.*, u.name AS author_name, u.role AS author_role
     FROM discussion_posts p
     JOIN users u ON p.author_id = u.id
     WHERE p.project_id = ?
     ORDER BY p.created_at ASC`,
    [projectId]
  );
  res.json({ data: rows });
});

// Any authenticated role can post — Authority, Contractor, Engineer, and Citizen
// all have a legitimate reason to weigh in on a project's discussion.
router.post('/projects/:projectId/discussion', requireAuth, async (req, res) => {
  const { projectId } = req.params;
  const { content, category } = req.body;
  if (!content || !content.trim()) return res.status(422).json({ error: 'content is required' });
  const finalCategory = CATEGORIES.includes(category) ? category : 'general';

  const [projectRows] = await pool.query('SELECT id FROM projects WHERE id = ?', [projectId]);
  if (projectRows.length === 0) return res.status(404).json({ error: 'Project not found' });

  const id = uuid();
  await pool.query(
    `INSERT INTO discussion_posts (id, project_id, author_id, category, content) VALUES (?, ?, ?, ?, ?)`,
    [id, projectId, req.user.id, finalCategory, content.trim()]
  );
  res.status(201).json({ data: { id } });
});

// AI Discussion Analysis — condenses the thread into "most-discussed concern +
// suggested action". Uses Claude if ANTHROPIC_API_KEY is set and the call
// succeeds; otherwise falls back to a rule-based summary automatically, so a
// live demo never breaks on a network hiccup.
router.get('/projects/:projectId/discussion/summary', requireAuth, async (req, res) => {
  const { projectId } = req.params;
  const [posts] = await pool.query(
    `SELECT p.category, p.content, u.name AS author_name
     FROM discussion_posts p JOIN users u ON p.author_id = u.id
     WHERE p.project_id = ? ORDER BY p.created_at ASC`,
    [projectId]
  );
  const [flags] = await pool.query(
    `SELECT f.text, m.title AS milestone_title
     FROM flags f JOIN milestones m ON f.milestone_id = m.id
     WHERE m.project_id = ?`,
    [projectId]
  );

  const summary = await summarizeDiscussion(posts, flags);
  res.json({ data: summary });
});

export default router;
