# Kopargaon Infrastructure Accountability Platform

A city-scale digital trust layer for Kopargaon Municipal Council — every approved infrastructure
project gets a Digital Project Passport, contractors submit progress with evidence, engineers
verify it, residents can flag ground-reality discrepancies, and a Governance Trust Index is
computed live from all of it.

## Core loop (built for this demo)

1. **Digital Project Passport** — Authority creates a project profile (ward, budget, contractor, timeline).
2. **Contractor Milestone Submission** — progress %, evidence photo, note.
3. **Engineer Verification** — approve or reject with a comment.
4. **Ground Reality Check** — residents view verified status and can flag discrepancies.
5. **Governance Trust Index** — auto-computed from verification rate, documentation, update frequency, and flag resolution (weights are named constants in `src/utils/trustIndex.js`, not a black box).

Plus a live Budget-vs-Progress view comparing ₹ spent against verified physical progress.

## Running locally

```bash
npm install
npm run dev
```

Use the **Viewing as** dropdown top-right to switch between Authority, Contractor, Engineer,
and Citizen — there's no real auth in this prototype, by design, to keep the demo focused on
the verification loop itself.

## Stack

- React + Vite
- Tailwind CSS v4
- No backend in this build — state lives in memory, seeded with a realistic example project
  (`src/data/seed.js`). See the pitch deck for the full architecture roadmap (DB, auth, evidence
  storage) planned for the next phase.
