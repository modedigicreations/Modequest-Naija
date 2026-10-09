# ModeQuest: Naija

A free browser life-sim set in real Nigerian cities, where hustling teaches real skills. Players live in **Lagos, Abuja, Port Harcourt, Enugu, Aba, Kaduna or Calabar**. They keep their needs up, work shifts, ride danfos and green cabs, dodge scam DMs, survive NEPA outages, save and invest, run businesses and chase a lifetime dream. The learning (budgeting, inflation, compound interest, scam awareness, digital safety, coding logic) is part of the mechanics. It's built for schools, with teacher-managed classes, assignments and progress tracking.

Built by Mode Digital Creations as the web successor to the ModeQuest Android game.

## Run it

```bash
npm install
npm run dev          # http://localhost:3000 (works fully offline without any setup)
npm test             # engine, city, puzzle and balance tests (Vitest)
npm run typecheck
npm run lint
npm run build
npm run test:db      # all migrations + row-level security tests on a throwaway local Postgres
npm run test:live    # live end-to-end tests against Supabase + Paystack TEST mode (app must be running;
                     # set APP_URL, default http://localhost:3000). Refuses to run with live Paystack keys.
```

## The game

| System | Details |
|---|---|
| Cities | 4 city packs (`src/game/data/cities/*`), each with its own map, 16–18 places, 7 homes, local transport names, local food, weather, rush-hour traffic and 7–12 locals. Visit another city by bus or plane from the **Travel** app (from anywhere; booking away from the terminal adds the ride there), or move your whole life to another city from the title screen (**Change city**). |
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

### In-app purchases (Paystack)

| Product | Price | Notes |
|---|---|---|
| Cosmetics (outfits & accessories) | ₦400–₦800 | Visual only — worn from the **Style** app |
| Naija Style Pack | ₦1,500 | 4 cosmetics |
| Supporter pass | ₦1,000 / 30 days | ⭐ badge on leaderboards and map + an outfit to keep |
| Game money | ₦300 / ₦700 / ₦1,500 | ₦30k / ₦80k / ₦200k in-game. Kept off wealth leaderboards (they rank *earned* worth) and shown to teachers |
| School plans | ₦7,500 / term, ₦35,000 / year | Free: 1 class, 40 students · Classroom: 5 / 250 · Whole School: 60 / 3,000. Enforced in the database |

- **Flow:** `/api/pay/init` creates the order with the catalog price (never the browser's) and a Paystack checkout. After payment Paystack calls `/api/pay/webhook` (HMAC-verified) and the player returns to `/pay/return`, which calls `/api/pay/verify`. Either path grants entitlements; both are idempotent, and amounts are checked against the order.
- **Game money** is credited in the game and saved to the cloud first; only then are those top-ups marked claimed, so paid money can't be lost.
- **Protections:** class (student) accounts can't buy; buyers confirm they're 13+ and, if under 18, have a parent's permission; ₦20,000 cap per player per 30 days (school plans excluded); max 5 open checkouts per 10 minutes.
- **No webhook required.** The Paystack business's single webhook slot can stay with another app. Purchases complete in three ways (all idempotent):
  1. `/pay/return` verifies as soon as the buyer comes back;
  2. `/api/pay/reconcile` runs whenever a signed-in player opens the game or the Store, settling their unpaid orders from the last 48 h that Paystack reports as paid (covers bank transfer/USSD where the tab was closed);
  3. `/api/pay/reconcile/all` — a scheduled sweep for everyone (Railway cron), protected by `CRON_SECRET`:
     `curl -X POST https://modequest.stream/api/pay/reconcile/all -H "Authorization: Bearer $CRON_SECRET"`.
  If you *do* have a free webhook slot, point it at `https://<your-domain>/api/pay/webhook` for instant confirmation.
- **Shared Paystack account:** ModeQuest references start with `mq_` and carry `metadata.product_id`, so they're easy to filter in Paystack reports. If another app owns the webhook it will also receive ModeQuest events — it should ignore references it doesn't recognise.

### Setup

1. Create a free project at [supabase.com](https://supabase.com).
2. In **SQL Editor**, run every file in `supabase/migrations/` in name order.
   Economy checks (`20261012000000_economy_checks.sql`): the server re-reads summary numbers from each save and flags implausible ones (kept off leaderboards, ⚠️ for teachers); clear a false alarm with `update saves set flagged = null where user_id = '…'`.
   Invites: every player and teacher gets a referral code (`/invite/CODE`); sign-ups with a code are recorded in `referrals` (see `20261010000000_referrals.sql`). Class accounts never refer or get referred.
3. In **Authentication → Providers → Email**, keep email confirmation on for player and teacher sign-ups. (Student logins are created confirmed by the server.)
4. Copy `.env.example` to `.env.local` and fill in values from **Settings → API**:
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   SUPABASE_SERVICE_ROLE_KEY=...   # server only — used by /api/teacher/* and /api/pay/*
   PAYSTACK_SECRET_KEY=sk_...      # server only
   NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_...   # optional; the store opens whenever the secret key is set
   NEXT_PUBLIC_APP_URL=https://your-domain   # Paystack redirects back here
   CRON_SECRET=...                 # protects the scheduled payment sweep
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
src/shop/                 Store catalog (shared), Paystack checkout/verify/fulfilment (server), store client
src/app/api/teacher/*     Route handlers (service role): student logins, class deletion
src/app/api/pay/*         Route handlers: checkout, verify, Paystack webhook
supabase/migrations/      Database schema, functions and row-level security
supabase/tests/           RLS tests (npm run test:db)
scripts/live/             Live end-to-end tests (npm run test:live)
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
