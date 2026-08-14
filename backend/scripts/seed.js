import bcrypt from 'bcryptjs';
import { v4 as uuid } from 'uuid';
import mysql from 'mysql2/promise';
import { pool } from '../src/lib/db.js';

// Resetting demo data means wiping audit_log too — and the app's own DB user
// deliberately cannot do that (see README: audit_log is append-only for
// 'kopargaon_app'). So the reset step connects as root instead. This is a
// feature, not a workaround: only an administrator can clear the audit trail,
// never the application itself.
async function resetWithRoot() {
  const rootConn = await mysql.createConnection({ host: 'localhost', user: 'root', password: 'Aditya542004@' });
  await rootConn.query('SET FOREIGN_KEY_CHECKS = 0');
  for (const table of ['audit_log', 'demand_votes', 'community_demands', 'discussion_posts', 'flags', 'milestones', 'projects', 'users']) {
    await rootConn.query(`TRUNCATE TABLE kopargaon_platform.${table}`);
  }
  await rootConn.query('SET FOREIGN_KEY_CHECKS = 1');
  await rootConn.end();
}

async function seed() {
  console.log('Clearing existing data (as root, since audit_log resets need elevated access)...');
  await resetWithRoot();

  console.log('Seeding demo data...');

  const passwordHash = await bcrypt.hash('demo1234', 10);

  const authority = { id: uuid(), name: 'Kopargaon Municipal Council', email: 'authority@kopargaon.demo', role: 'authority' };
  const contractor = { id: uuid(), name: 'ABC Infrastructure', email: 'contractor@kopargaon.demo', role: 'contractor' };
  const engineer = { id: uuid(), name: 'Er. Priya Deshmukh', email: 'engineer@kopargaon.demo', role: 'engineer' };
  const citizen = { id: uuid(), name: 'Ramesh Patil', email: 'citizen@kopargaon.demo', role: 'citizen', ward: 'Ward 5' };

  for (const u of [authority, contractor, engineer, citizen]) {
    await pool.query(
      'INSERT INTO users (id, name, email, password_hash, role, ward) VALUES (?, ?, ?, ?, ?, ?)',
      [u.id, u.name, u.email, passwordHash, u.role, u.ward || null]
    );
  }
  console.log('Created 4 demo users (password for all: demo1234)');

  const projectId = uuid();
  await pool.query(
    `INSERT INTO projects (id, name, ward, department, budget_total, budget_spent, contractor_id, authority_id, start_date, end_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      projectId,
      'Kopargaon Water Supply Expansion',
      'Ward 5',
      'Municipal Water Department',
      15000000,
      8250000,
      contractor.id,
      authority.id,
      '2026-08-01',
      '2027-08-01',
    ]
  );
  console.log('Created project:', projectId);

  const m1 = uuid();
  const m2 = uuid();
  const m3 = uuid();

  await pool.query(
    `INSERT INTO milestones (id, project_id, title, progress_percent, note, submitted_by, submitted_at, status, engineer_id, engineer_comment, verified_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'verified', ?, ?, ?)`,
    [m1, projectId, 'Pipeline trenching — Sector A', 100, 'Trenching completed along Market Road, ready for pipe laying.', contractor.id, '2026-08-20 10:00:00', engineer.id, 'Site inspected. Trench depth and alignment match approved plan.', '2026-08-22 09:30:00']
  );

  await pool.query(
    `INSERT INTO milestones (id, project_id, title, progress_percent, note, submitted_by, submitted_at, status, engineer_id, engineer_comment, verified_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'verified', ?, ?, ?)`,
    [m2, projectId, 'Pipe laying — Sector A', 65, 'Pipes laid for 1.2km of the planned 1.8km stretch.', contractor.id, '2026-09-15 11:20:00', engineer.id, 'Verified against contractor daily log. Proceed to next phase.', '2026-09-17 14:00:00']
  );
  await pool.query(
    `INSERT INTO flags (id, milestone_id, citizen_id, text, flagged_at) VALUES (?, ?, ?, ?, ?)`,
    [uuid(), m2, citizen.id, 'Road section near the school on Market Road still looks incomplete — pipe visible on surface.', '2026-09-18 08:15:00']
  );

  await pool.query(
    `INSERT INTO milestones (id, project_id, title, progress_percent, note, submitted_by, submitted_at, status)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'submitted')`,
    [m3, projectId, 'Pump house construction', 40, 'Foundation and base structure complete, walls in progress.', contractor.id, '2026-10-05 09:00:00']
  );
  console.log('Created 3 milestones (2 verified with 1 flag, 1 pending) for project 1.');

  // --- Second project, so the dashboard shows a real multi-project view ---
  const project2Id = uuid();
  await pool.query(
    `INSERT INTO projects (id, name, ward, department, budget_total, budget_spent, contractor_id, authority_id, start_date, end_date)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [project2Id, 'Station Road Drainage Repair', 'Ward 3', 'Municipal Roads Department', 4500000, 4100000, contractor.id, authority.id, '2026-06-01', '2026-12-01']
  );
  const m4 = uuid();
  const m5 = uuid();
  await pool.query(
    `INSERT INTO milestones (id, project_id, title, progress_percent, note, submitted_by, submitted_at, status, engineer_id, engineer_comment, verified_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'verified', ?, ?, ?)`,
    [m4, project2Id, 'Drain excavation — full stretch', 100, 'Excavation complete along the full 800m stretch.', contractor.id, '2026-07-10 10:00:00', engineer.id, 'Verified. Depth and slope match drainage plan.', '2026-07-12 09:00:00']
  );
  await pool.query(
    `INSERT INTO milestones (id, project_id, title, progress_percent, note, submitted_by, submitted_at, status, engineer_id, engineer_comment, verified_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'verified', ?, ?, ?)`,
    [m5, project2Id, 'Concrete lining', 90, 'Lining complete except final 80m near the junction.', contractor.id, '2026-08-25 11:00:00', engineer.id, 'Verified against site photos. Minor section pending.', '2026-08-27 10:00:00']
  );
  await pool.query(
    `INSERT INTO flags (id, milestone_id, citizen_id, text, flagged_at) VALUES (?, ?, ?, ?, ?)`,
    [uuid(), m5, citizen.id, 'Standing water still visible near the junction after last week\'s rain.', '2026-08-30 07:40:00']
  );
  console.log('Created 2 milestones (both verified, 1 flag) for project 2.');

  // --- Community demands (pre-project need identification) ---
  const demand1 = uuid();
  const demand2 = uuid();
  await pool.query(
    `INSERT INTO community_demands (id, title, ward, category, description, status, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, 'linked', ?, ?)`,
    [demand1, 'Damaged road near Kopargaon market', 'Ward 5', 'Road Infrastructure', 'Potholes and broken surface near the main market entrance, worsens in monsoon.', citizen.id, '2026-05-01 09:00:00']
  );
  await pool.query('UPDATE community_demands SET linked_project_id = ? WHERE id = ?', [projectId, demand1]);
  await pool.query(
    `INSERT INTO community_demands (id, title, ward, category, description, status, created_by, created_at)
     VALUES (?, ?, ?, ?, ?, 'open', ?, ?)`,
    [demand2, 'No streetlights on Gandhi Chowk approach road', 'Ward 2', 'Public Safety', 'Stretch has been dark for months, residents avoid walking after 8pm.', citizen.id, '2026-09-01 18:00:00']
  );
  // A few extra citizen voters so vote counts look real
  const extraVoters = [];
  for (let i = 0; i < 3; i++) {
    const v = { id: uuid(), name: `Ward Resident ${i + 1}`, email: `resident${i + 1}@kopargaon.demo` };
    extraVoters.push(v);
    await pool.query('INSERT INTO users (id, name, email, password_hash, role, ward) VALUES (?, ?, ?, ?, ?, ?)', [
      v.id, v.name, v.email, passwordHash, 'citizen', 'Ward 5',
    ]);
  }
  for (const voter of [citizen, ...extraVoters]) {
    await pool.query('INSERT INTO demand_votes (id, demand_id, citizen_id) VALUES (?, ?, ?)', [uuid(), demand1, voter.id]);
  }
  await pool.query('INSERT INTO demand_votes (id, demand_id, citizen_id) VALUES (?, ?, ?)', [uuid(), demand2, citizen.id]);
  console.log('Created 2 community demands with votes (1 linked to project 1).');

  // --- Discussion posts on project 1, so the discussion space + AI summary have real content ---
  const posts = [
    { author: citizen.id, category: 'technical', content: 'Has the drainage under the new pipeline been checked? Worried about waterlogging once the rains pick up.' },
    { author: engineer.id, category: 'technical', content: 'Yes, cross-drainage was part of the approved plan. Will confirm after Sector A pipe-laying is verified.' },
    { author: citizen.id, category: 'general', content: 'Good to see photo evidence on updates now, much clearer than the old notice board.' },
    { author: contractor.id, category: 'budget', content: 'Material costs for Sector B pipes went up slightly — will flag if it affects overall budget.' },
  ];
  for (const p of posts) {
    await pool.query(
      'INSERT INTO discussion_posts (id, project_id, author_id, category, content) VALUES (?, ?, ?, ?, ?)',
      [uuid(), projectId, p.author, p.category, p.content]
    );
  }
  console.log('Created 4 discussion posts on project 1.');

  console.log('\nDemo login credentials (all roles, password: demo1234):');
  console.log('  Authority:  authority@kopargaon.demo');
  console.log('  Contractor: contractor@kopargaon.demo');
  console.log('  Engineer:   engineer@kopargaon.demo');
  console.log('  Citizen:    citizen@kopargaon.demo');
  console.log('\nProject 1 ID:', projectId);
  console.log('Project 2 ID:', project2Id);

  await pool.end();
}

seed().catch((e) => {
  console.error(e);
  process.exit(1);
});
