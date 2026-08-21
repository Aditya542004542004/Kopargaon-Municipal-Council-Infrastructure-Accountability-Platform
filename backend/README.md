# Kopargaon Infrastructure Accountability Platform — Backend

Node.js + Express + MySQL (raw SQL via `mysql2`, no ORM — every query is hand-written and
explainable). Implements the verification chain, Governance Trust Index, real EXIF/AI
evidence verification, and an append-only audit log enforced at the database privilege
level, not just by convention.

## Setup

### 1. Create the database and app user

```sql
CREATE DATABASE kopargaon_platform;
CREATE USER 'kopargaon_app'@'localhost' IDENTIFIED BY 'your_password_here';
GRANT ALL PRIVILEGES ON kopargaon_platform.* TO 'kopargaon_app'@'localhost';
FLUSH PRIVILEGES;
```

Avoid special characters like `@` in the password if you can — they can conflict with the
`@` separator in the `DATABASE_URL` connection string format later.

### 2. Configure environment

Copy `.env.example` to `.env` and fill in your MySQL password and a JWT secret.

### 3. Create the schema

```bash
npm run migrate
```

### 4. Lock down the audit log (manual — requires root/admin MySQL access)

This is the step that makes "immutable audit trail" a real, enforced claim instead of a
promise in the code. Run as root (or any user with GRANT privileges), **not** as the app user:

```sql
REVOKE ALL PRIVILEGES ON kopargaon_platform.* FROM 'kopargaon_app'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON kopargaon_platform.users TO 'kopargaon_app'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON kopargaon_platform.projects TO 'kopargaon_app'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON kopargaon_platform.milestones TO 'kopargaon_app'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON kopargaon_platform.flags TO 'kopargaon_app'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON kopargaon_platform.community_demands TO 'kopargaon_app'@'localhost';
GRANT SELECT, INSERT, DELETE ON kopargaon_platform.demand_votes TO 'kopargaon_app'@'localhost';
GRANT SELECT, INSERT, UPDATE, DELETE ON kopargaon_platform.discussion_posts TO 'kopargaon_app'@'localhost';
GRANT SELECT, INSERT ON kopargaon_platform.audit_log TO 'kopargaon_app'@'localhost';
FLUSH PRIVILEGES;
```

Why not just `REVOKE UPDATE, DELETE ON audit_log`? Because the original grant was made at
the *database* level (`kopargaon_platform.*`), and MySQL requires a revoke to match the
level at which a grant exists. The fix is to replace the broad database-level grant with
explicit table-level grants, restricting `audit_log` to `SELECT, INSERT` only. You can
verify it worked with `SHOW GRANTS FOR 'kopargaon_app'@'localhost';`.

**Proof it works:** even the app's own database user cannot bypass this —
`UPDATE audit_log SET ...` run directly in a MySQL client, logged in as `kopargaon_app`,
returns `ERROR 1142 (42000): UPDATE command denied`.

**Note:** `audit_log.project_id` is nullable — governance actions that aren't tied to a
specific project (like an Authority provisioning a new Contractor account) are logged with
`project_id = NULL`. There's currently no dedicated UI view for these platform-level
entries (only per-project audit trails are shown), but they're captured in the database.

### 5. Seed demo data

```bash
npm run seed
```

Creates 4 demo users (one per role, password `demo1234` for all) and two projects with
milestones, community demands, and discussion posts, matching the examples used throughout
the pitch deck. Safe to re-run any time — it resets to a clean state first.

**Note on the reset step:** because `audit_log` is genuinely append-only for the app's DB
user (see above), clearing it for a fresh demo requires root access, same as setting up the
grants did. The script connects as root via a Unix socket (`/var/run/mysqld/mysqld.sock`),
which matches a default Ubuntu MySQL install with `auth_socket` for root. If your local setup
uses a root password instead (common on Windows/Mac installs), change the `resetWithRoot()`
connection in `scripts/seed.js` to `{ host: 'localhost', user: 'root', password: 'your_root_password' }`.

| Role | Email |
|---|---|
| Authority | authority@kopargaon.demo |
| Contractor | contractor@kopargaon.demo |
| Engineer | engineer@kopargaon.demo |
| Citizen | citizen@kopargaon.demo |

### 6. Run

```bash
npm run dev
```

API listens on `http://localhost:4000` by default.

## Notes on what's real vs. simplified in this build

- **Real**: auth (JWT + bcrypt), role enforcement (including server-side contractor-to-project
  assignment checks, not just UI hiding), transactional writes (a milestone action and its
  audit log entry commit or roll back together), the Governance Trust Index formula, DB-enforced
  audit log immutability, real file uploads via `multer`, real EXIF GPS extraction with
  haversine-distance geofencing, real local Vision Transformer image classification (not a
  filename/size heuristic), rate limiting (`express-rate-limit`) and security headers (`helmet`)
  on every route, response compression.
- **Restricted by design, not a gap**: public self-registration only creates `citizen`
  accounts. Authority/Contractor/Engineer accounts are provisioned by an existing Authority
  user via `POST /users` — this mirrors how the real Municipal Council would actually
  onboard institutional users, rather than leaving every role open to public signup.
- **Simplified**: no password reset flow. The on-device image classifier is a lightweight
  model tuned to catch obvious fraud cases (memes, screenshots, unrelated photos) — treat it
  as a strong signal for human review, not an infallible verdict. Single-region architecture
  (one municipal deployment); multi-city support would need ward/city added as a partition
  key, which is a straightforward schema extension, not a redesign.