# ModeQuest: Naija

A free browser life-sim set in real Nigerian cities, where hustling teaches real skills. Players live in **Lagos, Abuja, Port Harcourt or Enugu**. They keep their needs up, work shifts, ride danfos and green cabs, dodge scam DMs, survive NEPA outages, save and invest, run businesses and chase a lifetime dream. The learning (budgeting, inflation, compound interest, scam awareness, digital safety, coding logic) is part of the mechanics. It's built for schools, with teacher-managed classes, assignments and progress tracking.

Built by Mode Digital Creations as the web successor to the ModeQuest Android game.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000 (works fully offline without any setup)
npm test             # engine, city, puzzle and balance tests (Vitest)
npm run typecheck
npm run lint
npm run build
./scripts/test-db.sh # database migration + row-level security tests on a throwaway local Postgres
```

## The game

| System | Details |
|---|---|
| Cities | 4 city packs (`src/game/data/cities/*`), each with its own map, 16–18 places, 7 homes, local transport names, local food, weather, rush-hour traffic and 7–12 locals. Travel between cities by luxury bus from a motor park or by plane from an airport. |
| Needs | Hunger, Energy, Hygiene, Fun and Social decay in real time. Together with Health they set your mood, and mood scales pay and learning. Starving or exhaustion can put you in hospital; boredom and loneliness mostly hurt mood. |
| Careers | 9 tracks × 5 levels. Tech, Food, Creative, Trade, Banking, Logistics and Health exist in every city. Civil Service is Abuja-only (needs a ministry) and Oil & Gas is Port Harcourt-only (needs an industrial area). You work shifts, choose a work style, and can answer an Academy question for a task bonus. Some promotions need certificates. |
| Homes & power | Seven home tiers per city, from a relative's couch to a penthouse. Rent is charged every Saturday and missing it twice gets you evicted. Each area's NEPA tariff band decides your hours of light; a generator or solar covers outages. |
| Money | Cash and bank accounts, POS fees, savings interest, about 23%/year inflation, T-Bills, an index fund, crypto, loans (including a predatory loan app) and 8 businesses. |
| Scams & events | 11 scam DMs (fake bank, NIN, scholarship, job fees, Ponzi, money mules, fake alerts, cloned friends, betting "sure odds"...). Every reply explains the red flags. City events: harmattan, soot, masquerades, owambe, flooding. |
| Mode Academy | 17 quiz and sorting lessons plus 8 Code Lab puzzles. Passing a lesson pays a one-time grant. Teachers can assign lessons. |

## Online play, schools & teachers (Supabase)

Without Supabase configured the game is single-player and saves in the browser. With it configured:

- **Accounts & cloud saves.** Independent players (13+) sign up with email and a public nickname. Saves sync to the cloud, so you can continue on any device.
- **Shared cities.** You see other players at the same place in your city (Supabase Realtime presence), with preset **quick-chat** phrases only. There's no free text with strangers.
- **Leaderboards** for net worth, Academy progress and scams beaten, both national and per class.
- **Gifts.** Capped at ₦50k per gift and ₦100k a day, and only between classmates or between independent players.
- **Teachers** (`/teacher`) can:
  - create classes and get a 6-character class code,
  - bulk-create student logins (username + 6-digit PIN, no student email or phone) and print login cards,
  - assign lessons,
  - track progress (lessons passed, scams avoided and fallen for, activity, net worth) and export it as CSV,
  - moderate the class chat.
- **Students** sign in with class code + username + PIN. Their public name is a random nickname such as `SwiftDanfo42`; real names are visible only to their teacher. Class chat is the only free text, and it automatically hides insults, phone numbers, emails and links.

### Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run `supabase/migrations/20261008000000_init.sql`.
3. In **Authentication → Providers → Email**, keep email confirmation on for player and teacher sign-ups. (Student logins are created confirmed by the server.)
4. Copy `.env.example` to `.env.local` and fill in values from **Settings → API**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...   # server only — used by /api/teacher/* to create student logins
   ```
5. Restart `npm run dev`. The title screen now shows **Play online**.

## Architecture

```
src/game/                 Pure TypeScript engine (no React, no browser APIs)
  data/cities/*.ts        City packs: map, places, homes, people, transport, local flavour
  data/world.ts           City registry, transport, travel between cities
  data/*.ts               Activities, economy, events/scams, lessons
  engine.ts               newGame, advance (minute simulation), dispatch (commands), migrate
  persistence.ts          SaveAdapter + localStorage implementation
  store.ts                Zustand game store + real-time clock
src/online/               Supabase: auth/session, cloud saves, presence, social, teacher APIs
src/app/api/teacher/*     Route handlers (service role) to create/reset/remove student logins
supabase/migrations/      Database schema, functions and row-level security
supabase/tests/           RLS tests (run with scripts/test-db.sh)
src/components/           React UI: title, creator, HUD, maps, place panel, phone apps, teacher dashboard
```

- **Adding a city** means adding one data file in `data/cities/` and listing it in `CITIES`. Activities and careers target place *kinds* (`market`, `tech_hub`, `buka`, …), so they work anywhere a matching place exists.
- **Deterministic engine.** All randomness comes from a seeded RNG stored in the save. The UI only sends `Command`s, and `advance()` moves time.
- **Versioned saves.** `migrate()` upgrades old saves (v1 Lagos-only → v2 multi-city).
- **Trust model.** Each player's game still runs in their own browser, so a determined player could fake their own leaderboard numbers. Everything involving other people is enforced in the database: who can see what, gifts, chat and class membership. Moving the engine to the server (it has no browser dependencies) is the next hardening step.

## Content notes

- All naira is in-game money with no real value. There is no cash-out.
- Places are inspired by real Nigerian landmarks. All characters, banks and businesses are fictional.
- Content is youth-safe: no gambling, alcohol or nightlife venues. Betting appears only as a scam to avoid.
