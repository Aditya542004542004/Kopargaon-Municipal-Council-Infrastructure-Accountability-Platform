-- Kopargaon Infrastructure Accountability Platform — schema
-- Hand-written SQL (no ORM) so every table and constraint is something you can explain directly.

CREATE TABLE IF NOT EXISTS users (
  id            CHAR(36)     PRIMARY KEY,
  name          VARCHAR(255) NOT NULL,
  email         VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  role          ENUM('authority', 'contractor', 'engineer', 'citizen') NOT NULL,
  ward          VARCHAR(100),
  created_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS projects (
  id             CHAR(36)      PRIMARY KEY,
  name           VARCHAR(255)  NOT NULL,
  ward           VARCHAR(100)  NOT NULL,
  department     VARCHAR(255)  NOT NULL,
  budget_total   DECIMAL(14,2) NOT NULL,
  budget_spent   DECIMAL(14,2) NOT NULL DEFAULT 0,
  contractor_id  CHAR(36)      NOT NULL,
  authority_id   CHAR(36)      NOT NULL,
  start_date     DATE          NOT NULL,
  end_date       DATE          NOT NULL,
  latitude       DECIMAL(10,7) NOT NULL DEFAULT 19.8887,
  longitude      DECIMAL(10,7) NOT NULL DEFAULT 74.4784,
  created_at     TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (contractor_id) REFERENCES users(id),
  FOREIGN KEY (authority_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS milestones (
  id                CHAR(36)     PRIMARY KEY,
  project_id        CHAR(36)     NOT NULL,
  title             VARCHAR(255) NOT NULL,
  progress_percent  INT          NOT NULL CHECK (progress_percent BETWEEN 0 AND 100),
  budget_spent      DECIMAL(14,2) NOT NULL DEFAULT 0,
  note              TEXT,
  photo_url         VARCHAR(500),
  submitted_by      CHAR(36)     NOT NULL,
  submitted_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status            ENUM('submitted', 'verified', 'rejected') NOT NULL DEFAULT 'submitted',
  engineer_id       CHAR(36),
  engineer_comment  TEXT,
  verified_at       TIMESTAMP NULL,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (submitted_by) REFERENCES users(id),
  FOREIGN KEY (engineer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS flags (
  id           CHAR(36) PRIMARY KEY,
  milestone_id CHAR(36) NOT NULL,
  citizen_id   CHAR(36) NOT NULL,
  text         TEXT     NOT NULL,
  photo_url    VARCHAR(500),
  status       ENUM('pending', 'resolved') NOT NULL DEFAULT 'pending',
  resolved_by  CHAR(36),
  resolved_at  TIMESTAMP NULL,
  flagged_at   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (milestone_id) REFERENCES milestones(id),
  FOREIGN KEY (citizen_id) REFERENCES users(id),
  FOREIGN KEY (resolved_by) REFERENCES users(id)
);

-- Append-only by convention AND by DB privilege: see scripts/migrate.js,
-- which revokes UPDATE/DELETE on this table for the app's DB user after creation.
CREATE TABLE IF NOT EXISTS audit_log (
  id         CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  event_type ENUM('project_created', 'milestone_submitted', 'milestone_verified', 'milestone_rejected', 'flag_raised') NOT NULL,
  actor_id   CHAR(36) NOT NULL,
  detail     JSON     NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (actor_id) REFERENCES users(id)
);

-- Community Need Identification: citizens raise and upvote local infrastructure
-- problems before they become official projects. An Authority can later link an
-- approved project back to the demand that motivated it.
CREATE TABLE IF NOT EXISTS community_demands (
  id                CHAR(36)     PRIMARY KEY,
  title             VARCHAR(255) NOT NULL,
  ward              VARCHAR(100) NOT NULL,
  category          VARCHAR(100) NOT NULL,
  description       TEXT,
  photo_url         VARCHAR(500),
  status            ENUM('open', 'linked') NOT NULL DEFAULT 'open',
  linked_project_id CHAR(36),
  created_by        CHAR(36)     NOT NULL,
  created_at        TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (linked_project_id) REFERENCES projects(id),
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS demand_votes (
  id         CHAR(36) PRIMARY KEY,
  demand_id  CHAR(36) NOT NULL,
  citizen_id CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (demand_id) REFERENCES community_demands(id),
  FOREIGN KEY (citizen_id) REFERENCES users(id),
  UNIQUE KEY unique_vote (demand_id, citizen_id)
);

-- Project Discussion Space: a per-project forum, loosely modeled on
-- LeetCode-style discussion tabs (General / Technical / Budget / Suggestion).
CREATE TABLE IF NOT EXISTS discussion_posts (
  id         CHAR(36) PRIMARY KEY,
  project_id CHAR(36) NOT NULL,
  author_id  CHAR(36) NOT NULL,
  category   ENUM('general', 'technical', 'budget', 'suggestion') NOT NULL DEFAULT 'general',
  content    TEXT     NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id),
  FOREIGN KEY (author_id) REFERENCES users(id)
);