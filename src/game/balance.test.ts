import { describe, expect, it } from "vitest";
import { advance, dispatch, newGame, shiftStatus } from "./engine";
import { getCareer } from "./data/economy";
import { EVENTS } from "./data/events";
import type { Command, GameState } from "./types";
import { hourOf, minuteOfDay, weekdayOf } from "./util";

/**
 * Balance smoke test: a sensible bot plays a few weeks. It should be able to
 * survive (no eviction, few hospital trips) and save a little — but not get
 * rich quickly from an entry-level job.
 */
function try_(s: GameState, cmd: Command): GameState {
  return dispatch(s, cmd).state;
}

function untilFree(s: GameState): GameState {
  let guard = 0;
  while ((s.activity || s.travel) && guard++ < 2000) {
    if (s.pendingEvent) s = resolve(s);
    else s = advance(s, 10);
  }
  return s;
}

function resolve(s: GameState): GameState {
  const pe = s.pendingEvent!;
  if (pe.outcome) return try_(s, { type: "resolveEvent", choiceId: "__dismiss" });
  const ev = EVENTS.find((e) => e.id === pe.eventId);
  const pref = ["return", "explain", "meter", "text", "ok", "go", "pay"];
  const id = ev ? (pref.find((p) => ev.choices.some((c) => c.id === p)) ?? ev.choices[0].id) : "__dismiss";
  s = try_(s, { type: "resolveEvent", choiceId: id });
  return s.pendingEvent ? try_(s, { type: "resolveEvent", choiceId: "__dismiss" }) : s;
}

function goTo(s: GameState, to: string): GameState {
  if (s.location === to) return s;
  s = try_(s, { type: "travel", to, mode: "brt" });
  return untilFree(s);
}

function playDay(s: GameState, workplace: string): GameState {
  const startDay = Math.floor(s.time / 1440);
  let guard = 0;
  while (Math.floor(s.time / 1440) === startDay && guard++ < 200) {
    if (s.pendingEvent) {
      s = resolve(s);
      continue;
    }
    // Reply safely to scam DMs (the bot has done the Academy lesson).
    for (const m of s.messages) {
      if (m.choices && !m.resolved) {
        const safe = m.choices[m.choices.length - 1].id;
        s = try_(s, { type: "replyMessage", messageId: m.id, choiceId: safe });
      }
    }
    const h = hourOf(s.time);
    const st = shiftStatus(s);
    const career = s.career ? getCareer(s.career.careerId)! : null;
    const m = minuteOfDay(s.time);

    if (career && st.workday && s.career!.lastShiftDay !== Math.floor(s.time / 1440) + 1 && m >= career.start * 60 - 150 && m <= career.start * 60 + 60) {
      if (s.needs.hunger < 60 && s.location === "home" && s.groceries > 0) {
        s = untilFree(try_(s, { type: "startActivity", activityId: "snack" }));
      }
      s = goTo(s, workplace);
      const now = shiftStatus(s);
      if (now.canStart) {
        s = untilFree(try_(s, { type: "startShift", workStyle: "steady", taskBonus: true }));
        if (s.groceries < 2) s = try_(s, { type: "buyGroceries", packs: 3 });
        s = goTo(s, "home");
      } else s = advance(s, 15);
      continue;
    }
    if (h >= 22 || h < 6 || s.needs.energy < 25) {
      s = goTo(s, "home");
      s = untilFree(try_(s, { type: "startActivity", activityId: "sleep" }));
      continue;
    }
    if (s.needs.hunger < 45) {
      if (s.location !== "home") s = goTo(s, "home");
      if (s.groceries > 0) s = untilFree(try_(s, { type: "startActivity", activityId: "snack" }));
      else {
        s = goTo(s, "amala_spot");
        s = untilFree(try_(s, { type: "startActivity", activityId: "amala" }));
      }
      continue;
    }
    if (s.location === "home" && s.needs.hygiene < 40) {
      s = untilFree(try_(s, { type: "startActivity", activityId: "bath" }));
      continue;
    }
    if (s.location === "home" && (s.needs.fun < 40 || s.needs.social < 40)) {
      s = untilFree(try_(s, { type: "startActivity", activityId: s.needs.social < s.needs.fun ? "call_family" : "skit" }));
      continue;
    }
    s = advance(s, 30);
  }
  return s;
}

describe("balance", () => {
  it("a diligent market apprentice survives 4 weeks and saves a little", () => {
    let s = newGame({
      name: "Bot",
      pronoun: "they",
      appearance: { skin: 0, hair: 0, hairColor: 0, outfit: 0, accessory: 0 },
      background: "hustler",
      traits: ["hardworking", "thrifty"],
      dream: "smart_money",
      seed: 2024,
    });
    s = try_(s, { type: "applyJob", careerId: "trade" });
    for (let d = 0; d < 28; d++) s = playDay(s, "balogun");

    const money = s.cash + s.bank;
    // Useful when tuning the economy:
    if (process.env.BALANCE_LOG) console.log({ money, shifts: s.stats.shiftsWorked, level: s.career?.level, hosp: s.stats.hospitalVisits, evictions: s.stats.evictions, weekday: weekdayOf(s.time) });
    expect(s.stats.evictions).toBe(0);
    expect(s.stats.hospitalVisits).toBeLessThanOrEqual(1);
    expect(s.stats.shiftsWorked).toBeGreaterThanOrEqual(18);
    expect(money).toBeGreaterThan(12000);
    expect(money).toBeLessThan(400000);
  });
});
