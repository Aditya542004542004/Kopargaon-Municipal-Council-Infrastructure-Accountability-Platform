import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { pool } from '../lib/db.js';

const router = Router();

// Citizens self-register. Authority/Contractor/Engineer accounts are meant to
// be provisioned by an authority user in a real deployment — for this build,
// registration is open to all roles to keep testing simple, but the frontend
// should only expose self-signup for the citizen role.
// Public self-registration is intentionally restricted to citizens — Authority,
// Contractor, and Engineer are institutional roles, provisioned by an existing
// Authority user via POST /users instead (see users.js). This mirrors how the
// real Municipal Council would actually onboard people, rather than leaving
// every role open to anyone who finds the signup form.
router.post('/register', async (req, res) => {
  const { name, email, password, ward } = req.body;
  if (!name || !email || !password) {
    return res.status(422).json({ error: 'name, email, and password are required' });
  }

  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [email]);
  if (existing.length > 0) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = uuid();
  await pool.query(
    'INSERT INTO users (id, name, email, password_hash, role, ward) VALUES (?, ?, ?, ?, ?, ?)',
    [id, name, email, passwordHash, 'citizen', ward || null]
  );

  const token = jwt.sign({ id, role: 'citizen', name }, process.env.JWT_SECRET, { expiresIn: '24h' });
  res.status(201).json({ data: { token, user: { id, name, email, role: 'citizen', ward } } });
});

router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(422).json({ error: 'email and password are required' });
  }

  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email]);
  const user = rows[0];
  if (!user) return res.status(401).json({ error: 'Invalid email or password' });

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) return res.status(401).json({ error: 'Invalid email or password' });

  const token = jwt.sign({ id: user.id, role: user.role, name: user.name }, process.env.JWT_SECRET, {
    expiresIn: '24h',
  });
  res.json({ data: { token, user: { id: user.id, name: user.name, email: user.email, role: user.role, ward: user.ward } } });
});

export default router;
