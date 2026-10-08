# ModeQuest: Lagos

A free browser life-sim set in Lagos, where hustling teaches real skills. Players keep their needs up, work shifts, ride danfos through go-slow, dodge scam DMs, survive NEPA outages, save and invest, run businesses and chase a lifetime dream. The learning (budgeting, inflation, compound interest, scam awareness, coding logic) is part of the mechanics, not bolted on.

Built by Mode Digital Creations as the web successor to the ModeQuest Android game, inspired by the success of browser life-sims like Lagos Life. Aimed at teens and young adults.

## Run it

```bash
npm install
npm run dev        # http://localhost:3000
npm test           # engine, puzzle and balance tests (Vitest)
npm run typecheck
npm run lint
npm run build
```

## What's in the game

| System | Details |
|---|---|
| Needs | Hunger, Energy, Hygiene, Fun and Social decay in real time. Together with Health they set your mood, and mood scales pay and learning. Starving or exhaustion can put you in hospital. |
| Clock | 1× = 2 game minutes per second while idle and 20 while busy. Pause and 1×/2×/3× speeds. Day 1 is a Monday at 7am. |
| Map | 15 Lagos places with opening hours, plus your home. Travel by trek, keke, danfo, BRT, ride-hail or your own car, each with its own time and fare. Rush-hour traffic, bridge crossings, rain and flooding all affect trips. |
| Homes | From Uncle Segun's couch to a Banana Island penthouse. Rent is charged every Saturday at 8am. Miss it twice and you're evicted. Each area's NEPA tariff band (A–D) decides how many hours of light you get. |
| Power | A NEPA schedule is rolled each day. Laptop and TV activities stop when the light goes. A generator (fuel costs) or solar fixes that. |
| Careers | 6 tracks × 5 levels: Tech, Food, Creative, Trade, Banking, Logistics. You work shifts at the workplace, choose a work style, and can answer a task question for a +15% bonus. Promotions need performance, skills and sometimes certificates. 3 missed shifts gets you fired. |
| Skills & courses | 7 skills from 0 to 10. Certificates come from courses at Yaba Tech Hub, UNILAG and the National Theatre. |
| Money | Cash and bank accounts, POS withdrawal fees, savings interest, about 23%/year inflation with wages only partly keeping up, T-Bills, an index fund, crypto, and loans including a predatory loan app. |
| Businesses | 8 businesses from a POS stand to an event centre. Profit is paid every Monday, depends on your skills and has some randomness. Profits halve if you don't manage the business for 2 weeks. |
| Scams | Phishing, fake alerts, Ponzi schemes (they pay out once, then collapse), money-mule offers, cloned-friend messages and fake job fees. Each reply comes with an explanation. |
| People | 12 NPCs with weekly schedules. You can gist, joke, ask advice (each NPC teaches a real lesson), hang out or give gifts. Friends message you, borrow money, and invite you to parties. |
| Mode Academy | 11 quiz and sorting lessons plus 6 Code Lab grid-robot puzzles that teach sequencing and loops. Passing a lesson pays a one-time grant. |
| Goals | 6 lifetime dreams and 16 achievements. |

## Architecture

```
src/game/            Pure TypeScript engine (no React, no browser APIs)
  types.ts           GameState and Command types
  engine.ts          newGame, advance (minute simulation), dispatch (commands), queries
  helpers.ts         Money, needs, skills and relationship helpers
  goals.ts           Achievements and dream progress
  puzzles.ts         Code Lab interpreter
  data/              Content: world, activities, economy, people, events, lessons
  persistence.ts     SaveAdapter interface + localStorage implementation, export/import
  store.ts           Zustand store and real-time clock
src/components/      React UI (title, creator, HUD, map, place panel, phone apps)
```

- **Deterministic engine.** All randomness comes from a seeded RNG stored in `GameState.rng`. The same save and the same commands always produce the same result.
- **Command-driven.** The UI never changes state directly. It sends `Command` objects to `dispatch()`, and time moves forward only through `advance()`. This is the seam for multiplayer.
- **Versioned saves.** `migrate()` upgrades old saves. Bump `SAVE_VERSION` when the schema changes.

### Road to multiplayer

The solo build is structured so a shared city can be added without rewriting the game:

1. **Accounts and cloud saves.** Add a `ServerSaveAdapter` that implements `SaveAdapter` (e.g. Supabase or Postgres behind Next.js route handlers).
2. **Authoritative server.** Run `dispatch()` and `advance()` on the server, with clients sending `Command`s. The engine has no browser dependencies, so it runs on Node unchanged. Right now the client decides the shift task bonus; the server would validate it instead.
3. **Shared city.** Move `world` (weather, NEPA, inflation) into a city-wide state. Show other players at locations next to NPCs, using `npcsAt` as the model.
4. **Social features.** Chat, money transfers between players, leaderboards (net worth, scams avoided, Academy progress), and a weekly youth-council election that sets city policy.

## Content notes

- All naira is in-game money with no real value. There is no cash-out.
- Places are inspired by real Lagos landmarks. All characters, banks and businesses are fictional.
- Content is youth-safe: no gambling, alcohol or nightlife venues.
