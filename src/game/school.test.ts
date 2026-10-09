import { describe, expect, it } from "vitest";
import { getBusiness } from "./data/economy";
import { advance, dispatch, migrate, newGame } from "./engine";
import { marketFee } from "./school";
import type { GameState } from "./types";
import { dayOf } from "./util";

const start = (schoolId: string) => {
  let s = newGame({ city: "enugu", name: "Owner", pronoun: "they", appearance: { skin: 0, hair: 0, hairColor: 0, outfit: 0, accessory: 0 }, background: "ajebutter", traits: ["hardworking", "thrifty"], dream: "smart_money", seed: 11 });
  s.skills.business = 2000;
  s.bank = 20_000_000;
  const r = dispatch(s, { type: "buyBusiness", businessId: schoolId });
  expect(r.error).toBeUndefined();
  s = r.state;
  return s;
};
const school = (s: GameState, id: string) => s.businesses.find((b) => b.id === id)!.school!;

/** Play `weeks` weeks; a good owner visits, holds exams and chases fees politely. */
function run(s: GameState, id: string, weeks: number, goodOwner: boolean) {
  for (let w = 0; w < weeks; w++) {
    s = advance(s, 7 * 1440, "away");
    const b = s.businesses.find((x) => x.id === id)!;
    if (goodOwner) {
      b.lastManagedDay = dayOf(s.time);
      if (b.school!.week >= 3 && !b.school!.examDone) s = dispatch(s, { type: "schoolExam", businessId: id }).state;
      s = dispatch(s, { type: "schoolChase", businessId: id, method: "remind" }).state;
    }
  }
  return s;
}

describe("school tycoon", () => {
  it("opens with pupils, a teacher and the local fee", () => {
    const s = start("nursery_school");
    const sc = school(s, "nursery_school");
    expect(sc.pupils).toBeGreaterThan(0);
    expect(sc.teachers).toBeGreaterThanOrEqual(1);
    expect(sc.fee).toBe(marketFee(s, getBusiness("nursery_school")!));
    expect(sc.term).toBe(1);
  });

  it("a good owner grows the school; a careless one shrinks it", () => {
    let good = start("nursery_school");
    good = dispatch(good, { type: "schoolSet", businessId: "nursery_school", teacherLevel: 1, teachers: 2 }).state;
    good = run(good, "nursery_school", 12, true);
    let bad = start("nursery_school");
    bad = dispatch(bad, { type: "schoolSet", businessId: "nursery_school", fee: marketFee(bad, getBusiness("nursery_school")!) * 2.5 }).state;
    bad = run(bad, "nursery_school", 12, false);
    const g = school(good, "nursery_school");
    const b = school(bad, "nursery_school");
    expect(g.term).toBe(4);
    expect(g.pupils).toBeGreaterThan(b.pupils);
    expect(g.reputation).toBeGreaterThan(b.reputation);
    expect(g.lastPassRate).not.toBeNull();
  });

  it("a well-run private school earns a sensible return", () => {
    let s = start("private_school");
    s = dispatch(s, { type: "schoolSet", businessId: "private_school", teacherLevel: 1, teachers: 5 }).state;
    s = run(s, "private_school", 24, true);
    const weekly = s.businesses.find((b) => b.id === "private_school")!.weeklyHistory.slice(-4);
    const avg = weekly.reduce((a, x) => a + x, 0) / weekly.length;
    const price = getBusiness("private_school")!.price * s.world.priceIndex;
    expect(avg / price).toBeGreaterThan(0.03);
    expect(avg / price).toBeLessThan(0.14);
  });

  it("sending pupils home collects more but costs reputation", () => {
    let s = start("nursery_school");
    s = run(s, "nursery_school", 2, false);
    const owed = school(s, "nursery_school").owed;
    expect(owed).toBeGreaterThan(0);
    const rep = school(s, "nursery_school").reputation;
    const home = dispatch(s, { type: "schoolChase", businessId: "nursery_school", method: "send_home" }).state;
    const remind = dispatch(s, { type: "schoolChase", businessId: "nursery_school", method: "remind" }).state;
    expect(home.bank - s.bank).toBeGreaterThan(remind.bank - s.bank);
    expect(school(home, "nursery_school").reputation).toBeLessThan(rep);
    expect(school(remind, "nursery_school").reputation).toBe(rep);
    expect(dispatch(remind, { type: "schoolChase", businessId: "nursery_school", method: "remind" }).error).toMatch(/already/);
  });

  it("enforces class sizes, fee limits and exam timing", () => {
    let s = start("private_school");
    const sc = school(s, "private_school");
    expect(dispatch(s, { type: "schoolSet", businessId: "private_school", teachers: 0 }).error).toBeDefined();
    s = dispatch(s, { type: "schoolSet", businessId: "private_school", teachers: Math.ceil(sc.pupils / 25) }).state;
    expect(dispatch(s, { type: "schoolSet", businessId: "private_school", teachers: Math.ceil(sc.pupils / 25) - 1 }).error).toMatch(/at least|1–/);
    expect(dispatch(s, { type: "schoolSet", businessId: "private_school", fee: 10_000_000 }).error).toMatch(/between/);
    expect(dispatch(s, { type: "schoolExam", businessId: "private_school" }).error).toMatch(/end of term/);
    expect(dispatch(s, { type: "schoolExam", businessId: "pos" }).error).toMatch(/don't run/);
  });
});

describe("older saves", () => {
  it("open a school office straight away for schools bought before", () => {
    const s = start("private_school");
    const old = JSON.parse(JSON.stringify(s));
    delete old.businesses[0].school;
    const m = migrate(old)!;
    expect(m.businesses[0].school?.pupils).toBeGreaterThan(0);
  });
});
