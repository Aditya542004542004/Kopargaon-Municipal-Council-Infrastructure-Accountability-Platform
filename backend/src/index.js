import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import path from 'path';
import multer from 'multer';
import rateLimit from 'express-rate-limit';
import compression from 'compression'; // 👈 Payload Compression Import
import helmet from 'helmet'; // 👈 HTTP Security Import

import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import milestoneRoutes from './routes/milestones.js';
import auditRoutes from './routes/audit.js';
import userRoutes from './routes/users.js';
import demandRoutes from './routes/demands.js';
import discussionRoutes from './routes/discussion.js';

const app = express();

// ----------------------------------------------------
// 1. SECURITY & COMPRESSION MIDDLEWARE
// ----------------------------------------------------
app.use(helmet({ crossOriginResourcePolicy: false })); // Secures HTTP headers
app.use(compression()); // Shrinks JSON response size by ~70%
app.use(cors());

app.use(express.json({ limit: '25mb' }));
app.use(express.urlencoded({ limit: '25mb', extended: true }));

// ----------------------------------------------------
// 2. API RATE LIMITING (Spam & Brute-Force Protection)
// ----------------------------------------------------
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 300, // Limit each IP to 300 requests per window
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests from this IP. Please try again later.' },
});

const strictAuthLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // Limit login attempts
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
});

app.use('/auth/login', strictAuthLimiter);
app.use('/auth/register', strictAuthLimiter);
app.use(apiLimiter);

// ----------------------------------------------------
// 3. STATIC MEDIA BROWSER CACHING
// ----------------------------------------------------
app.use(
  '/uploads',
  express.static(path.join(process.cwd(), 'uploads'), {
    maxAge: '1d', // Cache photos in user browser for 24 hours
    immutable: true,
  })
);

app.get('/health', (req, res) => res.json({ status: 'ok' }));

// Route Mounts
app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/', milestoneRoutes);
app.use('/', auditRoutes);
app.use('/demands', demandRoutes);
app.use('/', discussionRoutes);

// Centralized Error Handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message === 'Only image uploads are allowed') {
    return res.status(422).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Kopargaon API listening on port ${port}`));