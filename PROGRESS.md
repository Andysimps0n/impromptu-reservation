# Progress

Updated at the end of each session ("update progress"). Milestone details are in `MILESTONES.md`.

## Current
**M7. Schema: events and sessions** — not started

## Next session
- Start M7. Before any SQL, the user describes their design: which columns `events` and `event_sessions` need and how a session belongs to an event (foreign key). Claude replies with concept pointers (foreign keys, `CHECK`, timestamps, migrations as SQL files in the repo).
- Done when: `events` and `event_sessions` exist from a committed migration, with seed data for the real show (3 sessions).
- Small M6 leftovers (optional): fix the stale `anon key 또는 service_role key` comment in `server/lib/supabase.js` (it must hold the secret key only); drop the unused `next` and the redundant `else` in `routes/rows.js`; check what `error.stack` logs for a Supabase error.
- Small M5 leftovers (optional): add `web/.env.example` documenting `NEXT_PUBLIC_API_URL` (needs `!.env.example` in `web/.gitignore`, since `.env*` is ignored); decide whether `credentials: true` in the CORS setup is needed.
- Still open: should `b/` become one git repo (it isn't one yet; `web/` has only the create-next-app starter commit and all work is uncommitted)?

## Done (AI-built)
- 2026-11-14: full frontend in `web/`, two versions (`/v1` old layout, `/v2` new layout) on the Toss design rules, all audience + admin features, running on a mock API (`web/lib/api.js`). Frontend parts of M4, M5, M10, M12, M16 and the UI of later milestones are already done; those milestones now mean "connect the existing UI to the real API".

## Decisions
- Frontend `web/` (Next.js, JavaScript), backend `server/` (Express), DB + OAuth via Supabase.
- All UI is built by AI; backend + DB are hand-written by the user (decided 2026-11-14).
- Dropped from the old site: password admin login, legacy URL redirects, the optional "login required to book" mode (not built in the UI yet).
- `web/lib/api.js` function shapes = the contract the Express API should follow.
- UI layout: v2 chosen (2026-11-15). v1 deleted from `web/` on 2026-11-16 (`app/v1`, `features/v1`); lint and build pass. It was never committed, so it can't be restored from git.
- `server/` uses ES modules (`"type": "module"`), nodemon via `npm run dev`, port from `.env` (`PORT`, default 3001), routers in `server/routes/` mounted per feature in `index.js`.
- CORS: Express uses the `cors` package with one allowed origin from `WEB_ORIGIN` (default `http://localhost:3000`), registered before the routes. The web app reads the API address from `NEXT_PUBLIC_API_URL` in `web/.env.local` (git-ignored). `web/app/page.js` (dev page) has a "서버 연결" row that calls `getServerHealth()` in `web/lib/api.js`.
- Supabase: Express talks to the database with the **secret key** (`SUPABASE_SECRET_KEY`, server only, never in `web/`); `SUPABASE_URL` is the project URL. The browser never talks to the database directly. Supabase's new key names: publishable key (old `anon`), secret key (old `service_role`).
- Skipped by the user: the async-throw experiment from M3. The `/test` debug route is gone. Also skipped: the primary-key question in M6.
- Errors: a service function (like `getRows`) throws the real error; the route doesn't build its own 500. Express 5 forwards a rejected async handler to the central error handler, which logs it and sends the one JSON 500 shape.
- One shared Supabase client lives in `server/lib/supabase.js` (default export); routes import it.

## Checklist
- [x] M1 Express hello world
- [x] M2 Express project structure
- [x] M3 Errors and middleware
- [x] M4 Next.js App Router basics (read-only: the UI already existed; user said they already knew the concepts)
- [x] M5 Next.js ↔ Express connection
- [x] M6 Supabase + Postgres intro
- [ ] M7 Schema: events and sessions
- [ ] M8 Schema: bookings and seats
- [ ] M9 Event API + home page
- [ ] M10 Seat map component (static)
- [ ] M11 Seat availability API
- [ ] M12 Seat selection state
- [ ] M13 Request validation
- [ ] M14 Create a booking safely
- [ ] M15 Per-phone seat limit
- [ ] M16 Booking form UI
- [ ] M17 30-minute hold expiry
- [ ] M18 Lookup code + lookup page
- [ ] M19 Cancel a pending booking
- [ ] M20 Supabase Auth with Kakao in Next.js
- [ ] M21 Verify the user in Express
- [ ] M22 Admin role
- [ ] M23 Admin booking list
- [ ] M24 Confirm payment + refunds
- [ ] M25 Session overview + admin seat map
- [ ] M26 Event CRUD
- [ ] M27 Publish, archive, duplicate, open/close
- [ ] M28 Ticket issuance
- [ ] M29 Ticket page with QR
- [ ] M30 Check-in API + manual entry
- [ ] M31 QR scanner + check-in dashboard
- [ ] M32 Rate limiting
- [ ] M33 Login-to-book option
- [ ] M34 SMS on payment confirmation
- [ ] M35 Scheduled cleanup
- [ ] M36 Deployment
- [ ] M37 (Optional) Google Sheets sync

## Learned / stuck
- Learned (M1): an Express handler gets `(req, res)`; `res.json` sends JSON; `"type": "module"` in `package.json` decides whether `import` works; nodemon restarts the server on save.
- Learned (M2): routers are mounted with `app.use(prefix, router)` and the mount path plus the route path make the URL (it was `/health/health` once); ESM relative imports need `.js`; `import "dotenv/config"` must be the first import; `.gitignore` is case-sensitive (`.DS_Store`); keep secrets out of git with `.env` plus `.env.example`; group code by why it changes (route → controller → service → DB).
- Learned (M3): Express runs handlers in registration order, so the JSON 404 catch-all (`app.use` with no path) goes after every route and the error handler goes last; an error handler is recognized by its four arguments `(err, req, res, next)`; `next(err)` skips to it; use `app.use`, not `app.get`, to register middleware; return real status codes (404, 500) with one JSON shape (`{ error: "..." }`), log the stack on the server and don't leak internals; Express 4's `app.use("*")` doesn't work in Express 5.
- Learned (M5): the browser blocks a cross-origin response unless the server sends `Access-Control-Allow-Origin` matching the page's origin; `cors` is middleware and goes before the routes; `NEXT_PUBLIC_` variables are readable in the browser and, like `.env`, are read only at startup; every network call needs loading, success and error states.
- Learned (M6): a Supabase project is a hosted Postgres database plus an API; the dashboard is for you (account login) and keys are for code; the secret key bypasses row-level security, so it stays on the server; supabase-js returns `{ data, error }` instead of throwing, so `error` must be checked and passed on (throw it so the central handler answers). A handler with four arguments `(err, req, res, next)` is an error handler, not a route, so a route written that way is never reached (404). A path starting with `/` in an import is an absolute filesystem path; use a relative one. Don't return a sentinel like `-1` for failure; throw instead.
- Stuck / open: M6 mistakes were the `.env` mix-up (URL and key swapped, plus a stray line), the sentinel `-1` return, and the wrong route signature; all fixed. Earlier: the 404 JSON status was once 200 instead of 404 until `curl -i` showed it.
