import { describe, expect, it } from "vitest";
import { advance, dispatch, migrate, newGame, rollPower, spawnMessage, travelOptions } from "./engine";
import { PUZZLES, getPuzzle, runProgram, type Step } from "./puzzles";
import type { GameState, NewGameOptions } from "./types";
import { MIN_PER_DAY, skillLevel } from "./util";

const OPTS: NewGameOptions = {
  city: "lagos",
  name: "Tester",
  pronoun: "they",
  appearance: { skin: 0, hair: 0, hairColor: 0, outfit: 0, accessory: 0 },
  background: "hustler",
  traits: ["hardworking", "thrifty"],
  dream: "smart_money",
  seed: 42,
};

const ok = (s: GameState, cmd: Parameters<typeof dispatch>[1]) => {
  const r = dispatch(s, cmd);
  expect(r.error).toBeUndefined();
  return r.state;
};

/** Advance, auto-dismissing random pop-up events so long sims don't stall. */
function sim(s: GameState, minutes: number): GameState {
  let left = minutes;
  while (left > 0) {
    if (s.pendingEvent) {
      const choice = s.pendingEvent.outcome ? "__dismiss" : "ok";
      s = dispatch(s, { type: "resolveEvent", choiceId: choice }).state;
      if (s.pendingEvent) s = dispatch(s, { type: "resolveEvent", choiceId: "__dismiss" }).state;
      continue;
    }
    const before = s.time;
    s = advance(s, left);
    left -= s.time - before;
  }
  return s;
}

describe("new game", () => {
  it("starts on Monday morning at home with background money", () => {
    const s = newGame(OPTS);
    expect(s.location).toBe("home");
    expect(s.homeId).toBe("mushin_room");
    expect(s.cash).toBe(12000);
    expect(skillLevel(s.skills.business)).toBe(2);
    expect(s.world.power).toHaveLength(24);
    expect(s.messages.length).toBeGreaterThan(0);
  });

  it("is deterministic for a given seed", () => {
    const a = sim(newGame(OPTS), 3 * MIN_PER_DAY);
    const b = sim(newGame(OPTS), 3 * MIN_PER_DAY);
    expect(a.needs).toEqual(b.needs);
    expect(a.world.power).toEqual(b.world.power);
  });
});

describe("needs and activities", () => {
  it("needs decay over time and sleep restores energy", () => {
    let s = newGame(OPTS);
    s = sim(s, 300);
    expect(s.needs.hunger).toBeLessThan(70);
    const energyBefore = s.needs.energy;
    s = ok(s, { type: "startActivity", activityId: "sleep" });
    s = sim(s, 480);
    expect(s.activity).toBeNull();
    expect(s.needs.energy).toBeGreaterThan(energyBefore);
  });

  it("refuses activities that need missing items", () => {
    const s = newGame(OPTS);
    const r = dispatch(s, { type: "startActivity", activityId: "laptop_study" });
    expect(r.error).toMatch(/Laptop/);
  });
});

describe("travel", () => {
  it("charges fare and arrives after the trip", () => {
    let s = newGame(OPTS);
    const opt = travelOptions(s, "amala_spot").find((o) => o.mode === "bus")!;
    expect(opt.ok).toBe(true);
    const cash = s.cash;
    s = ok(s, { type: "travel", to: "amala_spot", mode: "bus" });
    expect(s.cash).toBe(cash - opt.fare);
    s = sim(s, opt.minutes + 1);
    expect(s.location).toBe("amala_spot");
  });

  it("does not let keke cross the lagoon", () => {
    const s = newGame(OPTS);
    expect(travelOptions(s, "beach").find((o) => o.mode === "keke")!.ok).toBe(false);
  });
});

describe("work", () => {
  it("pays a shift into the bank and counts it", () => {
    let s = newGame(OPTS);
    s = ok(s, { type: "applyJob", careerId: "trade" }); // Balogun, 8am Mon–Sat
    s = { ...s, location: "balogun", time: s.time + 60 }; // 8:00
    s = ok(s, { type: "startShift", workStyle: "steady", taskBonus: true });
    const bank = s.bank;
    s = sim(s, 8 * 60 + 1);
    expect(s.stats.shiftsWorked).toBe(1);
    expect(s.bank).toBeGreaterThan(bank);
  });

  it("fires after three missed shifts", () => {
    let s = newGame(OPTS);
    s = ok(s, { type: "applyJob", careerId: "trade" });
    s = sim(s, 4 * MIN_PER_DAY);
    expect(s.career).toBeNull();
  });
});

describe("money", () => {
  it("charges rent on Saturday once prepaid weeks run out, then evicts", () => {
    let s = newGame({ ...OPTS, seed: 7 });
    s.cash = 0;
    s.bank = 0;
    s.flags.rentPaidThroughWeek = 0;
    s = sim(s, 6 * MIN_PER_DAY); // past Saturday 8am of week 1
    expect(s.missedRent).toBe(1);
    s = sim(s, 7 * MIN_PER_DAY);
    expect(s.homeId).toBe("uncle_couch");
  });

  it("pays savings interest and applies inflation weekly", () => {
    let s = newGame(OPTS);
    s.bank = 100000;
    s.time = 7 * MIN_PER_DAY - 10; // Sunday 11:50pm
    s = sim(s, 20);
    expect(s.world.priceIndex).toBeGreaterThan(1);
    expect(s.transactions.some((t) => t.label === "Savings interest")).toBe(true);
  });

  it("runs the Ponzi lifecycle: bait payout then collapse", () => {
    let s = newGame(OPTS);
    s.bank = 200000;
    s.flags.rentPaidThroughWeek = 99;
    spawnMessage(s, "ponzi");
    const msg = s.messages.find((m) => m.templateId === "ponzi")!;
    s = ok(s, { type: "replyMessage", messageId: msg.id, choiceId: "invest_big" });
    expect(s.ponzi?.invested).toBe(100000);
    s = sim(s, 7 * MIN_PER_DAY);
    expect(s.ponzi?.paidOut).toBe(true);
    s = sim(s, 7 * MIN_PER_DAY);
    expect(s.ponzi).toBeNull();
    expect(s.stats.scamsFallen).toBeGreaterThanOrEqual(1);
  });

  it("phishing the bank drains it; verifying avoids it", () => {
    const base = newGame(OPTS);
    base.bank = 100000;
    spawnMessage(base, "bvn_phish");
    const id = base.messages.find((m) => m.templateId === "bvn_phish")!.id;
    const bad = ok(base, { type: "replyMessage", messageId: id, choiceId: "send" });
    expect(bad.bank).toBe(20000);
    const good = ok(base, { type: "replyMessage", messageId: id, choiceId: "call" });
    expect(good.bank).toBe(100000);
    expect(good.stats.scamsAvoided).toBe(1);
  });

  it("academy grant is paid once", () => {
    let s = newGame(OPTS);
    const bank = s.bank;
    s = ok(s, { type: "completeLesson", lessonId: "budget", score: 100 });
    s = ok(s, { type: "completeLesson", lessonId: "budget", score: 100 });
    expect(s.bank).toBe(bank + 3000);
  });
});

describe("NEPA", () => {
  it("band A homes get more light than band D", () => {
    const s = newGame(OPTS);
    let a = 0;
    let d = 0;
    for (let i = 0; i < 30; i++) {
      a += rollPower(s, "A").filter(Boolean).length;
      d += rollPower(s, "D").filter(Boolean).length;
    }
    expect(a / 30).toBeGreaterThan(17);
    expect(d / 30).toBeLessThan(11);
  });
});

describe("Code Lab puzzles are solvable", () => {
  const solutions: Record<string, Step[]> = {
    p1: [{ cmd: "F", times: 4 }],
    p2: [{ cmd: "F", times: 2 }, { cmd: "R", times: 1 }, { cmd: "F", times: 2 }, { cmd: "L", times: 1 }, { cmd: "F", times: 1 }],
    p3: [{ cmd: "F", times: 5 }],
    p4: [{ cmd: "F", times: 3 }, { cmd: "R", times: 1 }, { cmd: "F", times: 2 }, { cmd: "R", times: 1 }, { cmd: "F", times: 3 }],
    p5: [
      { cmd: "F", times: 2 }, { cmd: "L", times: 1 }, { cmd: "F", times: 3 }, { cmd: "L", times: 1 }, { cmd: "F", times: 2 },
      { cmd: "R", times: 1 }, { cmd: "F", times: 3 }, { cmd: "R", times: 1 }, { cmd: "F", times: 2 }, { cmd: "R", times: 1 },
      { cmd: "F", times: 1 }, { cmd: "L", times: 1 }, { cmd: "F", times: 2 }, { cmd: "R", times: 1 }, { cmd: "F", times: 5 },
    ],
    p6: [{ cmd: "F", times: 4 }, { cmd: "R", times: 1 }, { cmd: "F", times: 2 }, { cmd: "R", times: 1 }, { cmd: "F", times: 4 }, { cmd: "L", times: 1 }, { cmd: "F", times: 2 }, { cmd: "L", times: 1 }, { cmd: "F", times: 4 }],
    p7: [{ cmd: "F", times: 2 }, { cmd: "R", times: 1 }, { cmd: "F", times: 4 }, { cmd: "L", times: 1 }, { cmd: "F", times: 2 }, { cmd: "L", times: 1 }, { cmd: "F", times: 4 }],
    p8: [{ cmd: "F", times: 5 }, { cmd: "F", times: 1 }, { cmd: "R", times: 1 }, { cmd: "F", times: 2 }, { cmd: "R", times: 1 }, { cmd: "F", times: 5 }, { cmd: "F", times: 1 }],
  };
  for (const [id, prog] of Object.entries(solutions)) {
    it(id, () => expect(runProgram(getPuzzle(id), prog).outcome).toBe("win"));
  }
  it("covers every puzzle", () => {
    expect(Object.keys(solutions).sort()).toEqual(PUZZLES.map((p) => p.id).sort());
  });
  it("detects crashes", () => {
    expect(runProgram(getPuzzle("p2"), [{ cmd: "F", times: 3 }]).outcome).toBe("crash");
  });
});

describe("saves", () => {
  it("round-trips through JSON and migrate()", () => {
    const s = sim(newGame(OPTS), 500);
    const back = migrate(JSON.parse(JSON.stringify(s)));
    expect(back).toEqual(s);
    expect(migrate({ nope: true })).toBeNull();
  });
});

describe("scam replies", () => {
  it("every scam template has at least one safe reply", async () => {
    const { MESSAGE_TEMPLATES } = await import("./data/events");
    for (const t of MESSAGE_TEMPLATES.filter((m) => m.kind === "scam")) {
      const base = newGame(OPTS);
      base.bank = 100000;
      base.cash = 50000;
      base.relationships.tunde = { friendship: 60, met: true, lastTalkDay: 1, adviceDay: -1, owes: 0 };
      spawnMessage(base, t.id);
      const msg = base.messages.find((m) => m.templateId === t.id);
      if (!msg) continue;
      const outcomes = msg.choices!.map((c) => dispatch(base, { type: "replyMessage", messageId: msg.id, choiceId: c.id }).state.stats.scamsAvoided);
      expect(outcomes.some((n) => n > 0), t.id).toBe(true);
    }
  });
});
