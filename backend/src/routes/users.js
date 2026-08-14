import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import { pool } from '../lib/db.js';
import { requireAuth, requireRole } from '../middleware/auth.js';

const router = Router();

// Lets the frontend populate role-specific pickers (e.g. Authority selecting
// a Contractor when creating a project). Deliberately returns no password data.
router.get('/', requireAuth, async (req, res) => {
  const { role } = req.query;
  const validRoles = ['authority', 'contractor', 'engineer', 'citizen'];
  if (role && !validRoles.includes(role)) {
    return res.status(422).json({ error: `role must be one of: ${validRoles.join(', ')}` });
  }

  const [rows] = role
    ? await pool.query('SELECT id, name, email, role, ward FROM users WHERE role = ?', [role])
    : await pool.query('SELECT id, name, email, role, ward FROM users');

  res.json({ data: rows });
});

// Authority provisions institutional accounts (Contractor/Engineer/Authority).
// Citizens self-register via /auth/register instead — see that route's comment
// for why the split exists.
router.post('/', requireAuth, requireRole('authority'), async (req, res) => {
  const { name, email, password, role, ward } = req.body;
  const validRoles = ['authority', 'contractor', 'engineer'];
  if (!name || !email || !password || !role) {
    return res.status(422).json({ error: 'name, email, password, and role are required' });
  }
  if (!validRoles.includes(role)) {
    return res.status(422).json({ error: `role must be one of: ${validRoles.join(', ')} (citizens self-register via /auth/register)` });
  }

  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = uuid();
  await pool.query(
    'INSERT INTO users (id, name, email, password_hash, role, ward) VALUES (?, ?, ?, ?, ?, ?)',
    [id, name, email, passwordHash, role, ward || null]
  );
  res.status(201).json({ data: { id, name, email, role, ward } });
});

export default router;
