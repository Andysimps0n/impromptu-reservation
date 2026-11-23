# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Who writes what (most important)

This repo is a from-scratch rebuild of a school band ticketing site (seat booking), done **to learn** Express and Supabase.

- **Frontend (`web/`) is AI-built.** Claude writes and changes UI code when asked.
- **Backend (`server/`) and the database are written by the user.** There Claude is a mentor and reviewer, not the implementer:
  - Do NOT write or edit backend/DB code unless explicitly asked. Allowed: explain concepts, give small generic examples unrelated to this project's code, review the user's files, describe bugs without fixing them, suggest the next step.
  - When the user is stuck, climb the hint ladder one rung at a time: (1) conceptual nudge → (2) docs link/keyword → (3) pseudocode → (4) minimal snippet, only after they've tried.
  - Before a feature: ask the user to describe their approach; reply with concept pointers and questions.
  - On "review X": read the files from disk and return what works, bugs, structure/security concerns ranked by importance, each with the reason. The user fixes; repeat on "re-review".
  - After each milestone, give a ~3-line recap and propose the next one.
- Config/boilerplate scaffolding commands are fine for Claude to run anywhere.

## Session start / end

- At the start of a session, read `PROGRESS.md` to see the current milestone, decisions and next step.
- When the user says "update progress" (or a session is ending), update `PROGRESS.md`: tick finished milestones, record decisions, note what they learned or are stuck on, and write the "Next session" step.

## Layout

Monorepo, two independent npm projects (no workspaces):

- `web/` — Next.js 16 (App Router, JavaScript, Cache Components on). Read `web/AGENTS.md`: this Next version differs from older docs; check `web/node_modules/next/dist/docs/` before using an API.
- `server/` — Express API (separate server, not started yet). Intended structure: `routes/` → `controllers/` → `services/` (business rules like seat holds) → DB access, plus `middleware/` (JWT auth, error handling) and `lib/supabase.js`.
- Database: Supabase Postgres + Supabase Auth (Kakao OAuth).

### web/ architecture

The UI is the `/v2/...` layout (the user chose it and deleted the old v1 on 2026-11-16): mobile-first single column, top bar + tabs, bottom CTA, seats → form → done step flow, tabbed admin. `/` is a dev page with links and a mock-data reset button (remove before launch).

- Pages: home, `booking/seats|guide|lookup`, `ticket#t=TOKEN`, `admin`, `admin/events/[eventId]`.

Shared code (`features/v2` holds the layout-specific parts; the rest is layout-independent):

- `lib/api.js` — **the only data layer**. Currently a mock backed by `lib/mock-db.js` (seed data in localStorage). Each function is commented with the Express endpoint it stands for; when the server exists, replace the bodies with `fetch` and keep the return shapes. Delete `mock-db.js` then.
- `hooks/` — page logic: `useSeatBooking`, `useLookup` (needs `<Suspense>`, uses `useSearchParams`), `useTicketLink`, `admin.js` (admin context, `useEventDetail`).
- `components/ui/` — design-system primitives (Button, TextField, Dialog→bottom sheet on mobile, Toast, SegmentedControl, Chip, Badge, ListRow, BottomCTA, StepIndicator…) and line icons.
- `components/shared/` — SeatGrid (audience/admin modes), BookingForm, AccountBox, TicketQr, QrScanner, PrivacyPolicy.
- `components/admin/` — order card, event editor, delete/search/seat dialogs, check-in panel, AdminGate (login wrapper).
- `lib/` — `seats.js` (A–L layout, row A staff-only, max 4), `format.js`, `status.js` (labels, roadmap), `content.js` (FAQ, account, links).
- `features/v2` — layout chrome, CSS modules, and the admin client pages. Admin `page.js` files are thin server files that set `export const instant = false` and render the client component (needed with Cache Components).

Design rules (Toss Design System, tokens in `app/globals.css`): one blue accent (`--blue-500`) and at most one filled primary button per screen; greys for everything else; semantic red/green/orange only for status; radius ladder and button sizes XL56/L48/M40/S32; Pretendard; motion ≤320ms, no bounce, 3-dot loader instead of skeletons; disabled = 0.3 opacity on the whole control. UI copy is Korean 해요체, no emoji, no `!` in headings, buttons say what happens. The Kakao login button keeps Kakao's own yellow (Kakao brand rule).

## Commands

- `cd web && npm run dev` — Next.js dev server (open `/` to pick a version)
- `cd web && npm run build` / `npx eslint .` (`npm run lint`)
- `cd server && node <entry file>` — Express (no entry file yet)

No test runner configured yet.

## Milestones

See `MILESTONES.md` (feature inventory of the original site + milestones). The original app is `github.com/Andysimps0n/impromptu-2am-reservation` (Cloudflare Worker + D1); use it as a feature reference only. User-facing copy stays in Korean.
