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
- Phase 2 — Learning (video player, lesson progress) — next.

### Auth setup note

For email/password and Google to work locally you must, in the Supabase dashboard:
1. **Authentication → Providers** — enable Email (turn off "Confirm email" for quick local testing) and Google (add OAuth client id/secret).
2. **Authentication → URL Configuration** — add `http://localhost:3000/auth/callback` as a redirect URL.
