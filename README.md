# Kopargaon Infrastructure Accountability Platform

A city-scale digital trust layer for Kopargaon Municipal Council. Every approved
infrastructure project gets a Digital Project Passport; contractors submit progress with
photo evidence; engineers verify it; residents can flag ground-reality discrepancies even
after verification; and a Governance Trust Index is computed live from all of it. The audit
log is append-only, enforced by database privileges, not just application code.

This is a real, working full-stack build — not a mockup. Every piece described below has
been tested against a real MySQL database, a real Express API, and a real browser session.

## Structure

```
frontend/   React + Vite + Tailwind client
backend/    Node + Express API, raw SQL over MySQL (no ORM)
```

## Quick start

1. Set up MySQL and the backend — follow `backend/README.md` in full. The one step that's
   easy to miss: the audit log's append-only guarantee requires a manual GRANT step run as
   root, separate from the regular app setup.
2. Seed demo data: `cd backend && node scripts/seed.js`
3. Start the backend: `npm run dev` (defaults to port 4000)
4. Set up and start the frontend — follow `frontend/README.md`. Defaults to port 5173 for
   dev, and expects the backend at `http://localhost:4000` unless you change `.env`.
5. Log in with any of the four seeded demo accounts (password `demo1234`) — the login
   screen has one-click buttons for each.

## What's built (real, tested end-to-end)

- Auth: JWT + bcrypt, role enforcement on every mutating endpoint
- **Multi-project Dashboard** — trust score, budget, and progress for every project at a glance
- Digital Project Passport creation (Authority)
- Milestone submission with real photo upload (Contractor)
- Engineer verification / rejection with comments
- Ground Reality Check flagging with optional photo evidence (Citizen), only on already-
  verified milestones — enforced server-side, not just hidden in the UI
- Governance Trust Index — computed server-side from verification rate, documentation,
  update frequency, and flag resolution; weights are named constants, not hidden
- Budget-vs-Physical-Progress view
- Audit Trail — fetched live from the database, append-only at the MySQL privilege level
  (verified by directly trying to `UPDATE` it as the app's own DB user and being denied)
- **Community Need Identification** — citizens raise and upvote local infrastructure issues
  before any project exists; one vote per citizen enforced by a DB unique constraint, not
  just app logic; an Authority-created project can be linked back to the demand that
  motivated it
- **Project Discussion Space** — per-project threaded discussion across four categories
  (General / Technical / Budget / Suggestion), open to all four roles
- **AI Discussion Analysis** — summarizes the most-discussed concern and suggests an action.
  Rule-based by default (free, offline, never fails); automatically upgrades to a real
  Claude API call if `ANTHROPIC_API_KEY` is set in `backend/.env`, with silent fallback to
  the rule-based version if that call fails for any reason — a live demo never breaks on a
  network hiccup
- Institutional account provisioning: Authority creates Contractor/Engineer accounts;
  Citizens self-register; nobody can grant themselves Authority or Engineer through the
  public signup form

## What's intentionally not built yet

- Deployment / hosting (running locally is by design for now — see project notes on why)
- Password reset flow
- Pagination / search on the project list (not needed at demo scale)

## Why MySQL, why no ORM

MySQL was already installed locally, so development never depended on a hosted service.
The backend uses hand-written SQL via `mysql2` instead of an ORM like Prisma — partly a
practical workaround (Prisma's migration engine needs to download binaries from a domain
that wasn't reachable in the environment this was built in), but also a deliberate choice:
being able to explain every query directly, rather than translating ORM-generated SQL on
the spot, is worth more in front of judges than the convenience an ORM would add.

## Enabling real AI discussion summaries

By default, the "AI Discussion Analysis" panel uses a rule-based summary — no setup needed.
To upgrade it to a real Claude call:

1. Get an API key from console.anthropic.com
2. Add `ANTHROPIC_API_KEY=sk-ant-...` to `backend/.env`
3. Restart the backend

No frontend changes needed — the same endpoint automatically prefers Claude when the key
is present and falls back silently if the call ever fails.
