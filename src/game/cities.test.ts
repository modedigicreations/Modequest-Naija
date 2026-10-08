import { describe, expect, it } from "vitest";
import { ACTIVITIES } from "./data/activities";
import { CAREERS } from "./data/economy";
import { ALL_NPCS, CITIES, HOMES, LOCATIONS, findKind } from "./data/world";
import type { HomeTier, PlaceKind } from "./data/worldTypes";
import { advance, dispatch, migrate, newGame } from "./engine";
import type { GameState, NewGameOptions } from "./types";

const opts = (city: string): NewGameOptions => ({
  city,
  name: "Tester",
  pronoun: "they",
  appearance: { skin: 0, hair: 0, hairColor: 0, outfit: 0, accessory: 0 },
  background: "hustler",
  traits: ["hardworking", "thrifty"],
  dream: "smart_money",
  seed: 9,
});

const CORE_KINDS: PlaceKind[] = ["tech_hub", "library", "university", "gadget_market", "mall", "food_market", "buka", "stadium", "theatre", "market", "hospital", "bank", "cafe", "park", "motor_park", "airport"];
const TIERS: HomeTier[] = ["couch", "room", "hostel", "selfcon", "flat", "luxury", "penthouse"];

describe("city packs", () => {
  it("have globally unique location, home and NPC ids", () => {
    const ids = [...LOCATIONS.map((l) => l.id), ...HOMES.map((h) => h.id)];
    expect(new Set(ids).size).toBe(ids.length);
    expect(new Set(ALL_NPCS.map((n) => n.id)).size).toBe(ALL_NPCS.length);
  });

  for (const c of CITIES) {
    it(`${c.name} has every core place kind and home tier`, () => {
      for (const k of CORE_KINDS) expect(findKind(c.id, k), `${c.name} missing ${k}`).toBeDefined();
      for (const t of TIERS) expect(c.homes.some((h) => h.tier === t), `${c.name} missing ${t} home`).toBe(true);
      expect(c.homes.find((h) => h.tier === "couch")?.hidden).toBe(true);
    });

    it(`${c.name} NPCs only visit places in their own city and give advice`, () => {
      for (const n of c.npcs) {
        expect(n.advice.length).toBeGreaterThan(0);
        for (const sch of n.schedule) expect(c.locations.some((l) => l.id === sch.at), `${n.id} -> ${sch.at}`).toBe(true);
      }
    });

    it(`${c.name} places are on the map`, () => {
      for (const l of [...c.locations, ...c.homes]) {
        expect(l.x).toBeGreaterThan(40);
        expect(l.x).toBeLessThan(960);
        expect(l.y).toBeGreaterThan(30);
        expect(l.y).toBeLessThan(680);
      }
    });
  }

  it("every activity can be done somewhere", () => {
    const kinds = new Set<string>(["home", ...LOCATIONS.flatMap((l) => l.kinds)]);
    for (const a of ACTIVITIES) expect(a.at.some((k) => kinds.has(k)), a.id).toBe(true);
  });

  it("every career has a workplace in at least one city", () => {
    for (const c of CAREERS) expect(LOCATIONS.some((l) => l.kinds.includes(c.workplace)), c.id).toBe(true);
  });
});

describe("multi-city play", () => {
  for (const c of CITIES) {
    it(`starts at home in ${c.name}`, () => {
      const s = newGame(opts(c.id));
      expect(s.city).toBe(c.id);
      expect(HOMES.find((h) => h.id === s.homeId)?.city).toBe(c.id);
    });
  }

  it("travels between cities by bus and arrives at the motor park", () => {
    let s: GameState = newGame(opts("enugu"));
    s.cash = 100000;
    s.location = findKind("enugu", "motor_park")!.id;
    const r = dispatch(s, { type: "intercity", to: "portharcourt", mode: "coach" });
    expect(r.error).toBeUndefined();
    s = r.state;
    expect(s.cash).toBeLessThan(100000);
    let guard = 0;
    while (s.travel && guard++ < 200) {
      s = s.pendingEvent ? dispatch(s, { type: "resolveEvent", choiceId: "__dismiss" }).state : advance(s, 30);
      if (s.pendingEvent && !s.pendingEvent.outcome) s = { ...s, pendingEvent: null };
    }
    expect(s.city).toBe("portharcourt");
    expect(s.location).toBe(findKind("portharcourt", "motor_park")!.id);
  });

  it("can't board a plane from the motor park or rent in another city", () => {
    const s = newGame(opts("abuja"));
    s.location = findKind("abuja", "motor_park")!.id;
    expect(dispatch(s, { type: "intercity", to: "lagos", mode: "flight" }).error).toMatch(/airport/);
    expect(dispatch(s, { type: "moveHouse", homeId: "yaba_selfcon" }).error).toMatch(/Lagos/);
  });

  it("uses city-specific workplaces", () => {
    const s = newGame(opts("portharcourt"));
    s.skills.fitness = 100;
    const r = dispatch(s, { type: "applyJob", careerId: "energy" });
    expect(r.error).toBeUndefined();
  });

  it("migrates v1 (Lagos-only) saves", () => {
    const s = newGame(opts("lagos")) as Partial<GameState> & Record<string, unknown>;
    const v1 = JSON.parse(JSON.stringify({ ...s, version: 1, city: undefined, travel: { from: "home", to: "beach", mode: "danfo", start: 0, end: 10 } }));
    const m = migrate(v1)!;
    expect(m.version).toBe(2);
    expect(m.city).toBe("lagos");
    expect(m.travel?.mode).toBe("bus");
  });
});
