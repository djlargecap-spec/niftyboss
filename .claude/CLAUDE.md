# CricBoss — Fantasy Cricket League

## Project Overview
Whitelabel fantasy cricket web app for office leagues (up to 100 users).
Users pick 11 players per match, earn fantasy points post-match, compete on a season leaderboard.
No real money. Simple, fun, office-friendly.

## Tech Stack
- Framework: Next.js 16 (App Router), TypeScript, strict mode
- UI: Tailwind CSS + shadcn/ui (dark theme, mobile-first)
- Backend/DB: Supabase (PostgreSQL + Auth + RLS)
- Hosting: Vercel (free tier)
- Data API: Generic adapter pattern — bring your own cricket API
- Mobile: PWA (installable, add-to-home-screen)
- Auth: Supabase Auth with Google OAuth

## Architecture Rules
- Use Next.js App Router (not Pages Router)
- Use Server Components by default; 'use client' only when needed
- Use Server Actions for mutations (not API routes)
- Use Supabase RLS for authorization — never trust the client
- All env vars with NEXT_PUBLIC_ prefix are client-safe; others are server-only
- No Redux, no TRPC, no Zustand — use React state + server actions
- No extra libraries without asking first

## Cricket Data Adapter Pattern
The app uses `ICricketDataProvider` interface (`src/lib/api/cricket-adapter.ts`).
To integrate a new cricket API:
1. Implement the interface in a new file (e.g., `src/lib/api/my-provider.ts`)
2. Call `setCricketProvider(new MyProvider())` at initialization
3. Cron routes and admin actions use the provider automatically

Key methods: `fetchMatchPoints`, `fetchLiveScores`, `fetchMatchInfo`, `fetchScorecard`, `fetchSquad`, `fetchSeasonFixtures`, `getTeamMap`

## Mobile Optimization Rules
- Design mobile-first: start at 390px, scale up
- Minimum tap target: 44x44px
- Use `dvh` units instead of `vh` for mobile viewport
- Bottom sheet pattern for selection UI on mobile
- No hover-only interactions — everything must work with touch
- PWA: manifest.json + service worker for add-to-home-screen
- Safe area insets for notched phones

## File Structure
```
src/
├── app/
│   ├── layout.tsx                  # Root layout (dark theme, PWA meta)
│   ├── (app)/                      # Route group — shares nav layout
│   │   ├── layout.tsx              # NavBar wrapper
│   │   ├── dashboard/page.tsx      # Home dashboard
│   │   ├── matches/page.tsx        # All matches list
│   │   ├── match/[id]/
│   │   │   ├── pick/page.tsx       # Team selection (most important)
│   │   │   └── scores/page.tsx     # Post-match scoreboard
│   │   ├── leaderboard/page.tsx    # Season + match leaderboards
│   │   ├── profile/page.tsx        # User stats + settings
│   │   └── admin/
│   │       ├── page.tsx
│   │       ├── match/[id]/page.tsx
│   │       └── players/page.tsx
│   ├── api/cron/                   # Cron endpoints
│   ├── auth/                       # Auth callback routes
│   └── login/page.tsx
├── components/
│   ├── ui/                         # shadcn/ui primitives
│   ├── player-card.tsx
│   ├── team-selector.tsx
│   ├── composition-tracker.tsx
│   ├── countdown-timer.tsx
│   ├── match-card.tsx
│   ├── nav-bar.tsx
│   ├── rank-badge.tsx
│   ├── stat-card.tsx
│   ├── team-badge.tsx
│   ├── podium.tsx
│   └── install-prompt.tsx          # PWA install banner
├── lib/
│   ├── supabase/
│   │   ├── client.ts               # createBrowserClient
│   │   ├── server.ts               # createServerClient
│   │   ├── admin.ts                # service_role client (createAdminClient)
│   │   └── middleware.ts
│   ├── api/
│   │   ├── cricket-adapter.ts      # ICricketDataProvider interface
│   │   ├── index.ts                # Provider registry
│   │   └── utils.ts                # Shared parsing utilities
│   ├── scoring.ts                  # Fantasy points engine
│   ├── validation.ts               # Team composition rules
│   ├── types.ts
│   └── avatar.ts                   # getInitials, getAvatarColor
├── actions/                        # Server Actions
│   ├── selections.ts
│   ├── scoring.ts
│   └── matches.ts
└── supabase/
    └── migrations/
```

## Coding Conventions
- Use `function` for components, `const` arrow for utilities
- Prefer named exports over default exports
- Error handling: try/catch in server actions, error.tsx boundaries in pages
- Loading states: loading.tsx skeletons per route segment
- Use Zod for form validation
- Comments only for "why", not "what"

## Game Rules Summary
- 11 players per match from combined Playing XI (22 available)
- Composition: 1-4 WK, 2-5 BAT, 1-3 AR, 2-5 BOWL, max 7 per IPL team
- Budget: 100 credits
- Captain (2x), Vice-Captain (1.5x)
- Lock at match start time
- Auto-pick: copies previous match team, no C/VC bonus as penalty
- Scoring: post-match only, rules stored in DB (admin-editable)
- No Result: flat 15 pts to all users

## Commands
- `npm run dev` — start dev server
- `npm run build` — production build
- `npx supabase db push` — push migrations

## Learned Patterns & Gotchas

### Supabase: `.maybeSingle()` vs `.single()`
- `.single()` throws `PGRST116` error when zero rows returned — crashes `Promise.all` for new users
- `.maybeSingle()` returns `{ data: null, error: null }` when zero rows — safe for optional queries
- Use `.single()` only when a row is guaranteed (e.g., by DB constraint)
- Use `.maybeSingle()` for: `season_leaderboard` (new users), last completed match, any nullable lookup

### Supabase: Two-Phase Parallel Fetch Pattern
Replace sequential `await` chains with `Promise.all` phases:
```typescript
// Phase 1: all queries that only depend on user.id
const [profileRes, rankRes, matchesRes] = await Promise.all([
  supabase.from("profiles").select("*").eq("id", user.id).single(),
  supabase.from("season_leaderboard").select("*").eq("user_id", user.id).maybeSingle(),
  supabase.from("matches").select("*").eq("status", "upcoming").limit(5),
])

// Phase 2: queries that need Phase 1 IDs — also parallel
const [scoresRes, subsRes] = await Promise.all([
  matchesRes.data?.length
    ? supabase.from("user_match_scores")...in("match_id", matchesRes.data.map(m => m.id))
    : Promise.resolve({ data: [] }),
  ...
])
```

### Supabase: Admin Client
Use `createAdminClient()` from `@/lib/supabase/admin` (service_role) for server-side mutations that bypass RLS — scoring updates, admin actions, etc. Never use on the client.

### vaul Drawer: `data-vaul-no-drag`
vaul's drag-to-dismiss gesture intercepts touch events on scrollable areas, making buttons unresponsive. Add `data-vaul-no-drag` to any scrollable container inside a Drawer that contains interactive elements.

### Mobile: Safe-Area-Aware Fixed Positioning
For fixed elements above the bottom nav on notched/gesture phones:
```css
bottom: calc(3.5rem + env(safe-area-inset-bottom))
padding-bottom: calc(10rem + env(safe-area-inset-bottom))
padding-bottom: max(1.5rem, env(safe-area-inset-bottom))
```

### Cricket Data API: Player Name Matching
Cricket API player names don't match DB names exactly. Use fuzzy matching utilities in `src/lib/api/utils.ts` for handling initials, middle names, and common spelling variants.

### (app) Route Group
The `(app)/` route group shares a layout with `NavBar`. The layout does NOT re-run on soft navigation between routes that share it — only on hard load.

---

## Context Management

Context is your most important resource.
Proactively use subagents (Task tool) to keep exploration, research, and verbose
operations out of the main conversation.

**Default to spawning agents for:**
- Codebase exploration (reading 3+ files to answer a question)
- Research tasks (web searches, doc lookups, investigating how something works)
- Code review or analysis (produces verbose output)
- Any investigation where only the summary matters

**Stay in main context for:**
- Direct file edits the user requested
- Short, targeted reads (1-2 files)
- Conversations requiring back-and-forth
- Tasks where user needs intermediate steps

**Rule of thumb:** If a task will read more than ~3 files or produce output
the user doesn't need to see verbatim, delegate it to a subagent and return
a summary.

---

## Workflow Orchestration

### 1. Plan Mode Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately — don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes — don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests — then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

---

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

---

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.
