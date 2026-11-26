# Progress

Updated at the end of each session ("update progress"). Milestone details are in `MILESTONES.md`.

## Current
**M10. Seat map component (static)** — not started (frontend already built by AI; see note)

## Next session
- M10 note: the UI (SeatGrid, seat layout module `frontend/lib/seats.js`) already exists, so M10 is mostly "read and understand it"; the real next backend work is M11 (seat availability API: query params, joins, which statuses count as taken). Decide with Claude whether to skip M10 and start M11.
- Open M8 decision: how `booking_seats.active` stays in sync with `bookings.status`. Options: trigger, one Postgres function (rpc) that is the only place status changes, or Express only (chosen on purpose). Needed before M14; M14's two-step insert (booking + seats) should be atomic, which points to an rpc function. M11 will also decide which statuses count as taken.
- M9 leftovers (optional): check `/v2` in the browser (shows the real event); `app/v2/page.js` shows "no event" on a server error (add a separate error message); set `booking_open = true` on the event in the dashboard to get the "예매 중" badge; test the `null` case by setting the event to `draft`.
- M8 leftovers (optional): seat CHECK is looser than the venue (accepts B13, L09, row A) so decide DB vs Express (M13); later migrations for `expires_at` (M17), `paid_at`/cancel/check-in fields (M24, M28-M31).
- M7 leftovers (optional): move the seed out of the migration into `supabase/seed.sql` (config.toml points there but the file doesn't exist); trailing spaces on the last line of the M7 migration; decide `sort_order` vs `starts_at` as the truth; later migration for `updated_at`.
- Small M6 leftovers (optional): fix the stale `anon key 또는 service_role key` comment in `server/lib/supabase.js`; drop the unused `next` and redundant `else` in `routes/rows.js`; check what `error.stack` logs for a Supabase error.
- Small M5 leftovers (optional): add `frontend/.env.example`; decide whether `credentials: true` in CORS is needed.

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

- Schema (M7): `events` and `event_sessions` as a migration in `server/supabase/migrations/20261123020228_events_and_sessions.sql` (identity bigint keys, CHECK constraints, `on delete cascade`, `unique (event_id, sort_order)`, RLS on with no policies since only Express uses the secret key). Seed for the real show (3 sessions, KST) is inside the migration. Tables were created in the Supabase dashboard rather than via `db push`; if pushing later, run `npx supabase migration repair --status applied 20261123020228` first. Docker isn't installed/running, so local `supabase start`/`db reset` isn't used for now.
- Schema (M8): `bookings` (status CHECK incl. refund states, `amount` = price at booking time, `unique (id, session_id)`) and `booking_seats` in `server/supabase/migrations/20261124000000_bookings_and_seats.sql`. `booking_seats` keeps its own `session_id` with a composite FK to `bookings (id, session_id)` so the DB proves they match; partial unique index `(session_id, seat) where active` is the no-double-booking rule; `active = false` keeps released seats as history. `bookings.session_id` is `on delete restrict`, `booking_seats` cascades from bookings. Applied to the hosted project with the CLI on 2026-11-25 (`supabase link`, `migration repair --status applied 20261123020228 --remote` for M7, then `db push`; `--remote` is needed or the CLI targets the local Docker stack). Before that it was tested in PGlite (in-memory Postgres, not the Supabase project): duplicate seat per session fails with 23505, other session / released seat is allowed.

- Event API (M9): `GET /api/event` (`routes/events.js` mounted at `/api/event`, logic in `services/eventService.js`) returns the one published event with its sessions ordered by `sort_order`, or `null` with status 200 when nothing is published; a DB error is thrown and the central handler answers 500. Two queries (event, then sessions), each `error` checked right after it. `toEventDto` maps snake_case to the frontend shape (`ticketPrice`, `bookingOpen`, `sessions[{id, sortOrder, startsAt}]`) and lists fields one by one so nothing leaks. Ids stay numbers on the server; `getEvent()` in `frontend/lib/api.js` stringifies them (the mock and URL params use strings) and derives `dateLabel`/`timeLabel` from `startsAt` (`sessionLabels` in `lib/format.js`). Counts (`occupiedSeats`, `pendingSeats`, `bookingCount`) are left out; only admin pages use them (M23-M25).
- Migrations after M8 (applied with `db push --remote`): `20261125080620` adds `events.booking_open boolean not null default false`; `20261126045704` adds a partial unique index `events_one_published on events ((true)) where status = 'published'` so at most one event is published (to switch shows: archive the old one first, then publish the new one). Tested in PGlite first.

## Checklist
- [x] M1 Express hello world
- [x] M2 Express project structure
- [x] M3 Errors and middleware
- [x] M4 Next.js App Router basics (read-only: the UI already existed; user said they already knew the concepts)
- [x] M5 Next.js ↔ Express connection
- [x] M6 Supabase + Postgres intro
- [x] M7 Schema: events and sessions
- [x] M8 Schema: bookings and seats
- [x] M9 Event API + home page
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
- Learned (M8): a composite foreign key can make the DB check that two tables agree on a column; a partial unique index (`where active`) enforces a rule only for live rows; `restrict` vs `cascade` express who owns whose lifetime; a denormalized flag like `active` can drift from `status` unless one place (trigger or function) changes both. Mistake/open: the drift case (cancelled booking whose seats stay active) is still possible; the seat CHECK is looser than the venue.
- Learned (M9): supabase-js returns an array unless `.maybeSingle()` (object or `null`); `await` covers the whole expression, so `await q.data` reads `.data` too early; check each query's `error` right after it, under a different variable name for the second query; `null` for "nothing found" (200) is different from a failure (500), so never turn an error into `null`; without `.order()` Postgres gives no order guarantee even when the output looks sorted; a partial unique index on a constant `((true))` enforces "at most one"; a mapper (DTO) keeps DB column names out of the API; routes call services, services query the DB; the CLI needs `--remote` or it targets local Docker. Mistakes this round: early versions ignored the sessions query's error and read `.data` before `await`; all fixed.
