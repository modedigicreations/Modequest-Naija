import type { BusinessDef } from "./data/economy";
import { addSkillXp, earn, forceCharge, log } from "./helpers";
import type { GameState, OwnedBusiness, SchoolState } from "./types";
import { clamp, dayOf, formatNaira, gaussian } from "./util";

// The school tycoon: the player runs admissions, fees, teachers and exams.
// A term is 4 real weeks; fees are per term, costs are weekly.

export const TERM_WEEKS = 4;
export const PUPILS_PER_TEACHER = 25;
/** Monthly salary for basic, good and excellent teachers (price index 1). */
export const TEACHER_PAY = [30000, 60000, 100000] as const;
export const TEACHER_LEVELS = ["Basic", "Good", "Excellent"] as const;
const RUNNING_PER_PUPIL_WEEK = 300; // books, chalk, diesel
const EXAM_COST_PER_PUPIL = 200;
export const SCHOLARSHIP_PLACES = 5;

export const schoolCapacity = (def: BusinessDef, level: number) => def.school!.capacity[Math.min(level, def.school!.capacity.length) - 1];
/** The usual fee for this kind of school in today's prices. */
export const marketFee = (s: GameState, def: BusinessDef) => Math.round((def.school!.fee * s.world.priceIndex) / 500) * 500;
export const teacherWeeklyPay = (s: GameState, level: 0 | 1 | 2) => Math.round((TEACHER_PAY[level] * 12 * s.world.priceIndex) / 52);
/** Share of fees parents pay on time: better schools get paid more reliably. */
export const payRate = (sc: SchoolState) => 0.72 + (sc.reputation / 100) * 0.2;

export function newSchool(s: GameState, def: BusinessDef): SchoolState {
  const pupils = Math.round(schoolCapacity(def, 1) * 0.3);
  return {
    term: 1,
    week: 1,
    fee: marketFee(s, def),
    pupils,
    teachers: Math.max(1, Math.ceil(pupils / PUPILS_PER_TEACHER)),
    teacherLevel: 0,
    reputation: 40,
    owed: 0,
    scholarships: false,
    examDone: false,
    lastPassRate: null,
    lastChaseDay: -1,
  };
}

/** How many pupils want a place next term, before teacher and building limits. */
export function demand(s: GameState, def: BusinessDef, b: OwnedBusiness): number {
  const sc = b.school!;
  const priceEffect = (sc.fee / marketFee(s, def) - 1) * 0.9;
  return Math.round(schoolCapacity(def, b.level) * clamp(0.25 + (sc.reputation / 100) * 0.8 - priceEffect, 0.05, 1));
}

/** One week of running the school. Returns the week's profit (can be negative). */
export function schoolWeek(s: GameState, b: OwnedBusiness, def: BusinessDef, neglected: boolean): number {
  const sc = b.school!;
  const paying = Math.max(0, sc.pupils - (sc.scholarships ? Math.min(SCHOLARSHIP_PLACES, sc.pupils) : 0));
  const due = (paying * sc.fee) / TERM_WEEKS;
  const paid = Math.round(due * payRate(sc));
  sc.owed += Math.round(due - paid);
  const salaries = sc.teachers * teacherWeeklyPay(s, sc.teacherLevel);
  const running = Math.round(sc.pupils * RUNNING_PER_PUPIL_WEEK * s.world.priceIndex);
  const profit = paid - salaries - running;
  if (profit >= 0) earn(s, profit, `${def.name}: fees − salaries − running costs`, "bank");
  else forceCharge(s, -profit, `${def.name}: weekly loss`);

  // Reputation drifts with teaching quality; an absent owner hurts it.
  sc.reputation = clamp(sc.reputation + (sc.teacherLevel - 1) * 0.6 + (neglected ? -3 : 0));
  sc.week += 1;
  if (sc.week > TERM_WEEKS) endTerm(s, b, def);
  return profit;
}

function endTerm(s: GameState, b: OwnedBusiness, def: BusinessDef) {
  const sc = b.school!;
  const notes: string[] = [];
  if (!sc.examDone) {
    sc.reputation = clamp(sc.reputation - 8);
    notes.push("no exams were held, parents complained (−8 reputation)");
  }
  if (sc.scholarships) sc.reputation = clamp(sc.reputation + 2);
  if (sc.owed > 0) {
    const lost = Math.round(sc.owed * 0.5);
    sc.owed -= lost;
    notes.push(`${formatNaira(lost)} of unpaid fees written off (families left)`);
  }
  // Admissions for the new term.
  const before = sc.pupils;
  const wanted = demand(s, def, b);
  const swing = Math.max(5, Math.round(before * 0.4));
  const target = clamp(wanted, Math.max(0, before - swing), before + swing);
  const room = Math.min(schoolCapacity(def, b.level), sc.teachers * PUPILS_PER_TEACHER);
  sc.pupils = Math.max(1, Math.min(target, room));
  if (target > room) notes.push(`${target - room} children turned away — ${room === sc.teachers * PUPILS_PER_TEACHER ? "hire more teachers" : "upgrade your building"}`);
  sc.term += 1;
  sc.week = 1;
  sc.examDone = false;
  log(s, "info", `🏫 ${def.name}: Term ${sc.term} begins with ${sc.pupils} pupils (was ${before}).${notes.length ? " " + notes.join("; ") + "." : ""}`);
}

export function setSchool(s: GameState, b: OwnedBusiness, def: BusinessDef, o: { fee?: number; teachers?: number; teacherLevel?: 0 | 1 | 2; scholarships?: boolean }): string | void {
  const sc = b.school!;
  if (o.fee !== undefined) {
    const fee = Math.round(o.fee / 500) * 500;
    if (fee < 1000 || fee > marketFee(s, def) * 3) return `Fees must be between ${formatNaira(1000)} and ${formatNaira(marketFee(s, def) * 3)}.`;
    sc.fee = fee;
  }
  if (o.teachers !== undefined) {
    const n = Math.floor(o.teachers);
    const max = Math.ceil(schoolCapacity(def, b.level) / 10);
    if (n < 1 || n > max) return `You can have 1–${max} teachers in this building.`;
    if (n * PUPILS_PER_TEACHER < sc.pupils) return `You have ${sc.pupils} pupils: you need at least ${Math.ceil(sc.pupils / PUPILS_PER_TEACHER)} teachers (max ${PUPILS_PER_TEACHER} per class).`;
    sc.teachers = n;
  }
  if (o.teacherLevel !== undefined) sc.teacherLevel = o.teacherLevel;
  if (o.scholarships !== undefined) sc.scholarships = o.scholarships;
}

export function chaseFees(s: GameState, b: OwnedBusiness, def: BusinessDef, method: "remind" | "send_home"): string | void {
  const sc = b.school!;
  if (sc.owed <= 0) return "No unpaid fees right now.";
  if (sc.lastChaseDay === dayOf(s.time)) return "You already chased fees today. Give parents time.";
  sc.lastChaseDay = dayOf(s.time);
  const share = method === "remind" ? 0.35 : 0.75;
  const got = Math.round(sc.owed * share);
  sc.owed -= got;
  earn(s, got, `${def.name}: fees collected`, "bank");
  if (method === "send_home") {
    sc.reputation = clamp(sc.reputation - 6);
    log(s, "bad", `🏫 You sent pupils home over fees and collected ${formatNaira(got)}. It worked — but children missed lessons and parents talk (−6 reputation). Payment plans and reminders keep goodwill.`);
  } else {
    log(s, "money", `🏫 Polite reminders and payment plans: parents paid ${formatNaira(got)}.`);
  }
}

export function holdExams(s: GameState, b: OwnedBusiness, def: BusinessDef): string | void {
  const sc = b.school!;
  if (sc.examDone) return "Exams already held this term.";
  if (sc.week < TERM_WEEKS - 1) return `Exams happen at the end of term (week ${TERM_WEEKS - 1} or ${TERM_WEEKS}). It's week ${sc.week}.`;
  const cost = Math.round(sc.pupils * EXAM_COST_PER_PUPIL * s.world.priceIndex);
  forceCharge(s, cost, `${def.name}: exam papers`);
  const perTeacher = sc.pupils / sc.teachers;
  const pass = Math.round(clamp(38 + sc.teacherLevel * 16 + (PUPILS_PER_TEACHER - perTeacher) * 0.8 + sc.reputation * 0.12 + gaussian(s) * 7, 5, 99));
  const change = Math.round((pass - 60) / 4);
  sc.reputation = clamp(sc.reputation + change);
  sc.examDone = true;
  sc.lastPassRate = pass;
  addSkillXp(s, "business", 10);
  log(s, pass >= 60 ? "good" : "bad", `📝 ${def.name} exam results: ${pass}% passed. Reputation ${change >= 0 ? "+" : ""}${change}. ${pass >= 75 ? "Parents are telling their friends!" : pass < 50 ? "Better teachers and smaller classes raise results." : ""}`);
}
