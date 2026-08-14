import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import multer from 'multer';

import authRoutes from './routes/auth.js';
import projectRoutes from './routes/projects.js';
import milestoneRoutes from './routes/milestones.js';
import auditRoutes from './routes/audit.js';
import userRoutes from './routes/users.js';
import demandRoutes from './routes/demands.js';
import discussionRoutes from './routes/discussion.js';

dotenv.config({ path: new URL('../.env', import.meta.url) });

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

app.get('/health', (req, res) => res.json({ status: 'ok' }));

app.use('/auth', authRoutes);
app.use('/users', userRoutes);
app.use('/projects', projectRoutes);
app.use('/', milestoneRoutes); // mounts /projects/:projectId/milestones and /milestones/:id/*
app.use('/', auditRoutes); // mounts /projects/:id/audit-trail
app.use('/demands', demandRoutes);
app.use('/', discussionRoutes); // mounts /projects/:projectId/discussion and /discussion/summary

// Centralized error handler — keeps route handlers free of try/catch boilerplate
// for anything that isn't a deliberate validation check.
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message === 'Only image uploads are allowed') {
    return res.status(422).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

const port = process.env.PORT || 4000;
app.listen(port, () => console.log(`Kopargaon API listening on port ${port}`));
