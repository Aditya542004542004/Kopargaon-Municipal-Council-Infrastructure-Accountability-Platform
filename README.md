# Kopargaon Infrastructure Accountability Platform

A city-scale digital trust layer for Kopargaon Municipal Council. Every approved
infrastructure project gets a Digital Project Passport with a registered GPS location;
contractors submit progress with photo evidence that's automatically checked for
geotag consistency and content authenticity; engineers verify it; residents can flag
ground-reality discrepancies even after verification; and a Governance Trust Index is
computed live from all of it. The audit log is append-only, enforced by database
privileges, not just application code.

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
2. Migrate and seed demo data: `cd backend && npm run migrate && npm run seed`
3. Start the backend: `npm run dev` (defaults to port 4000)
4. Set up and start the frontend — follow `frontend/README.md`. Defaults to port 5173 for
   dev, and expects the backend at `http://localhost:4000` unless you change `.env`.
5. Log in with any of the four seeded demo accounts (password `demo1234`) — the login
   screen has one-click buttons for each.

## What's built (real, tested end-to-end)

**Core verification loop**
- Auth: JWT + bcrypt, role enforcement on every mutating endpoint
- Digital Project Passport creation (Authority), with a real GPS location picker
- Milestone submission with real photo upload (Contractor), restricted server-side and
  client-side to the contractor actually assigned to that project
- Engineer verification / rejection with comments
- Ground Reality Check flagging with optional photo evidence (Citizen), only on already-
  verified milestones — enforced server-side, not just hidden in the UI
- Flag resolution: an Engineer or Authority can mark a flag resolved or dismissed, so the
  Trust Index can actually recover once an issue is fixed, instead of only ever going down
- Governance Trust Index — computed server-side from verification rate, documentation,
  update frequency, flag resolution, and budget-vs-physical-progress alignment; weights are
  named constants, not hidden
- Audit Trail — fetched live from the database, append-only at the MySQL privilege level
  (verified by directly trying to `UPDATE` it as the app's own DB user and being denied).
  Now covers governance actions too, not just project events — Authority-provisioned
  accounts are logged the same way milestone actions are.

**Evidence verification (the part that directly answers "AI verification is heuristic")**
- Real EXIF GPS extraction from uploaded photos, cross-checked against the project's
  registered coordinates using an actual haversine distance calculation (flags anything
  more than ~1.5km from the project site)
- Real, local, offline image content classification via an on-device Vision Transformer
  (`@xenova/transformers`) — not a keyword/filename heuristic, and not a paid API call.
  Distinguishes genuine construction/site photos from memes, screenshots, or unrelated
  images, with context-awareness so early-stage "site clearing" photos aren't wrongly
  flagged.
- A demo-mode toggle on the milestone form lets you reliably show the fraud-detection UI
  live (forces a simulated non-construction detection) instead of hoping a real test image
  gets classified correctly in the moment — clearly labeled in the UI as a demo aid, not a
  hidden bypass.

**Civic + oversight features**
- **Multi-project Dashboard** — grid or interactive GIS map view, trust score/budget/progress
  at a glance, search by name/ward/contractor, executive KPI summary (active projects,
  average governance health, total budget, at-risk project count)
- **GIS Map** — every project plotted by its real coordinates, color-coded by Trust Index
- **PDF Report Export** — one-click export of a project's full passport, Trust Index
  breakdown, and budget view as a shareable PDF
- **WhatsApp Share** — shares a project's live status as a pre-formatted WhatsApp message,
  matching how municipal updates actually circulate in this context
- **Community Need Identification** — citizens raise and upvote local infrastructure issues
  before any project exists; one vote per citizen enforced by a DB unique constraint, not
  just app logic; an Authority-created project can be linked back to the demand that
  motivated it
- **Project Discussion Space** — per-project threaded discussion across four categories
  (General / Technical / Budget / Suggestion), open to all four roles
- **AI Discussion Analysis** — summarizes the most-discussed concern and suggests an action.
  Rule-based by default (free, offline, never fails); automatically upgrades to a real
  Gemini API call if `GEMINI_API_KEY` is set in `backend/.env`, with silent fallback to the
  rule-based version if that call fails for any reason — a live demo never breaks on a
  network hiccup
- Institutional account provisioning: Authority creates Contractor/Engineer accounts
  directly from the Dashboard; Citizens self-register; nobody can grant themselves
  Authority or Engineer through the public signup form

**Production hardening**
- `helmet` for HTTP security headers, `express-rate-limit` on all routes (a stricter limit
  on auth endpoints specifically), `compression` for smaller JSON payloads

## Honest current limitations

- **Single-region architecture.** The Trust Index, geofencing, and dashboard all assume one
  municipal deployment (Kopargaon). Extending to multiple cities is a real but
  straightforward extension of the existing schema (ward/city becomes a partition key, not
  a redesign) — not built yet.
- **Evidence verification is real, local ML — not a guarantee.** The Vision Transformer
  model runs genuine inference on real image content, which is a meaningful step up from a
  filename/size heuristic, but it's a lightweight on-device model, not a state-of-the-art
  cloud vision system. It's built to catch the obvious cases (memes, screenshots, wildly
  unrelated photos) — treat its output as a strong signal for a human reviewer, not an
  infallible verdict.
- Deployment / hosting (running locally is by design for now — see project notes on why)
- Password reset flow
- Pagination on the project list (not needed at demo scale)

## Why MySQL, why no ORM

MySQL was already installed locally, so development never depended on a hosted service.
The backend uses hand-written SQL via `mysql2` instead of an ORM like Prisma — partly a
practical workaround (Prisma's migration engine needs to download binaries from a domain
that wasn't reachable in the environment this was built in), but also a deliberate choice:
being able to explain every query directly, rather than translating ORM-generated SQL on
the spot, is worth more in front of judges than the convenience an ORM would add.

## Enabling real AI discussion summaries

By default, the "AI Discussion Analysis" panel uses a rule-based summary — no setup needed.
To upgrade it to a real Gemini call:

1. Get a free API key from Google AI Studio
2. Add `GEMINI_API_KEY=AIza...` (or the newer `AQ.Ab...` key format) to `backend/.env`
3. Restart the backend

No frontend changes needed — the same endpoint automatically prefers Gemini when the key
is present and falls back silently if the call ever fails.