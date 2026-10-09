import { describe, expect, it } from "vitest";
import { ACTIVITIES } from "./data/activities";
import { BUSINESSES, CAREERS, INVESTMENTS, ITEMS, LOANS } from "./data/economy";
import { INTERACTIONS } from "./data/people";
import { LESSONS } from "./data/lessons";
import { CITIES, HOMES, LOCATIONS, getHome } from "./data/world";
import { advance, dispatch, newGame } from "./engine";
import { NEED_KEYS, SKILL_KEYS, type Command, type GameState } from "./types";

/**
 * Stress test: random players spam random commands across all cities for
 * weeks of game time. The game must never throw, and state must stay sane.
 */
function rng(seed: number) {
  let t = seed;
  return () => {
    t = (t + 0x6d2b79f5) | 0;
    let x = Math.imul(t ^ (t >>> 15), t | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

function randomCommand(s: GameState, r: () => number): Command {
  const pick = <T,>(a: readonly T[]) => a[Math.floor(r() * a.length)];
  const roll = r();
  const cityLocs = LOCATIONS.filter((l) => l.city === s.city);
  if (s.pendingEvent) return { type: "resolveEvent", choiceId: s.pendingEvent.outcome ? "__dismiss" : pick(["ok", "pay", "go", "help", "return", "keep", "mask", "watch", "buy", "refuse", "meter", "argue", "text", "explain", "plain"]) };
  if (roll < 0.25) return { type: "travel", to: pick([...cityLocs.map((l) => l.id), "home"]), mode: pick(["walk", "keke", "bus", "brt", "ride", "car"] as const) };
  if (roll < 0.5) return { type: "startActivity", activityId: pick(ACTIVITIES).id };
  if (roll < 0.55) return { type: "startShift", workStyle: pick(["steady", "hustle", "gist", "easy"] as const), taskBonus: r() < 0.5 };
  if (roll < 0.58) return { type: "applyJob", careerId: pick(CAREERS).id };
  if (roll < 0.6) return { type: "cancelActivity" };
  if (roll < 0.63) return { type: "bankTransfer", direction: pick(["deposit", "withdraw"] as const), amount: Math.floor(r() * 20000) };
  if (roll < 0.65) return { type: "buyItem", itemId: pick(ITEMS).id };
  if (roll < 0.67) return { type: "buyFood", items: { [["rice", "bread", "garri", "eggs", "nope"][Math.floor(r() * 5)]]: 1 + Math.floor(r() * 3) }, delivery: r() < 0.5 };
  if (roll < 0.69) return { type: "moveHouse", homeId: pick(HOMES).id };
  if (roll < 0.71) return { type: "invest", productId: pick(INVESTMENTS).id, amount: Math.floor(r() * 30000) };
  if (roll < 0.72) return { type: "divest", productId: pick(INVESTMENTS).id };
  if (roll < 0.74) return { type: pick(["buyBusiness", "upgradeBusiness", "sellBusiness", "manageBusiness"] as const), businessId: pick(BUSINESSES).id };
  if (roll < 0.76) return { type: pick(["takeLoan", "repayLoan"] as const), loanId: pick(LOANS).id };
  if (roll < 0.78) {
    const id = pick(["nursery_school", "private_school"]);
    const k = r();
    if (k < 0.4) return { type: "schoolSet", businessId: id, fee: Math.floor(r() * 80000), teachers: Math.floor(r() * 20), teacherLevel: pick([0, 1, 2] as const), scholarships: r() < 0.5 };
    if (k < 0.7) return { type: "schoolChase", businessId: id, method: pick(["remind", "send_home"] as const) };
    return { type: "schoolExam", businessId: id };
  }
  if (roll < 0.8) {
    const m = s.messages.find((x) => x.choices && !x.resolved);
    if (m) return { type: "replyMessage", messageId: m.id, choiceId: pick(m.choices!).id };
  }
  if (roll < 0.84) return { type: "talk", npcId: pick(CITIES.flatMap((c) => c.npcs)).id, interaction: pick(Object.keys(INTERACTIONS)) };
  if (roll < 0.86) return { type: "completeLesson", lessonId: pick(LESSONS).id, score: Math.floor(r() * 101) };
  if (roll < 0.88) return { type: "intercity", to: pick(CITIES).id, mode: pick(["coach", "flight"] as const) };
  if (roll < 0.89) return { type: "setSpeed", speed: pick([1, 2, 3] as const) };
  return { type: "markMessagesRead" };
}

function checkInvariants(s: GameState, where: string) {
  for (const k of NEED_KEYS) {
    expect(Number.isFinite(s.needs[k]), `${where} need ${k}`).toBe(true);
    expect(s.needs[k]).toBeGreaterThanOrEqual(0);
    expect(s.needs[k]).toBeLessThanOrEqual(100);
  }
  for (const k of SKILL_KEYS) expect(Number.isFinite(s.skills[k]), `${where} skill ${k}`).toBe(true);
  expect(Number.isFinite(s.cash), `${where} cash`).toBe(true);
  expect(Number.isFinite(s.bank), `${where} bank`).toBe(true);
  expect(s.cash, `${where} negative cash`).toBeGreaterThanOrEqual(0);
  expect(Number.isFinite(s.health)).toBe(true);
  expect(Number.isFinite(s.world.priceIndex)).toBe(true);
  for (const v of Object.values(s.investments)) expect(Number.isFinite(v) && v >= 0, `${where} investment`).toBe(true);
  expect(getHome(s.homeId), `${where} home`).toBeDefined();
  if (s.location !== "home") {
    const loc = LOCATIONS.find((l) => l.id === s.location);
    expect(loc, `${where} location ${s.location}`).toBeDefined();
    if (!s.travel) expect(loc!.city, `${where} location city`).toBe(s.city);
  } else {
    expect(getHome(s.homeId).city, `${where} home city`).toBe(s.city);
  }
  for (const n of Object.values(s.pantry)) expect(n).toBeGreaterThanOrEqual(0);
  expect(s.log.length).toBeLessThanOrEqual(120);
  expect(s.messages.length).toBeLessThanOrEqual(60);
}

describe("fuzz", () => {
  for (const city of CITIES) {
    for (const seed of [1, 2, 3]) {
      it(`random play in ${city.name} (seed ${seed}) stays consistent`, () => {
        const r = rng(seed * 97 + city.id.length);
        let s = newGame({
          city: city.id,
          name: "Fuzz",
          pronoun: "they",
          appearance: { skin: 0, hair: 0, hairColor: 0, outfit: 0, accessory: 0 },
          background: ["ajebutter", "hustler", "scholar", "lapo"][seed % 4],
          traits: ["social", "calm"],
          dream: "padi",
          seed,
        });
        let steps = 0;
        while (s.time < 35 * 1440 && steps < 6000) {
          steps++;
          const cmd = randomCommand(s, r);
          const res = dispatch(s, cmd);
          s = res.state;
          if (!s.pendingEvent) s = advance(s, Math.floor(r() * 240));
          checkInvariants(s, `step ${steps} after ${cmd.type}`);
        }
        expect(() => JSON.parse(JSON.stringify(s))).not.toThrow();
        expect(s.time).toBeGreaterThan(20 * 1440);
      });
    }
  }
});
