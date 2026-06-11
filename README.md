# Padhai पढाइ

Online recorded courses + CBT mock tests for Nepali students — SEE, +2 (Science / Management), and the major entrances (IOE, CEE, CSIT, CMAT).

The **mock-test engine is the core feature**: timed CBT runner with a question palette, KaTeX math, per-question images, instant scoring, and topic-wise result analysis.

## Tech stack

| Layer | Choice |
| --- | --- |
| Framework | Next.js 16 (App Router) + TypeScript (strict) |
| Styling | Tailwind CSS v4 (tokens in `globals.css`) |
| UI primitives | shadcn/ui conventions (`cn`, CVA `Button`) |
| Database | PostgreSQL via **Supabase** |
| ORM | Prisma 6 |
| Auth / Storage | Supabase Auth (email + Google now; phone OTP later) + Supabase Storage |
| Video | YouTube unlisted (MVP) — only `videoUrl` is stored |
| Math | KaTeX |
| Payments | eSewa + Khalti (server-verified) — Phase 4 |
| Deploy | Vercel + managed Postgres (Supabase) |

> Scope: building **MVP Phases 0–4** (scaffold → catalog+auth → learning → mock-test engine → payments). Admin panel, i18n, papers library and polish (Phases 5–6) come after.

## Project layout

```
src/
  app/                 App Router routes (homepage built; more per phase)
  components/
    layout/            SiteHeader, SiteFooter
    ui/                shadcn-style primitives (Button)
    scroll-reveal.tsx  IntersectionObserver reveal animation
    brand-wordmark.tsx "Padhai पढाइ" wordmark
  lib/
    site.ts            Single brand/site config constant (rename brand here)
    tracks.ts          Canonical Track→Subject taxonomy (shared by seed + UI)
    utils.ts           cn(), formatNpr()
    db.ts              Prisma client singleton
prisma/
  schema.prisma        Full data model (catalog, mock engine, payments, OTP)
  seed.ts              Demo catalog: tracks + courses + a free mock per track
```

## Getting started

### 1. Install

```bash
npm install
```

### 2. Environment

Copy the example and fill in your values:

```bash
cp .env.example .env
```

Create a **Supabase** project, then from **Project Settings → Database** copy:

- `DATABASE_URL` — the **Transaction pooler** string (port 6543, append `?pgbouncer=true`). Used by the app at runtime.
- `DIRECT_URL` — the **direct/session** string (port 5432). Used by Prisma Migrate.

And from **Project Settings → API**:

- `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`.

Payment + SMS keys are placeholders for now (Phase 4 / OTP wiring) — sandbox eSewa values are pre-filled and safe.

### 3. Database

```bash
npm run db:generate   # generate Prisma client
npm run db:push       # create tables in Supabase (or db:migrate for migrations)
npm run db:seed       # load demo catalog (8 tracks, courses, a free mock each)
```

> The seed wipes + repopulates the catalog/attempt tables — **dev only**.
> Demo logins seeded: `student@padhai.test`, `admin@padhai.test`.

### 4. Run

```bash
npm run dev           # http://localhost:3000
```

## Scripts

| Script | Purpose |
| --- | --- |
| `npm run dev` | Dev server |
| `npm run build` / `start` | Production build / serve |
| `npm run lint` / `typecheck` | ESLint / `tsc --noEmit` |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to DB (no migration history) |
| `npm run db:migrate` | Create + apply a migration |
| `npm run db:seed` | Seed demo data |
| `npm run db:studio` | Prisma Studio |

## Design system

Warm, scholarly palette (brief §5) lives in [`src/app/globals.css`](src/app/globals.css) as Tailwind v4 `@theme` tokens — use `bg-paper`, `text-crimson`, `rounded-card`, `shadow-soft`, etc. Fonts: **Fraunces** (display), **Hanken Grotesk** (body), **Tiro Devanagari Hindi** (नेपाली), loaded via `next/font` in `layout.tsx`.

The brand name is a single constant in [`src/lib/site.ts`](src/lib/site.ts) — change it there only.

## Status

- **Phase 0 — Scaffold ✅**: Next.js + TS + Tailwind + Prisma, design tokens + fonts, homepage, full schema, seed script.
- **Phase 1 — Catalog + Auth ✅**:
  - Supabase auth (email/password + Google), session `proxy` (middleware), route guards.
  - Phone-OTP flow scaffolded (`OtpCode` table + `/auth/otp`), shows "not enabled" until an SMS provider is wired.
  - Onboarding (track / goal) + profile upsert; session-aware header with logout.
  - Catalog `/courses` with track + free/paid filters and course/lesson search; course detail `/courses/[slug]` with syllabus, instructor, free-preview, and free enrollment.
  - Student `/dashboard` (enrolled courses). Placeholders for `/mock-tests`, `/papers`, `/pricing` (later phases).
- **Phase 2 — Learning ✅**:
  - `/learn/[courseSlug]` enrolled view: YouTube IFrame player with **resume-where-you-left-off**, **playback-speed** control, and **per-lesson completion** tracking.
  - Chapter/lesson sidebar with progress ticks + active highlight; lesson switching is client-side (no reload), URL stays shareable via `?lesson=`.
  - Throttled autosave (every ~10s + on pause/seek/unmount) to `LessonProgress`; lessons auto-complete at ~95% watched, plus a manual complete toggle.
  - Real progress bars on `/dashboard`; enrolled CTAs now open the learn view.
- **Phase 3 — Mock-test engine ✅** (the core feature):
  - `/mock-tests` catalog + `/mock-tests/[slug]` instructions; start/resume an attempt.
  - CBT runner (`/mock-tests/[slug]/attempt`): countdown timer, question palette (answered / marked / not-answered / not-visited), KaTeX math + per-question images, single & multi-select.
  - **Refresh/disconnect-proof**: every answer + mark + per-question time autosaves to the DB; reloading restores answers and the live timer. Auto-submits when time runs out.
  - Server-side scoring with **negative marking**; answers are **never sent to the client** during the test (`isCorrect` is stripped from the runner query).
  - `/results/[attemptId]`: score, accuracy, time, **topic-wise breakdown**, and per-question review with correct answers + explanations.
  - Mock-test history on the dashboard.
- **Phase 4 — Payments ✅**:
  - `/pricing` (per-track bundles) + per-course "Enroll" → `/checkout` with an order summary.
  - **eSewa** (ePay v2): HMAC-SHA256 signed form hand-off; success callback re-signs the returned payload and confirms the amount before granting access.
  - **Khalti** (KPG-2): server-initiated `initiate` → hosted page → `lookup` verification on return (query status is never trusted).
  - `fulfillPayment` is idempotent and **enrolls on success** (single course, or every course in a bundle); free tier still enrols without checkout. Success/failed receipt pages.
  - Server-verified every time — see [src/lib/payments/](src/lib/payments/) and [src/app/api/payments/](src/app/api/payments/).
- Phase 5+ (admin authoring, i18n, papers) — out of MVP scope for now.

### Payments setup note

- **eSewa** works against the public sandbox out of the box (test merchant `EPAYTEST`, values pre-filled in `.env.example`).
- **Khalti** needs a **test secret key** from a Khalti merchant account — set `KHALTI_SECRET_KEY` (and keep `KHALTI_BASE_URL=https://dev.khalti.com`). Until then the Khalti button fails gracefully and suggests eSewa.
- For real callbacks to reach you, `NEXT_PUBLIC_SITE_URL` must be a URL the gateway can redirect back to (localhost works for eSewa/Khalti test redirects in the browser).

### Auth setup note

For email/password and Google to work locally you must, in the Supabase dashboard:
1. **Authentication → Providers** — enable Email (turn off "Confirm email" for quick local testing) and Google (add OAuth client id/secret).
2. **Authentication → URL Configuration** — add `http://localhost:3000/auth/callback` as a redirect URL.
