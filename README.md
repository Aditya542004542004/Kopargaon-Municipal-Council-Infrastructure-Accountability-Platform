# Kopargaon Infrastructure Accountability Platform

> A city-specific digital governance platform for phase-wise monitoring,
> verification, and citizen accountability of municipal infrastructure projects.

---

## 1. Overview

The **Kopargaon Infrastructure Accountability Platform** is a full-stack
e-governance application designed to improve how municipal infrastructure
projects are monitored from execution to public verification.

The platform focuses on a single city — **Kopargaon** — to keep the system
practical, measurable, and scalable.

Instead of allowing project progress to exist only as a self-reported status,
the platform creates a verification chain:

    Municipal Authority
            ↓
    Project Creation
            ↓
    Contractor submits milestone
            ↓
    Engineer verifies / rejects
            ↓
    Verified progress becomes official
            ↓
    Citizens can view and flag discrepancies
            ↓
    Governance Trust Index updates
            ↓
    Audit trail records the activity

The goal is to create a transparent connection between:

    APPROVED PROJECT → ACTUAL EXECUTION → VERIFIED PROGRESS → PUBLIC VISIBILITY

---

# 2. Problem Statement

Municipal infrastructure projects such as:

- Road construction and repairs
- Water supply projects
- Drainage systems
- Public buildings
- Other civic infrastructure

often involve multiple stakeholders and several execution phases.

However, residents may have limited visibility into:

- Actual project progress
- Whether reported progress has been technically verified
- Budget utilization versus physical progress
- Delays or stalled work
- Quality or execution concerns
- Who is responsible for approving reported progress

This creates a gap between:

> **What is reported → What is actually verified → What citizens can see**

The Kopargaon Infrastructure Accountability Platform addresses this gap by
creating a structured digital verification and accountability layer.

---

# 3. Core Objectives

The platform aims to:

1. Digitize municipal infrastructure project information.
2. Track projects phase-by-phase.
3. Require technical verification before progress becomes official.
4. Provide citizens with transparent project information.
5. Allow citizens to report discrepancies.
6. Compare project budget with verified physical progress.
7. Maintain an auditable history of important project actions.
8. Generate a Governance Trust Index for every project.
9. Establish a foundation that can later scale to other cities.

---

# 4. Key Stakeholders

The system contains four primary roles.

### Municipal Authority

Responsible for:

- Creating infrastructure projects
- Assigning contractors and engineers
- Managing project information
- Monitoring overall project performance
- Provisioning institutional accounts

### Contractor

Responsible for:

- Viewing assigned projects
- Submitting milestone progress
- Uploading execution evidence
- Providing progress notes

### Engineer

Responsible for:

- Reviewing contractor submissions
- Verifying milestone progress
- Rejecting incorrect submissions
- Adding verification comments

### Citizen

Responsible for:

- Viewing verified project information
- Monitoring project progress
- Reporting discrepancies
- Uploading supporting evidence
- Providing field-level feedback

---

# 5. Core Features

## 5.1 Digital Project Passport

Every infrastructure project receives a digital project profile containing:

- Project name
- Ward
- Department
- Budget
- Contractor
- Assigned engineer
- Start date
- Expected completion date
- Current progress
- Project status

Example:

> Kopargaon Water Supply Expansion  
> Ward 5  
> Budget: ₹15 Cr

---

## 5.2 Phase-wise Milestone Monitoring

Projects are divided into execution milestones.

Contractors submit:

- Milestone title
- Progress percentage
- Notes
- Evidence photograph
- Submission timestamp

A milestone does not automatically become verified progress.

It must pass through the engineer verification stage.

---

## 5.3 Engineer Verification

The engineer reviews every contractor milestone.

Possible outcomes:

### Verified

The milestone is accepted and contributes to official project progress.

### Rejected

The milestone is rejected and does not count as verified progress.

The engineer can also provide a verification comment.

This creates the core accountability chain:

    Contractor Claim
          ↓
    Engineer Review
       ↙       ↘
   Verified    Rejected

---

## 5.4 Citizen Verification Layer

Citizens can independently observe project execution.

If the reported project status does not match the ground reality, a citizen
can submit a flag/dispute.

Example:

> "The road near the school is still incomplete even though the project
> dashboard shows the milestone as completed."

Citizens can attach supporting evidence.

This means engineer verification does not completely remove public oversight.

---

## 5.5 Governance Trust Index

Every project receives a dynamically calculated **Governance Trust Index**.

The index considers factors such as:

- Verification rate
- Update frequency
- Unresolved citizen flags

The purpose is not to label a contractor as "good" or "bad."

Instead, it provides a quick governance-health signal indicating how reliably
the project's reported status is being maintained.

The index is calculated dynamically from project data rather than being a
hardcoded value.

---

## 5.6 Budget vs Progress Monitoring

The platform compares:

    Allocated Budget
          vs
    Project Spending
          vs
    Verified Physical Progress

This helps identify situations such as:

- High spending but low physical progress
- Delayed execution
- Projects with insufficient updates
- Projects requiring administrative attention

---

## 5.7 Audit Trail

Important project actions are recorded in an audit trail.

Examples include:

- Project creation
- Milestone submission
- Milestone verification
- Milestone rejection
- Citizen flags
- Other important governance actions

The audit trail provides a historical record of what happened and when.

---

## 5.8 Role-Based Access Control

Different users receive different capabilities.

For example:

| Action | Authority | Contractor | Engineer | Citizen |
|---|---:|---:|---:|---:|
| Create project | ✓ | ✗ | ✗ | ✗ |
| Submit milestone | ✗ | ✓ | ✗ | ✗ |
| Verify milestone | ✗ | ✗ | ✓ | ✗ |
| View project | ✓ | ✓ | ✓ | ✓ |
| Flag project | ✗ | ✗ | ✗ | ✓ |
| Manage institutional accounts | ✓ | ✗ | ✗ | ✗ |

Authorization is enforced by the backend rather than relying only on the
frontend interface.

---

# 6. Technology Stack

## Frontend

- React
- Vite
- Tailwind CSS
- JavaScript

## Backend

- Node.js
- Express.js
- REST APIs
- JWT authentication
- bcrypt password hashing
- Multer for multipart file uploads

## Database

- MySQL 8

## Storage

- Local filesystem for uploaded evidence during development/demo

## Development Environment

- Windows
- VS Code
- MySQL running locally

---

# 7. System Architecture

```text
┌───────────────────────────────────────────────┐
│                  React Frontend               │
│                                               │
│  Authority │ Contractor │ Engineer │ Citizen  │
└───────────────────────┬───────────────────────┘
                        │
                        │ HTTP / REST API
                        ▼
┌───────────────────────────────────────────────┐
│              Node.js + Express                │
│                                               │
│  Authentication                               │
│  Authorization                                │
│  Project APIs                                 │
│  Milestone APIs                               │
│  Citizen Flag APIs                            │
│  Audit APIs                                   │
│  Governance Trust Index                       │
│  File Upload Handling                         │
└───────────────┬───────────────────┬───────────┘
                │                   │
                ▼                   ▼
       ┌────────────────┐   ┌─────────────────┐
       │     MySQL      │   │ Evidence Files  │
       │                │   │                 │
       │ Users          │   │ Uploaded photos │
       │ Projects       │   │                 │
       │ Milestones     │   └─────────────────┘
       │ Flags          │
       │ Audit Logs     │
       └────────────────┘

       8. Database Design

The main entities are:

users
projects
milestones
citizen_flags
audit_log
users

Stores platform users and their roles.

Important fields include:

id
name
email
password_hash
role
created_at
projects

Stores municipal infrastructure projects.

Important fields include:

id
name
description
ward
department
budget
contractor_id
engineer_id
start_date
expected_completion_date
status
created_at
milestones

Stores phase-wise project progress.

Important fields include:

id
project_id
title
progress_percent
note
evidence_path
status
submitted_by
verified_by
verification_comment
timestamps
citizen_flags

Stores citizen-reported discrepancies.

Important fields include:

id
project_id
milestone_id
citizen_id
description
evidence_path
status
created_at
audit_log

Stores important system events.

Important fields include:

id
project_id
actor_id
action
detail
created_at

The audit system provides traceability for governance actions.

9. Authentication Flow

The application uses JWT-based authentication.

User
 │
 │ Email + Password
 ▼
POST /auth/login
 │
 ▼
Backend verifies password
 │
 ▼
JWT generated
 │
 ▼
Frontend stores authentication state
 │
 ▼
JWT sent with protected API requests
 │
 ▼
Backend verifies JWT
 │
 ▼
Role-based authorization
 │
 ▼
Request allowed / rejected

Passwords are stored using bcrypt hashing rather than plaintext.

10. Authorization Model

Authentication answers:

"Who are you?"

Authorization answers:

"What are you allowed to do?"

The backend enforces role-specific permissions.

Examples:

Citizen → cannot verify milestone
Contractor → cannot create municipal project
Engineer → can verify assigned project milestones
Authority → can create projects and provision institutional accounts

These rules are enforced server-side.

11. Milestone State Machine

A milestone follows a controlled lifecycle.

        Contractor
           │
           ▼
       SUBMITTED
        /      \
       /        \
      ▼          ▼
 VERIFIED      REJECTED
      │
      ▼
 Official
 Progress

Only verified milestones contribute to official verified project progress.

A citizen can subsequently flag a verified milestone if the reported state
does not match ground reality.

12. Evidence Upload

Project evidence is submitted using multipart/form-data.

The backend uses Multer to process uploaded files.

React Form
    │
    │ multipart/form-data
    ▼
Express Route
    │
    ▼
Multer
    │
    ├── Text fields → req.body
    │
    └── File → req.file
              │
              ▼
         Local Storage
              │
              ▼
        Database stores
        evidence reference

During local development, evidence files are stored on the local filesystem.

For production deployment, this can be replaced by object storage such as
S3-compatible storage.

13. Governance Trust Index

The Governance Trust Index is computed from project-level signals.

Conceptually:

Governance Trust Index
        │
        ├── Verification Rate
        │
        ├── Update Frequency
        │
        └── Unresolved Citizen Flags

The score is recalculated as project data changes.

For example:

Milestone Submitted
        ↓
Engineer Verifies
        ↓
Verification Rate changes
        ↓
Trust Index recalculates

The score is intended as a governance-health indicator rather than an
absolute measure of contractor performance.

14. API Structure

The backend exposes REST APIs for the frontend.

Typical API groups include:

/auth
/users
/projects
/projects/:id/milestones
/projects/:id/flags
/projects/:id/audit-trail

Examples:

POST   /auth/login


GET    /projects
GET    /projects/:id


POST   /projects
POST   /projects/:id/milestones


PATCH  /milestones/:id/verify
PATCH  /milestones/:id/reject


POST   /projects/:id/flags


GET    /projects/:id/audit-trail

All protected operations require appropriate authentication and
authorization.

15. Project Structure
kopargaon-fullstack/
│
├── backend/
│   │
│   ├── src/
│   │   ├── index.js
│   │   ├── db/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   │
│   ├── scripts/
│   │   ├── migrate.js
│   │   └── seed.js
│   │
│   ├── sql/
│   │   └── schema.sql
│   │
│   ├── uploads/
│   │
│   ├── .env
│   └── package.json
│
├── frontend/
│   │
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── api/
│   │   ├── utils/
│   │   └── App.jsx
│   │
│   ├── .env
│   └── package.json
│
└── README.md
16. Local Setup
Prerequisites

Install:

Node.js
npm
MySQL 8
Git

Verify:

node --version
npm --version
mysql --version
17. Database Setup

Start your local MySQL server.

Create the application database and configure the credentials according to
the backend .env file.

Example:

DB_HOST=localhost
DB_PORT=3306
DB_NAME=kopargaon
DB_USER=kopargaon_app
DB_PASSWORD=your_password

Run the database migration:

cd backend
npm install
node scripts/migrate.js

Seed demo data:

node scripts/seed.js
18. Start Backend

From the backend directory:

node src/index.js

Expected output:

Kopargaon API listening on port 4000

The API will be available at:

http://localhost:4000
19. Start Frontend

Open another terminal:

cd frontend
npm install

Create the environment file:

copy .env.example .env

Then start Vite:

npm run dev

The frontend will normally be available at:

http://localhost:5173
20. Demo Accounts

The seeded development database contains demo accounts.

Password for the demo accounts:

demo1234

Example accounts:

Authority:
authority@kopargaon.demo


Contractor:
contractor@kopargaon.demo


Engineer:
engineer@kopargaon.demo


Citizen:
citizen@kopargaon.demo

These accounts are intended only for local development and demonstration.

21. Recommended Demo Flow

For a hackathon demonstration, use the following sequence.

Step 1 — Authority

Log in as Authority.

Show:

Project dashboard
Project passport
Budget
Ward
Contractor
Engineer
Current progress
Step 2 — Contractor

Switch/login as Contractor.

Submit a milestone:

Milestone:
Water pipeline installation


Progress:
60%


Evidence:
Upload construction photograph

Submit the milestone.

Step 3 — Engineer

Login as Engineer.

Open the submitted milestone.

Show:

Contractor's claim
Evidence
Progress percentage
Verification controls

Verify the milestone.

Step 4 — Governance Trust Index

Return to the project dashboard.

Show that verified progress has changed and the Governance Trust Index
recalculates based on the updated project state.

Step 5 — Citizen

Login as Citizen.

View the verified project.

Submit a citizen flag if the reported progress does not match the observed
ground reality.

Step 6 — Audit Trail

Open the audit trail.

Show the sequence:

Project Created
       ↓
Milestone Submitted
       ↓
Milestone Verified
       ↓
Citizen Flag Submitted

This demonstrates that the system is not simply a dashboard — it maintains
an accountability chain.

22. What Makes the Platform Different?

The platform is built around three major differentiators.

1. Verification Chain

Instead of:

Government publishes → Citizen views

the platform creates:

Contractor claims
       ↓
Engineer verifies
       ↓
Citizen observes
       ↓
Citizen can dispute
2. Governance Trust Index

Instead of showing only:

Project Status: ONGOING

the platform produces a computed governance-health signal based on actual
project activity.

3. Accountability Trail

Important project actions are recorded so the system can answer:

Who submitted this?
Who verified it?
When was it verified?
Was it rejected?
Did citizens raise a concern?
23. Current Scope

The first implementation deliberately focuses on Kopargaon.

This provides a controlled environment for validating:

Project monitoring
Stakeholder workflows
Verification
Citizen feedback
Governance scoring
Auditability

The architecture can later be extended to additional municipalities.

24. Future Roadmap

The following features can be added after validating the core platform:

Community Need Identification

Citizens can propose infrastructure needs and vote on them.

Example:

"Repair the road near Kopargaon Market"


        ↓


Citizen votes


        ↓


Demand aggregation


        ↓


Municipal planning input
AI Discussion Summarization

AI can summarize large volumes of citizen discussions and highlight recurring
issues.

Advanced Analytics

Future dashboards could include:

Ward-level project health
Delayed project detection
Contractor performance trends
Budget utilization trends
Project risk indicators
Production Deployment

The current system is designed to run locally for development and hackathon
demonstration.

A future production deployment can use:

Cloud Frontend
      ↓
Cloud Backend
      ↓
Hosted MySQL
      +
Object Storage
25. Hackathon Scope

The project is intentionally city-specific rather than attempting to solve
municipal infrastructure monitoring for an entire state or country at the
first stage.

This allows the prototype to demonstrate the complete workflow within a
manageable scope.

The core MVP is:

Project Creation
      ↓
Milestone Submission
      ↓
Evidence Upload
      ↓
Engineer Verification
      ↓
Citizen Visibility
      ↓
Citizen Flag
      ↓
Governance Trust Index
      ↓
Audit Trail

This is the primary functionality to demonstrate during judging.

26. Development Philosophy

The platform follows a simple principle:

Reported progress should not automatically become trusted progress.

Every important project update should move through an appropriate verification
and accountability mechanism.

The system therefore separates:

CLAIMED PROGRESS
        ≠
VERIFIED PROGRESS

while still allowing citizens to question verified information.

27. License

This project was developed as a hackathon/open-innovation prototype for
demonstrating a city-specific digital governance solution for Kopargaon.