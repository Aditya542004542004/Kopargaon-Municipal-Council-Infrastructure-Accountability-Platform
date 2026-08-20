import { Router } from 'express';
import { v4 as uuid } from 'uuid';
import { pool } from '../lib/db.js';
import { requireAuth } from '../middleware/auth.js';
import { summarizeDiscussion } from '../services/discussionSummary.js';

const router = Router();

const CATEGORIES = ['general', 'technical', 'budget', 'suggestion', 'quality', 'delay', 'safety'];

// GET /projects/:projectId/discussion — List posts
router.get('/projects/:projectId/discussion', requireAuth, async (req, res) => {
  const { projectId } = req.params;
  try {
    const [rows] = await pool.query(
      `SELECT p.*, u.name AS author_name, u.role AS author_role
       FROM discussion_posts p
       JOIN users u ON p.author_id = u.id
       WHERE p.project_id = ?
       ORDER BY p.created_at ASC`,
      [projectId]
    );
    res.json({ data: rows });
  } catch (err) {
    console.error('Error fetching discussion posts:', err);
    res.status(500).json({ error: 'Failed to fetch discussion posts' });
  }
});

// POST /projects/:projectId/discussion — Add a new post
router.post('/projects/:projectId/discussion', requireAuth, async (req, res) => {
  const { projectId } = req.params;
  const { content, category } = req.body;

  if (!content || !content.trim()) {
    return res.status(422).json({ error: 'content is required' });
  }

  const finalCategory = CATEGORIES.includes(category) ? category : 'general';

  try {
    const [projectRows] = await pool.query('SELECT id FROM projects WHERE id = ?', [projectId]);
    if (projectRows.length === 0) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const id = uuid();
    await pool.query(
      `INSERT INTO discussion_posts (id, project_id, author_id, category, content) VALUES (?, ?, ?, ?, ?)`,
      [id, projectId, req.user.id, finalCategory, content.trim()]
    );

    res.status(201).json({ data: { id, category: finalCategory, content: content.trim() } });
  } catch (err) {
    console.error('Error posting discussion comment:', err);
    res.status(500).json({ error: err.message || 'Failed to post discussion message' });
  }
});

// GET /projects/:projectId/discussion/summary — AI Summary
router.get('/projects/:projectId/discussion/summary', requireAuth, async (req, res) => {
  const { projectId } = req.params;
  try {
    const [posts] = await pool.query(
      `SELECT p.category, p.content, p.created_at, u.name AS author_name
       FROM discussion_posts p JOIN users u ON p.author_id = u.id
       WHERE p.project_id = ? ORDER BY p.created_at ASC`,
      [projectId]
    );

    const [flags] = await pool.query(
      `SELECT f.text, f.flagged_at, m.title AS milestone_title
       FROM flags f JOIN milestones m ON f.milestone_id = m.id
       WHERE m.project_id = ?`,
      [projectId]
    );

    const summary = await summarizeDiscussion(posts, flags, projectId);
    res.json({ data: summary });
  } catch (err) {
    console.error('Error in discussion summary route:', err);
    res.status(500).json({ error: 'Failed to generate discussion summary' });
  }
});

export default router;