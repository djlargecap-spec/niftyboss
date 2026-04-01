# CricBoss — Fantasy Cricket League

A whitelabel fantasy cricket web app. Users pick 11 players per match, earn fantasy points post-match, and compete on a season leaderboard. Built with Next.js 16, Supabase, Tailwind CSS, and shadcn/ui. Designed for office leagues of up to 100 users.

## Features

- **Team Picking** — Select 11 players from the Playing XI, choose Captain (2x) and Vice-Captain (1.5x)
- **Scoring Engine** — Configurable points for batting, bowling, and fielding performances
- **Live Scores** — Real-time score updates via your cricket data API
- **Season Leaderboard** — Automatic rankings with matchday history
- **Auto-Pick** — Users who forget to pick get their previous match's team (with no C/VC bonus)
- **Admin Panel** — Manage matches, enter scorecards, set Playing XI, publish scores
- **PWA** — Installable on mobile with add-to-home-screen support
- **Dark Theme** — Mobile-first design with dark mode default

## Tech Stack

- **Framework**: Next.js 16 (App Router, TypeScript)
- **UI**: Tailwind CSS + shadcn/ui
- **Backend/DB**: Supabase (PostgreSQL + Auth + RLS)
- **Hosting**: Vercel
- **Auth**: Email + Password via Supabase Auth

## Prerequisites

- Node.js 20+
- A [Supabase](https://supabase.com) account (free tier works)
- A [Vercel](https://vercel.com) account (free tier works)
- A cricket data API (see [Cricket Data API](#cricket-data-api) section)

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo-url> cricboss
cd cricboss
npm install
```

### 2. Create a Supabase project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard) → New Project
2. Note your **Project URL** and **anon key** (Settings → API)
3. Note your **service_role key** (Settings → API → service_role)

### 3. Configure environment

```bash
cp .env.example .env.local
```

Edit `.env.local` with your Supabase keys.

### 4. Run migrations

```bash
npx supabase link --project-ref YOUR_PROJECT_REF
npx supabase db push
```

This creates all tables and seeds 10 IPL teams + 150 players.

### 5. Run locally

```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000)

### 6. Make yourself admin

After signing in, run this SQL in Supabase SQL Editor:

```sql
UPDATE profiles SET is_admin = true WHERE display_name = 'Your Name';
```

## Deploy to Vercel

```bash
npm i -g vercel
vercel
```

Add all environment variables from `.env.local` in the Vercel dashboard (Settings → Environment Variables). Cron jobs are configured automatically via `vercel.json`.

## Cricket Data API

CricBoss uses a **generic adapter pattern** — you bring your own cricket data API.

### Interface

Implement `ICricketDataProvider` from `src/lib/api/cricket-adapter.ts`:

| Method | Purpose |
|--------|---------|
| `fetchMatchPoints(id)` | Full scorecard (batting/bowling/fielding) + player list |
| `fetchLiveScores()` | Live scores for active matches |
| `fetchMatchInfo(id)` | Match status (to detect completion) |
| `fetchScorecard(id)` | Scorecard only (can delegate to fetchMatchPoints) |
| `fetchSquad(id)` | Playing XI lineup |
| `fetchSeasonFixtures()` | All season fixtures |
| `getTeamMap()` | API team ID → DB team short_name mapping |

### Wiring it up

1. Create your provider (e.g., `src/lib/api/my-provider.ts`) implementing `ICricketDataProvider`
2. Call `setCricketProvider(new MyProvider())` at app initialization
3. The cron routes and admin actions will use your provider automatically

### Popular cricket APIs

- [CricketData.org](https://cricketdata.org) (api.cricapi.com)
- [SportMonks Cricket](https://www.sportmonks.com/cricket-api)
- [RapidAPI Cricbuzz](https://rapidapi.com/cricbuzz)

## Scoring Rules

Scoring rules are **NOT seeded** — the admin must add them via the Admin Panel (or SQL) after first deploy.

The scoring engine expects these rule names:

**Batting**: `run`, `four_bonus`, `six_bonus`, `half_century`, `century`, `thirty`, `duck`, `sr_above_170`, `sr_150_170`, `sr_70_80`, `sr_below_70`

**Bowling**: `wicket`, `maiden`, `three_wicket_haul`, `four_wicket_haul`, `five_wicket_haul`, `econ_below_5`, `econ_5_6`, `econ_10_11`, `econ_above_11`

**Fielding**: `catch`, `stumping`, `run_out`, `three_catch_bonus`

Add them via SQL:

```sql
INSERT INTO scoring_rules (category, name, label, points, is_active) VALUES
  ('batting', 'run', 'Run Scored', 1, true),
  ('batting', 'four_bonus', 'Boundary Bonus (4)', 1, true),
  ('batting', 'six_bonus', 'Six Bonus', 2, true),
  ('batting', 'half_century', 'Half Century (50+)', 10, true),
  ('batting', 'century', 'Century (100+)', 25, true),
  ('batting', 'thirty', 'Thirty (30+)', 5, true),
  ('batting', 'duck', 'Duck', -5, true),
  ('batting', 'sr_above_170', 'SR >= 170', 6, true),
  ('batting', 'sr_150_170', 'SR 150-170', 4, true),
  ('batting', 'sr_70_80', 'SR 70-80', -4, true),
  ('batting', 'sr_below_70', 'SR < 70', -6, true),
  ('bowling', 'wicket', 'Wicket', 25, true),
  ('bowling', 'maiden', 'Maiden Over', 8, true),
  ('bowling', 'three_wicket_haul', '3-Wicket Haul', 10, true),
  ('bowling', 'four_wicket_haul', '4-Wicket Haul', 15, true),
  ('bowling', 'five_wicket_haul', '5-Wicket Haul', 20, true),
  ('bowling', 'econ_below_5', 'Economy <= 5', 6, true),
  ('bowling', 'econ_5_6', 'Economy 5-6', 4, true),
  ('bowling', 'econ_10_11', 'Economy 10-11', -4, true),
  ('bowling', 'econ_above_11', 'Economy > 11', -6, true),
  ('fielding', 'catch', 'Catch', 8, true),
  ('fielding', 'stumping', 'Stumping', 10, true),
  ('fielding', 'run_out', 'Run Out', 10, true),
  ('fielding', 'three_catch_bonus', '3+ Catches Bonus', 5, true);
```

## Game Rules

- **11 players** per match from the combined Playing XI (22 available)
- **Composition**: 1-4 WK, 2-5 BAT, 1-3 AR, 2-5 BOWL, max 7 per IPL team
- **Budget**: 100 credits
- **Captain**: 2x points multiplier
- **Vice-Captain**: 1.5x points multiplier
- **Auto-pick**: Copies previous match team, no C/VC bonus as penalty
- **Lock**: Selections lock at match start time
- **No Result**: Flat 15 points to all users

## Project Structure

```
src/
├── app/                          # Next.js App Router
│   ├── (app)/                    # Protected routes
│   │   ├── dashboard/            # Home dashboard
│   │   ├── matches/              # Match listing
│   │   ├── match/[id]/pick/      # Team selection
│   │   ├── match/[id]/scores/    # Score breakdown
│   │   ├── leaderboard/          # Season standings
│   │   ├── profile/              # User profile
│   │   └── admin/                # Admin panel
│   ├── api/cron/                 # Cron endpoints
│   └── login/                    # Login page
├── components/                   # React components
├── actions/                      # Server Actions
├── lib/
│   ├── api/
│   │   ├── cricket-adapter.ts    # ⭐ Implement this interface
│   │   ├── index.ts              # Provider registry
│   │   └── utils.ts              # Shared parsing utilities
│   ├── scoring.ts                # Fantasy points engine
│   ├── validation.ts             # Team composition rules
│   └── supabase/                 # Supabase clients
└── supabase/
    └── migrations/               # Database schema + seed data
```

## Commands

```bash
npm run dev          # Start dev server
npm run build        # Production build
npx supabase db push # Push migrations to Supabase
```

## Customization

- **Branding**: Edit `src/app/layout.tsx`, `src/app/login/page.tsx`, `public/manifest.json`
- **Theme**: Edit `src/app/globals.css` (CSS variables)
- **Teams**: Modify `supabase/migrations/002_seed_data.sql` or use admin SQL
- **Players**: Same — modify seed data or manage via admin panel
- **Scoring**: Add/edit via admin panel or `scoring_rules` table
