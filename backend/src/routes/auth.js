import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuid } from 'uuid';
import { pool } from '../lib/db.js';

const router = Router();

// Public self-registration is restricted to Citizens only.
// Contractor, Engineer, and Authority roles are institutional roles 
// provisioned exclusively by an existing Authority user via POST /users.
router.post('/register', async (req, res) => {
  const { name, email, password, role, ward } = req.body;

  if (!name || !email || !password) {
    return res.status(422).json({ error: 'name, email, and password are required' });
  }

  // GROUND FEASIBILITY CHECK: Block self-registration for non-citizen roles
  const requestedRole = role || 'citizen';
  if (requestedRole !== 'citizen') {
    return res.status(403).json({ 
      error: 'Self-registration is restricted to Citizens only. Contractor and Engineer accounts must be provisioned by the Municipal Authority via the Account Provisioning panel.' 
    });
  }

  const cleanEmail = email.trim().toLowerCase();
  const cleanName = name.trim();

  const [existing] = await pool.query('SELECT id FROM users WHERE email = ?', [cleanEmail]);
  if (existing.length > 0) {
    return res.status(409).json({ error: 'An account with this email already exists' });
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const id = uuid();

  await pool.query(
    'INSERT INTO users (id, name, email, password_hash, role, ward) VALUES (?, ?, ?, ?, ?, ?)',
    [id, cleanName, cleanEmail, passwordHash, 'citizen', ward || null]
  );

  const jwtSecret = process.env.JWT_SECRET || 'kopargaon_secret';
  const token = jwt.sign({ id, role: 'citizen', name: cleanName }, jwtSecret, { expiresIn: '24h' });

  res.status(201).json({ 
    data: { 
      token, 
      user: { id, name: cleanName, email: cleanEmail, role: 'citizen', ward } 
    } 
  });
});

// Login endpoint for all roles (Authority, Contractor, Engineer, Citizen)
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(422).json({ error: 'email and password are required' });
  }

  const cleanEmail = email.trim().toLowerCase();
  const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [cleanEmail]);
  const user = rows[0];

  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const valid = await bcrypt.compare(password, user.password_hash);
  if (!valid) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }

  const jwtSecret = process.env.JWT_SECRET || 'kopargaon_secret';
  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name }, 
    jwtSecret, 
    { expiresIn: '24h' }
  );

  res.json({ 
    data: { 
      token, 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        ward: user.ward 
      } 
    } 
  });
});

export default router;