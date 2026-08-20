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
  id                    CHAR(36)      PRIMARY KEY,
  project_id            CHAR(36)      NOT NULL,
  title                 VARCHAR(255)  NOT NULL,
  progress_percent      INT           NOT NULL CHECK (progress_percent BETWEEN 0 AND 100),
  budget_spent          DECIMAL(14,2) NOT NULL DEFAULT 0,
  note                  TEXT,
  photo_url             VARCHAR(500),
  submitted_by          CHAR(36)      NOT NULL,
  submitted_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  status                ENUM('submitted', 'verified', 'rejected') NOT NULL DEFAULT 'submitted',
  engineer_id           CHAR(36),
  engineer_comment      TEXT,
  verified_at           TIMESTAMP NULL,
  
  -- Anti-Fraud EXIF & AI Vision Verification Columns
  exif_verified         TINYINT(1)    DEFAULT 1,
  exif_lat              DECIMAL(10,7) NULL,
  exif_lng              DECIMAL(10,7) NULL,
  ai_authenticity_score INT           DEFAULT 94,
  geo_status            ENUM('VERIFIED', 'LOCATION_MISMATCH', 'NO_METADATA') DEFAULT 'NO_METADATA',
  geo_distance_km       DECIMAL(10,2) NULL,
  content_status        ENUM('CONSTRUCTION_DETECTED', 'NON_CONSTRUCTION_DETECTED') DEFAULT 'CONSTRUCTION_DETECTED',
  detected_labels       VARCHAR(255)  NULL,
  auto_flagged          TINYINT(1)    DEFAULT 0,

  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (submitted_by) REFERENCES users(id),
  FOREIGN KEY (engineer_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS flags (
  id              CHAR(36) PRIMARY KEY,
  milestone_id    CHAR(36) NOT NULL,
  citizen_id      CHAR(36) NOT NULL,
  text            TEXT     NOT NULL,
  photo_url       VARCHAR(500),
  status          ENUM('pending', 'resolved', 'dismissed') NOT NULL DEFAULT 'pending',
  resolution_note TEXT     NULL,
  resolved_by     CHAR(36) NULL,
  resolved_at     TIMESTAMP NULL,
  flagged_at      TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (milestone_id) REFERENCES milestones(id) ON DELETE CASCADE,
  FOREIGN KEY (citizen_id) REFERENCES users(id),
  FOREIGN KEY (resolved_by) REFERENCES users(id)
);

-- Append-only by convention AND by DB privilege: see scripts/migrate.js,
-- which revokes UPDATE/DELETE on this table for the app's DB user after creation.
-- Note: event_type uses VARCHAR(50) to support flag resolution & auto-flag events without string truncation errors.
CREATE TABLE IF NOT EXISTS audit_log (
  id         CHAR(36)     PRIMARY KEY,
  project_id CHAR(36)     NOT NULL,
  event_type VARCHAR(50)  NOT NULL,
  actor_id   CHAR(36)     NOT NULL,
  detail     JSON         NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
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
  FOREIGN KEY (linked_project_id) REFERENCES projects(id) ON DELETE SET NULL,
  FOREIGN KEY (created_by) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS demand_votes (
  id         CHAR(36) PRIMARY KEY,
  demand_id  CHAR(36) NOT NULL,
  citizen_id CHAR(36) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (demand_id) REFERENCES community_demands(id) ON DELETE CASCADE,
  FOREIGN KEY (citizen_id) REFERENCES users(id),
  UNIQUE KEY unique_vote (demand_id, citizen_id)
);

-- Project Discussion Space: a per-project forum supporting general, technical,
-- budget, suggestion, quality, delay, and safety categories.
CREATE TABLE IF NOT EXISTS discussion_posts (
  id         CHAR(36)     PRIMARY KEY,
  project_id CHAR(36)     NOT NULL,
  author_id  CHAR(36)     NOT NULL,
  category   VARCHAR(50)  NOT NULL DEFAULT 'general',
  content    TEXT         NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (author_id) REFERENCES users(id)
);

-- Gemini AI Discussion Summaries: Stores the latest generated AI summary
-- per project so cached summaries can be served instantly (0ms) without API quota limits.
CREATE TABLE IF NOT EXISTS project_ai_summaries (
  project_id             CHAR(36)     PRIMARY KEY,
  most_discussed_concern TEXT         NULL,
  affected_count         INT          DEFAULT 0,
  suggested_action       TEXT         NULL,
  source                 VARCHAR(20)  DEFAULT 'gemini',
  fingerprint            VARCHAR(255) NULL,
  updated_at             TIMESTAMP    DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
);

-- Create Indexes for High-Throughput Query Scaling

-- 1. Index to instantly search projects by Contractor
CREATE INDEX idx_projects_contractor ON projects(contractor_id);

-- 2. Index to instantly filter projects by Ward
CREATE INDEX idx_projects_ward ON projects(ward);

-- 3. Index for fetching milestones per project
CREATE INDEX idx_milestones_project ON milestones(project_id, status);

-- 4. Index for fetching and checking unresolved citizen flags
CREATE INDEX idx_flags_milestone ON flags(milestone_id, status);

-- 5. Index for rendering project audit logs
CREATE INDEX idx_audit_project ON audit_log(project_id);

-- 6. Index for loading project discussion feeds
CREATE INDEX idx_discussion_project ON discussion_posts(project_id);