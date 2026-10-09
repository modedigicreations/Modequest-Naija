import type { GameState } from "./types";

// ---------------------------------------------------------------------------
// Seeded RNG (mulberry32). State lives in GameState.rng so a save replays the
// same way and a future server can be authoritative over randomness.
// ---------------------------------------------------------------------------

export function nextRandom(s: GameState): number {
  let t = (s.rng = (s.rng + 0x6d2b79f5) | 0);
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

export function chance(s: GameState, p: number): boolean {
  return nextRandom(s) < p;
}

export function randInt(s: GameState, min: number, max: number): number {
  return min + Math.floor(nextRandom(s) * (max - min + 1));
}

export function pick<T>(s: GameState, arr: readonly T[]): T {
  return arr[Math.floor(nextRandom(s) * arr.length)];
}

/** Approximately normal, mean 0, sd 1 (Box–Muller). */
export function gaussian(s: GameState): number {
  const u = Math.max(nextRandom(s), 1e-9);
  const v = nextRandom(s);
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
}

export const clamp = (v: number, lo = 0, hi = 100) => Math.max(lo, Math.min(hi, v));

// ---------------------------------------------------------------------------
// Time. Game time is minutes since Day 1 00:00, and Day 1 is a Monday.
// ---------------------------------------------------------------------------

export const MIN_PER_DAY = 1440;
export const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;
export const WEEKDAYS_LONG = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const dayOf = (t: number) => Math.floor(t / MIN_PER_DAY) + 1;

// ---------------------------------------------------------------------------
// Real clock. The game day follows West Africa Time (UTC+1): what the clock
// says in the game is what it says on the player's phone in Nigeria.
// Game time t lines up with the real week when t ≡ realMinute + 3 days
// (mod 1 week), because 1 Jan 1970 was a Thursday and game Day 1 is a Monday.
// ---------------------------------------------------------------------------

export const MIN_PER_WEEK = MIN_PER_DAY * 7;
const WAT_OFFSET_MINUTES = 60;

/** Minutes since 1970 in Nigerian time. */
export const realMinute = (nowMs: number) => Math.floor(nowMs / 60000) + WAT_OFFSET_MINUTES;

/** The earliest game time ≥ atLeast that shows the same weekday and time as the real clock. */
export function alignedGameTime(nowMs: number, atLeast = 0): number {
  const inWeek = (((realMinute(nowMs) + 3 * MIN_PER_DAY) % MIN_PER_WEEK) + MIN_PER_WEEK) % MIN_PER_WEEK;
  return inWeek >= atLeast ? inWeek : inWeek + Math.ceil((atLeast - inWeek) / MIN_PER_WEEK) * MIN_PER_WEEK;
}

/** Actions finish this many times faster than real life (an 8h shift takes 8 minutes). */
export const ACTION_SPEED = 60;

/** Real minutes an action takes, from its in-world length. */
export const actionMinutes = (gameMinutes: number) => Math.max(1, Math.ceil(gameMinutes / ACTION_SPEED));
export const weekdayOf = (t: number) => Math.floor(t / MIN_PER_DAY) % 7; // 0 = Mon
export const weekOf = (t: number) => Math.floor(t / (MIN_PER_DAY * 7)) + 1;
export const minuteOfDay = (t: number) => ((t % MIN_PER_DAY) + MIN_PER_DAY) % MIN_PER_DAY;
export const hourOf = (t: number) => Math.floor(minuteOfDay(t) / 60);

export function formatClock(t: number): string {
  const m = minuteOfDay(t);
  const h = Math.floor(m / 60);
  const mm = m % 60;
  const suffix = h < 12 ? "am" : "pm";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${mm.toString().padStart(2, "0")}${suffix}`;
}

export function formatDuration(min: number): string {
  min = Math.round(min);
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h}h ${m}m` : `${h}h`;
}

export function formatNaira(n: number): string {
  const sign = n < 0 ? "-" : "";
  return `${sign}₦${Math.round(Math.abs(n)).toLocaleString("en-NG")}`;
}

export function formatHour(h: number): string {
  const hh = ((h % 24) + 24) % 24;
  const suffix = hh < 12 ? "am" : "pm";
  const h12 = hh % 12 === 0 ? 12 : hh % 12;
  return `${h12}${suffix}`;
}

// ---------------------------------------------------------------------------
// Skills: XP → level (0–10). Each level needs progressively more XP.
// ---------------------------------------------------------------------------

export const SKILL_THRESHOLDS = [0, 40, 100, 180, 280, 400, 550, 730, 940, 1180, 1450];

export function skillLevel(xp: number): number {
  let lvl = 0;
  for (let i = 1; i < SKILL_THRESHOLDS.length; i++) if (xp >= SKILL_THRESHOLDS[i]) lvl = i;
  return lvl;
}

export function skillProgress(xp: number): number {
  const lvl = skillLevel(xp);
  if (lvl >= 10) return 1;
  const lo = SKILL_THRESHOLDS[lvl];
  const hi = SKILL_THRESHOLDS[lvl + 1];
  return (xp - lo) / (hi - lo);
}
