# Milestones

Rebuild of 즉흥적 새벽 2시 공연 예매 (source: `Andysimps0n/impromptu-2am-reservation`) on Next.js + Express + Supabase.
Each milestone is sized for **≤ 2 hours including learning**. "Done when" is the check that closes it.
How each one gets built is discussed when we reach it.

## Feature inventory (from the old site)

**Audience**
- Home page: show title, subtitle, description, venue, price, list of sessions (회차)
- Seat map: rows A–L, A is staff-only, B–K 12 seats (6 + aisle + 6), L 8 seats (4-4) → 128 bookable
- Pick a session, select up to 4 seats, booking form (name, phone, payer name), privacy consent
- Booking creates a `pending` hold for 30 minutes; bank-transfer instructions shown on success
- Limits: max 4 seats per phone per session (and per Kakao account when login-to-book is on)
- Booking guide page
- Lookup: lookup code + phone → booking status, seats, QR tickets; cancel from there
- Ticket page via secret link (`/ticket#t=token`): one QR per seat

**Admin (Kakao login, allow-listed IDs only)**
- Event management: create draft, edit (title, subtitle, venue, price, sessions), duplicate, publish (one at a time), archive, delete (type title to confirm), open/close booking
- Per session: overview stats, admin seat map, order list (paginated 50), order search
- Booking actions: confirm payment (→ issue tickets + SMS), cancel, refund pending → refund complete, retry SMS
- Check-in: QR scanner (camera) + manual entry, each ticket checks in once, check-in dashboard
- Logout / logout on all devices

**System**
- Rate limits per IP (booking, lookup, login)
- Lazy expiry of 30-minute holds
- Daily cron: delete personal data 90 days after the show / after refund
- SMS (Solapi) on payment confirmation, with status tracking
- Google Sheets one-way sync every 3 min (optional, last)

Dropped: legacy hash/query URL redirects, password admin login (Supabase Auth replaces both).

---

## Phase 1 — Foundations

**M1. Express hello world**
Learn: what Express is, `app.get`, `req`/`res`, JSON responses, nodemon.
Done when: `GET /health` returns `{ ok: true }` in the browser and in curl.

**M2. Express project structure**
Learn: routers, routes → controllers → services, `.env` with dotenv, ES modules.
Done when: `/health` lives in its own router file, the port comes from `.env`, and you can explain each folder.

**M3. Errors and middleware**
Learn: middleware order, `next(err)`, a central error handler, 404 handler, async errors.
Done when: unknown routes return JSON 404 and a thrown error returns JSON 500 without crashing the server.

**M4. Next.js App Router basics**
Learn: `app/` folder routing, layouts, server vs client components, `Link`.
Done when: `/`, `/booking/seats`, `/booking/guide`, `/booking/lookup` exist as placeholder pages sharing one layout with navigation.

**M5. Next.js ↔ Express connection**
Learn: CORS, `fetch` from a client component, env vars in Next.js (`NEXT_PUBLIC_`), loading/error states.
Done when: the home page displays data fetched from Express `/health`.

## Phase 2 — Database

**M6. Supabase + Postgres intro**
Learn: Supabase dashboard, SQL editor, tables, primary keys, `@supabase/supabase-js` with the service-role key on the server only.
Done when: Express reads rows from a test table and returns them as JSON.

**M7. Schema: events and sessions**
Learn: foreign keys, `CHECK` constraints, timestamps, migrations as SQL files in the repo.
Done when: `events` and `event_sessions` exist from a committed migration, with seed data for the real show (3 sessions).

**M8. Schema: bookings and seats**
Learn: unique constraints as business rules (one seat per session), status columns, cascade deletes.
Done when: `bookings` and `booking_seats` exist; inserting the same seat for the same session twice fails at the DB level.

## Phase 3 — Audience read path

**M9. Event API + home page**
Learn: service layer querying Supabase, shaping responses, Next.js server-side fetch.
Done when: `GET /api/event` returns the published event and its sessions, and the home page renders them.

**M10. Seat map component (static)**
Learn: rendering a grid from data, component props, CSS for the aisle and the shorter L row.
Done when: `/booking/seats` draws rows A–L correctly from a seat layout module, with no API calls yet.

**M11. Seat availability API**
Learn: query params, joins, deciding which statuses count as "taken".
Done when: `GET /api/seats?session=…` returns taken seats; the seat map shows them disabled; switching sessions updates it.

**M12. Seat selection state**
Learn: client state (`useState`/`useReducer`), derived values (total price), the max-4 rule in the UI.
Done when: you can select and deselect seats; a sidebar shows the seats and total, and selecting a 5th seat is blocked.

## Phase 4 — Booking write path (the core)

**M13. Request validation**
Learn: never trust the client, zod schemas, a validation middleware, phone number normalization.
Done when: `POST /api/bookings` rejects bad input with clear 400 errors (missing name, bad phone, 0 or 5 seats, staff row A).

**M14. Create a booking safely**
Learn: race conditions, transactions, why the unique constraint is the real lock, Postgres functions (RPC) for atomic writes.
Done when: a booking inserts as `pending` with its seats; two simultaneous requests for the same seat give exactly one success (test with a script).

**M15. Per-phone seat limit**
Learn: enforcing a rule across multiple bookings, inside the same transaction.
Done when: one phone cannot hold more than 4 active seats in one session, even across separate bookings.

**M16. Booking form UI**
Learn: forms in React, submitting to Express, showing server errors, the privacy-consent checkbox.
Done when: a full booking from the browser works and shows a success screen with the bank account and amount.

**M17. 30-minute hold expiry**
Learn: time in Postgres (`timestamptz`, `now()`), lazy expiry vs scheduled jobs.
Done when: a pending booking older than 30 min no longer blocks its seats (test by back-dating `created_at`).

**M18. Lookup code + lookup page**
Learn: generating human-friendly codes, looking up by two factors, not leaking whether a phone exists.
Done when: after booking you get a code; `/booking/lookup` with code + phone shows status and seats.

**M19. Cancel a pending booking**
Learn: state transitions as explicit rules (a small state machine in the service layer).
Done when: the audience can cancel a pending booking from lookup and the seats free up immediately; a paid booking can't be cancelled this way.

## Phase 5 — Auth

**M20. Supabase Auth with Kakao in Next.js**
Learn: OAuth flow, Supabase Kakao provider setup, the `@supabase/ssr` session in Next.js, sign in and sign out.
Done when: you can log in with Kakao on the site and see your nickname; logout works.

**M21. Verify the user in Express**
Learn: JWTs, sending `Authorization: Bearer`, verifying the token server-side, `req.user`.
Done when: `GET /api/me` returns the logged-in user and 401 without a token.

**M22. Admin role**
Learn: authorization vs authentication, a roles/admins table, a `requireAdmin` middleware.
Done when: `/api/admin/*` returns 403 for normal users and works for allow-listed admins; the `/admin` pages redirect non-admins.

## Phase 6 — Admin

**M23. Admin booking list**
Learn: pagination (limit/offset vs cursor), filtering by session and status.
Done when: an admin sees the 50 newest bookings per session, can page back, and can search by name, phone or code.

**M24. Confirm payment + refunds**
Learn: admin-only state transitions, audit timestamps.
Done when: an admin can mark bookings paid, cancel them, and move them through refund pending → refund complete; seats free only on refund complete.

**M25. Session overview + admin seat map**
Learn: aggregate queries (`count`, `group by`), reusing the seat map component with a different mode.
Done when: the admin sees counts (pending, paid, free) and a seat map colored by status.

**M26. Event CRUD**
Learn: REST design for nested resources (events → sessions), forms that edit lists.
Done when: an admin can create a draft event, edit its fields and sessions, and delete it after typing the title.

**M27. Publish, archive, duplicate, open/close**
Learn: enforcing "only one published" with a partial unique index; copying rows.
Done when: publishing a second event fails until the first is archived; duplicate copies settings only; closing booking makes `POST /api/bookings` fail.

## Phase 7 — Tickets and check-in

**M28. Ticket issuance**
Learn: random tokens, storing only a hash, why the raw token lives in the URL fragment.
Done when: confirming payment creates one ticket per seat plus a secret ticket link, and the DB holds only the hash.

**M29. Ticket page with QR**
Learn: a QR library, reading the URL hash on the client.
Done when: opening `/ticket#t=…` shows the show info and one QR per seat; cancelled bookings show an error.

**M30. Check-in API + manual entry**
Learn: idempotency, atomic "update only if not checked in".
Done when: an admin checks in by code + seat; a second check-in of the same ticket is rejected.

**M31. QR scanner + check-in dashboard**
Learn: camera access (HTTPS only), `html5-qrcode`, polling for live counts.
Done when: scanning a ticket QR on a phone checks it in, and the dashboard shows the checked-in count per session.

## Phase 8 — Hardening and ops

**M32. Rate limiting**
Learn: `express-rate-limit`, keying by IP behind a proxy (`trust proxy`).
Done when: booking, lookup and login endpoints return 429 past their limits (20 / 8 / 30 per 10 min).

**M33. Login-to-book option**
Learn: feature flags via env, combining two limits (phone and account).
Done when: with the flag on, booking requires Kakao login and caps each account at 4 seats per session.

**M34. SMS on payment confirmation**
Learn: calling an external API, async work without blocking the response, recording send status and retries.
Done when: confirming payment sends the ticket link by SMS (or logs it in dev); failures show in admin with a retry button.

**M35. Scheduled cleanup**
Learn: cron (`node-cron` or Supabase `pg_cron`), data-retention rules.
Done when: a job deletes personal data 90 days after the show or after the refund, and you can trigger it manually to test.

**M36. Deployment**
Learn: deploying Next.js (Vercel) and Express (Render, Railway or Fly), production env vars, CORS and OAuth redirect URLs for the real domains.
Done when: the full booking → confirm → ticket → check-in flow works on the live URLs.

**M37. (Optional) Google Sheets sync**
Learn: Google service accounts, Sheets API, diffing to avoid needless writes.
Done when: bookings and tickets appear in a sheet and refresh periodically.
