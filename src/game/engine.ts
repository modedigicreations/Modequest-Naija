import { ACTIVITIES, type ActivityDef, getActivity, localActivity } from "./data/activities";
import {
  BACKGROUNDS,
  BUSINESS_MAX_LEVEL,
  CERTIFICATES,
  DIVEST_FEE,
  GENERATOR_COST_PER_HOUR,
  INFLATION_WEEKLY,
  PENSION_WEEKLY_GROWTH,
  SAVINGS_WEEKLY_RATE,
  WORK_STYLES,
  getBackground,
  getBusiness,
  getCareer,
  getInvestment,
  getItem,
  getLoanDef,
  payslip,
} from "./data/economy";
import { EVENTS, MESSAGE_CHANCE_PER_HOUR, MESSAGE_TEMPLATES } from "./data/events";
import { DELIVERY_FEE, DELIVERY_HOURS, DELIVERY_PRICE_LEVEL, getFood } from "./data/food";
import { getLesson } from "./data/lessons";
import { INTERACTIONS, type InteractionId, getNpc, npcsAt } from "./data/people";
import {
  CITIES,
  HOMES,
  type HomeDef,
  type LocationDef,
  type PlaceKind,
  POWER_BANDS,
  TRANSPORT,
  WEATHER_INFO,
  cityHome,
  findKind,
  getCity,
  getHome,
  getLocation,
  intercityRoute,
  transportIn,
} from "./data/world";
import { ACHIEVEMENTS, dreamProgress } from "./goals";
import { chaseFees, holdExams, newSchool, schoolWeek, setSchool } from "./school";
import {
  addFriendship,
  addNeeds,
  addSkillXp,
  bankFrozen,
  charge,
  earn,
  ensureRelationship,
  forceCharge,
  canCook,
  hasFood,
  pantryCapacity,
  pantryCount,
  hasItem,
  hasTrait,
  home,
  homePower,
  level,
  log,
  mood,
  price,
  pushMessage,
  skillMultiplier,
  wageMultiplier,
  SKILL_NAMES,
} from "./helpers";
import type {
  ActivityRun,
  Command,
  DispatchResult,
  GameState,
  Needs,
  NewGameOptions,
  Skills,
  TransportMode,
  Weather,
  WorkStyle,
} from "./types";
import { NEED_KEYS, SKILL_KEYS } from "./types";
import {
  MIN_PER_DAY,
  actionMinutes,
  alignedGameTime,
  realMinute,
  chance,
  clamp,
  dayOf,
  formatNaira,
  gaussian,
  hourOf,
  minuteOfDay,
  nextRandom,
  randInt,
  weekOf,
  weekdayOf,
} from "./util";

export const SAVE_VERSION = 3;
export const START_MINUTE = 7 * 60; // Day 1, Monday, 7:00am

// Base need decay per hour. Shifts and sleep are quick now (8 minutes), so the
// character is "awake" for nearly the whole real day: needs drain at 40% of the
// old fast-clock rate, so a real day costs about the same food and sleep as before.
const REAL_TIME_DECAY = 0.4;
const DECAY: Needs = { hunger: 4 * REAL_TIME_DECAY, energy: 3.5 * REAL_TIME_DECAY, hygiene: 2.5 * REAL_TIME_DECAY, fun: 2.2 * REAL_TIME_DECAY, social: 1.6 * REAL_TIME_DECAY };
// Health damage per game hour while a need is under 10. Starving and
// exhaustion are dangerous; boredom and loneliness mostly hurt mood.
const HEALTH_HIT: Needs = { hunger: 2, energy: 2, hygiene: 0.6, fun: 0.5, social: 0.5 };

const STUDY_IDS = new Set(["laptop_study", "cowork", "study_code", "study_money", "read_books", "lecture", "seminar", "meetup"]);

// ---------------------------------------------------------------------------
// New game
// ---------------------------------------------------------------------------

export function newGame(o: NewGameOptions): GameState {
  const bg = getBackground(o.background) ?? BACKGROUNDS[0];
  const seed = o.seed ?? Math.floor(Math.random() * 2 ** 31);
  const skills = Object.fromEntries(SKILL_KEYS.map((k) => [k, bg.skills[k] ?? 0])) as Skills;

  const s: GameState = {
    version: SAVE_VERSION,
    saveId: `mq-${seed.toString(36)}-${Date.now().toString(36)}`,
    createdAt: Date.now(),
    updatedAt: Date.now(),
    rng: seed,
    time: START_MINUTE,
    speed: 1,
    player: {
      name: o.name.trim().slice(0, 18) || "Ade",
      pronoun: o.pronoun,
      appearance: o.appearance,
      background: bg.id,
      traits: o.traits.slice(0, 2),
      dream: o.dream,
    },
    needs: { hunger: 70, energy: 85, hygiene: 75, fun: 65, social: 60 },
    health: 90,
    skills,
    cash: bg.cash,
    bank: bg.bank,
    city: getCity(o.city).id,
    location: "home",
    travel: null,
    activity: null,
    homeId: cityHome(getCity(o.city).id, bg.homeTier).id,
    missedRent: 0,
    items: [...bg.items],
    pantry: { bread: 2, rice: 1, tomato_pepper: 1 },
    career: null,
    certificates: [],
    courseProgress: {},
    businesses: [],
    investments: {},
    ponzi: null,
    loans: [],
    relationships: {},
    messages: [],
    pendingEvent: null,
    log: [],
    logSeq: 0,
    transactions: [],
    lessons: {},
    achievements: [],
    stats: { scamsAvoided: 0, scamsFallen: 0, totalEarned: 0, shiftsWorked: 0, friendsMade: 0, hospitalVisits: 0, evictions: 0 },
    world: {
      weatherDay: 0,
      weather: "sunny",
      powerDay: 0,
      power: [],
      priceIndex: 1,
      fuelScarcityUntilDay: 0,
      lastWeekSettled: 0,
      lastRentWeek: 0,
    },
    flags: { rentPaidThroughWeek: bg.prepaidWeeks, student: bg.student ? 1 : 0 },
  };

  if (o.now !== undefined) {
    // Start on today's real weekday and time, in week 1.
    s.time = alignedGameTime(o.now);
    s.flags.clockOffset = s.time - realMinute(o.now);
    s.flags.realClock = 1;
  }
  s.flags.startDay = dayOf(s.time);

  if (bg.loan) {
    const def = getLoanDef(bg.loan)!;
    s.loans.push({ id: def.id, principal: def.principal, remaining: def.weekly * def.weeks, weekly: def.weekly, missed: 0, lender: def.lender });
  }

  rollDay(s);

  pushMessage(s, {
    from: "academy",
    fromName: "Mode Academy",
    templateId: "welcome",
    kind: "system",
    text: `Welcome to ${getCity(s.city).name}, ${s.player.name}! 🌆 Open the Academy app for lessons that pay grants. Pro tip: never share your OTP or PIN with anyone.`,
  });
  pushMessage(s, {
    from: "mum",
    fromName: "Mummy ❤️",
    templateId: "mum",
    kind: "friend",
    text: `My child, you have reached ${getCity(s.city).name} safely? Eat well, find a good job, and don't follow bad friends. Call me when you can.`,
  });
  log(s, "info", `Day 1 in ${getCity(s.city).name}. Rent is due every Saturday. Prepaid until week ${bg.prepaidWeeks}.`);
  return s;
}

// ---------------------------------------------------------------------------
// Real clock
// ---------------------------------------------------------------------------

/** Days lived in this life (Day 1 = the day you started). */
export const lifeDay = (s: GameState) => dayOf(s.time) - (s.flags.startDay ?? 1) + 1;

/** Game time that matches the real clock right now. */
export const realGameTime = (s: GameState, nowMs: number) => realMinute(nowMs) + (s.flags.clockOffset ?? 0);

/** Move an older (fast-clock) save onto real Nigerian time. Never goes backwards. */
export function syncToRealClock(state: GameState, nowMs: number): GameState {
  const s = clone(state);
  s.flags.startDay ??= 1;
  s.time = alignedGameTime(nowMs, state.time);
  s.flags.clockOffset = s.time - realMinute(nowMs);
  s.flags.realClock = 1;
  rollDay(s);
  log(s, "info", "🕐 Game time now follows real Nigerian time. Actions are quick: an 8-hour shift takes 8 minutes.");
  return s;
}

// ---------------------------------------------------------------------------
// World rolls: weather and NEPA schedule for the day
// ---------------------------------------------------------------------------

function rollWeather(s: GameState): Weather {
  const w = getCity(s.city).weather;
  const total = w.sunny + w.cloudy + w.rain + w.storm;
  let r = nextRandom(s) * total;
  for (const k of ["sunny", "cloudy", "rain", "storm"] as Weather[]) {
    r -= w[k];
    if (r <= 0) return k;
  }
  return "sunny";
}

export function rollPower(s: GameState, band: HomeDef["band"]): boolean[] {
  const { min, max } = POWER_BANDS[band];
  const target = randInt(s, min, max);
  let best: boolean[] = [];
  let bestDiff = Infinity;
  for (let attempt = 0; attempt < 20; attempt++) {
    const slots: boolean[] = [];
    let on = chance(s, target / 24);
    while (slots.length < 24) {
      const len = on ? randInt(s, 2, 8) : randInt(s, 1, Math.max(2, Math.round((24 - target) / 2)));
      for (let i = 0; i < len && slots.length < 24; i++) slots.push(on);
      on = !on;
    }
    const diff = Math.abs(slots.filter(Boolean).length - target);
    if (diff < bestDiff) {
      best = slots;
      bestDiff = diff;
    }
    if (diff <= 1) break;
  }
  return best;
}

function rollDay(s: GameState) {
  const d = dayOf(s.time);
  if (s.world.weatherDay !== d) {
    s.world.weather = rollWeather(s);
    s.world.weatherDay = d;
  }
  s.world.power = rollPower(s, home(s).band);
  s.world.powerDay = d;
}

// ---------------------------------------------------------------------------
// Location & time queries
// ---------------------------------------------------------------------------

export function placeOf(id: string, s: GameState): { name: string; x: number; y: number; zone: string; emoji: string; city: string } {
  if (id === "home") {
    const h = getHome(s.homeId);
    return { name: `Home · ${h.area}`, x: h.x, y: h.y, zone: h.zone, emoji: "🏠", city: h.city };
  }
  const l = getLocation(id)!;
  return { name: l.name, x: l.x, y: l.y, zone: l.zone, emoji: l.emoji, city: l.city };
}

/** City the player's home is in. */
export const homeCity = (s: GameState) => getHome(s.homeId).city;
export const atHomeCity = (s: GameState) => homeCity(s) === s.city;

/** Kinds of the place the player is standing in ("home" for home). */
export function kindsHere(s: GameState): (PlaceKind | "home")[] {
  if (s.location === "home") return ["home"];
  return getLocation(s.location)?.kinds ?? [];
}

export function isOpen(loc: LocationDef, t: number): boolean {
  if (loc.days && !loc.days.includes(weekdayOf(t))) return false;
  const h = hourOf(t);
  if (loc.open === loc.close) return true;
  if (loc.close > loc.open) return h >= loc.open && h < loc.close;
  return h >= loc.open || h < loc.close;
}

export function locationOpen(s: GameState, id: string): boolean {
  if (id === "home") return true;
  const l = getLocation(id);
  return l ? isOpen(l, s.time) : false;
}

export const isRushHour = (t: number) => {
  const h = hourOf(t);
  return weekdayOf(t) < 5 && ((h >= 7 && h < 10) || (h >= 16 && h < 20));
};

export const isBusy = (s: GameState) => !!s.activity || !!s.travel;

// ---------------------------------------------------------------------------
// Travel
// ---------------------------------------------------------------------------

/** Minutes added (and a local fare) to reach the terminal when booking from elsewhere. */
const TERMINAL_TRANSFER_MINUTES = 45;
const TERMINAL_TRANSFER_FARE = 1000;

/** Price and duration of a trip to another city, from wherever the player is. */
export function intercityQuote(s: GameState, to: string, mode: "coach" | "flight") {
  if (to === s.city) return null;
  const kind = mode === "coach" ? "motor_park" : "airport";
  const arrival = findKind(to, kind);
  if (!arrival) return null;
  const atTerminal = kindsHere(s).includes(kind);
  const route = intercityRoute(s.city, to, mode);
  if (!route) return null;
  return {
    arrival: arrival.id,
    minutes: actionMinutes(route.minutes + (atTerminal ? 0 : TERMINAL_TRANSFER_MINUTES)),
    fare: price(s, route.fare + (atTerminal ? 0 : TERMINAL_TRANSFER_FARE), false),
    atTerminal,
  };
}

export interface TravelOption {
  mode: TransportMode;
  name: string;
  emoji: string;
  minutes: number;
  fare: number;
  ok: boolean;
  reason?: string;
  blurb: string;
}

export function travelOptions(s: GameState, to: string): TravelOption[] {
  const a = placeOf(s.location, s);
  const b = placeOf(to, s);
  const dist = Math.hypot(a.x - b.x, a.y - b.y);
  const cross = a.zone !== b.zone;
  const crossMinutes = getCity(s.city).zoneCrossMinutes;
  const rush = isRushHour(s.time);
  const weather = WEATHER_INFO[s.world.weather].travel;
  const scarcity = dayOf(s.time) <= s.world.fuelScarcityUntilDay ? 1.5 : 1;

  return TRANSPORT.filter((base) => transportIn(s.city, base.id).available).map((base) => {
    const t = transportIn(s.city, base.id);
    let ok = true;
    let reason: string | undefined;
    if (t.requiresItem && !hasItem(s, t.requiresItem)) {
      ok = false;
      reason = "You don't own a car";
    } else if (t.maxDistance && dist > t.maxDistance) {
      ok = false;
      reason = "Too far";
    } else if (t.id === "keke" && cross) {
      ok = false;
      reason = "Keke can't cross the bridges";
    } else if (b.city !== s.city) {
      ok = false;
      reason = "That's in another city";
    }
    const trafficMult = t.traffic && rush ? getCity(s.city).rushFactor : 1;
    const minutes = Math.round((t.wait + dist * t.minPerPx * trafficMult + (cross ? crossMinutes * (t.id === "walk" ? 2 : 1) : 0)) * weather);
    let fare = (t.baseFare + t.farePerPx * dist) * s.world.priceIndex * scarcity;
    if (t.id === "ride" && rush) fare *= 1.5;
    fare = Math.round(fare / 50) * 50;
    if (ok && fare > s.cash + Math.max(0, bankFrozen(s) ? 0 : s.bank)) {
      ok = false;
      reason = "Can't afford";
    }
    return { mode: t.id, name: t.name, emoji: t.emoji, minutes: actionMinutes(Math.max(5, minutes)), fare, ok, reason, blurb: t.blurb };
  });
}

function arrive(s: GameState) {
  const tr = s.travel!;
  const t = transportIn(s.city, tr.mode);
  // Long treks cost more energy and hygiene than short hops.
  const a = placeOf(tr.from, s);
  const b = placeOf(tr.to, s);
  const scale = tr.mode === "walk" ? Math.max(1, Math.hypot(a.x - b.x, a.y - b.y) / 120) : 1;
  addNeeds(s, t.needs, scale);
  if (t.fitnessXp) addSkillXp(s, "fitness", t.fitnessXp * scale);
  s.location = tr.to;
  s.travel = null;
  if (tr.toCity && tr.toCity !== s.city) {
    s.city = tr.toCity;
    s.world.weather = rollWeather(s);
    log(s, "good", `🧳 Welcome to ${getCity(s.city).name}, the ${getCity(s.city).nickname}!`);
  }
  const name = placeOf(tr.to, s).name;
  if (tr.to !== "home" && !locationOpen(s, tr.to)) log(s, "info", `Arrived at ${name}, but it's closed right now.`);
  else log(s, "info", `Arrived at ${name}.`);
  // Meeting NPCs for the first time.
  for (const n of npcsAt(tr.to, weekdayOf(s.time), hourOf(s.time))) {
    const r = ensureRelationship(s, n.id);
    if (!r.met) {
      r.met = true;
      log(s, "info", `${n.emoji} ${n.name} (${n.role}) is here: "${n.greeting}"`);
    }
  }
}

// ---------------------------------------------------------------------------
// Activities (including synthetic ones: shifts, talking, managing a business)
// ---------------------------------------------------------------------------

interface RunEffects {
  name: string;
  emoji: string;
  needs: Partial<Needs>;
  skills: Partial<Skills>;
  health: number;
  sleep: boolean;
  bath: boolean;
  /** Shifts include their own total drain, so base decay pauses. */
  noBaseDecay: boolean;
  study: boolean;
}

export function runEffects(s: GameState, run: ActivityRun): RunEffects {
  const [kind, a, b] = run.activityId.split(":");
  if (kind === "shift") {
    const career = getCareer(a)!;
    const style = WORK_STYLES[run.workStyle ?? "steady"];
    return { name: `Shift: ${career.levels[s.career?.level ?? 0].title}`, emoji: style.emoji, needs: style.needs, skills: { [career.skill]: career.hours * 1.5 }, health: 0, sleep: false, bath: false, noBaseDecay: true, study: false };
  }
  if (kind === "talk") {
    const npc = getNpc(a)!;
    const it = INTERACTIONS[b as InteractionId];
    const needs: Partial<Needs> =
      b === "hangout" ? { social: 30, fun: 25 } : b === "joke" ? { social: 6, fun: 6 } : { social: 12, fun: 3 };
    return { name: `${it.label} with ${npc.name}`, emoji: it.emoji, needs, skills: { charisma: b === "hangout" ? 10 : 4 }, health: 0, sleep: false, bath: false, noBaseDecay: false, study: false };
  }
  if (kind === "manage") {
    const biz = getBusiness(a)!;
    return { name: `Manage ${biz.name}`, emoji: biz.emoji, needs: { energy: -10, fun: -4 }, skills: { business: 12, [biz.skill]: 6 }, health: 0, sleep: false, bath: false, noBaseDecay: false, study: false };
  }
  const def = getActivity(run.activityId)!;
  const local = localActivity(def, s.city);
  return {
    name: local.name,
    emoji: local.emoji,
    needs: def.needs ?? {},
    skills: def.skills ?? {},
    health: def.health ?? 0,
    sleep: !!def.sleep,
    bath: !!def.bath,
    noBaseDecay: false,
    study: !!def.course || STUDY_IDS.has(def.id),
  };
}

export interface ActivityView {
  def: ActivityDef;
  cost: number;
  ok: boolean;
  reason?: string;
  progress?: string;
}

export function activityView(s: GameState, def: ActivityDef): ActivityView {
  const cost = def.cost ? courseCost(s, def) : 0;
  const v: ActivityView = { def, cost, ok: true };
  const fail = (reason: string) => ({ ...v, ok: false, reason });
  const r = def.requires ?? {};
  if (def.course) {
    const done = s.courseProgress[def.course.id] ?? 0;
    v.progress = `${Math.min(done, def.course.sessions)}/${def.course.sessions} classes`;
    if (s.certificates.includes(def.course.cert)) return { ...v, ok: false, reason: "Certificate earned ✅" };
  }
  if (isBusy(s)) return fail("You're busy");
  if (s.location !== "home" && !locationOpen(s, s.location)) return fail("Closed now");
  if (r.weekdays && !r.weekdays.includes(weekdayOf(s.time))) return fail("Not today");
  if (r.hours && (hourOf(s.time) < r.hours[0] || hourOf(s.time) >= r.hours[1])) return fail(`Only ${r.hours[0]}:00–${r.hours[1]}:00`);
  if (r.item && !hasItem(s, r.item)) return fail(`Needs ${getItem(r.item)?.name}`);
  if (r.kitchen && !canCook(s)) return fail("No kitchen — get a stove or gas cooker");
  if (r.food) {
    const missing = r.food.filter((id) => !hasFood(s, id));
    if (missing.length) return fail(`Needs ${missing.map((id) => getFood(id)?.name ?? id).join(" + ")}`);
  }
  if (r.skill && level(s, r.skill[0]) < r.skill[1]) return fail(`Needs ${SKILL_NAMES[r.skill[0]]} ${r.skill[1]}`);
  if (r.minCash && s.cash < r.minCash) return fail(`Needs ${formatNaira(r.minCash)} cash`);
  if (r.power && s.location === "home" && homePower(s) === "none") return fail("NEPA took light 🕯️");
  if (cost > s.cash + (bankFrozen(s) ? 0 : Math.max(0, s.bank))) return fail("Can't afford");
  return v;
}

function courseCost(s: GameState, def: ActivityDef): number {
  let c = price(s, def.cost ?? 0);
  if (def.course && s.flags.student) c = Math.round((c * 0.7) / 50) * 50;
  return c;
}

export function activitiesHere(s: GameState): ActivityView[] {
  const kinds = kindsHere(s);
  return ACTIVITIES.filter((a) => a.at.some((k) => kinds.includes(k))).map((a) => activityView(s, a));
}

function startRun(s: GameState, run: Omit<ActivityRun, "applied">) {
  s.activity = { ...run, applied: 0 };
}

function completeActivity(s: GameState, cancelled: boolean) {
  const run = s.activity!;
  const fraction = run.applied;
  s.activity = null;
  const [kind, a, b] = run.activityId.split(":");

  if (kind === "shift") return finishShift(s, run, cancelled, fraction);

  if (kind === "talk") {
    if (cancelled) return;
    const npc = getNpc(a)!;
    const rel = ensureRelationship(s, a);
    rel.met = true;
    rel.lastTalkDay = dayOf(s.time);
    const moodBonus = mood(s) >= 60 ? 1.2 : mood(s) < 30 ? 0.7 : 1;
    switch (b as InteractionId) {
      case "gist":
        addFriendship(s, a, 5 * moodBonus);
        log(s, "good", `You gisted with ${npc.name}. (+friendship)`);
        break;
      case "joke":
        if (chance(s, 0.35 + level(s, "charisma") * 0.06)) {
          addFriendship(s, a, 8 * moodBonus);
          addNeeds(s, { fun: 8 });
          log(s, "good", `${npc.name} laughed so hard! 😂`);
        } else {
          addFriendship(s, a, -3);
          log(s, "bad", `Awkward silence... ${npc.name} didn't get the joke.`);
        }
        break;
      case "advice": {
        const tips = npc.advice;
        const tip = tips[(dayOf(s.time) + a.length) % Math.max(1, tips.length)];
        rel.adviceDay = dayOf(s.time);
        addFriendship(s, a, 2);
        addSkillXp(s, "finance", 6);
        if (tip) log(s, "learn", `${npc.emoji} ${npc.name}: "${tip}"`);
        break;
      }
      case "hangout":
        addFriendship(s, a, 10 * moodBonus);
        log(s, "good", `Great time with ${npc.name}! 🎉`);
        break;
      case "gift":
        addFriendship(s, a, 10);
        log(s, "good", `${npc.name} loved your gift 🎁`);
        break;
    }
    return;
  }

  if (kind === "manage") {
    if (cancelled) return;
    const owned = s.businesses.find((x) => x.id === a);
    if (owned) {
      owned.lastManagedDay = dayOf(s.time);
      log(s, "good", `You checked on your ${getBusiness(a)!.name}. Staff are on their toes.`);
    }
    return;
  }

  const def = getActivity(run.activityId)!;
  if (cancelled) {
    log(s, "info", `Stopped: ${def.name}.`);
    return;
  }
  if (def.course) {
    const id = def.course.id;
    s.courseProgress[id] = (s.courseProgress[id] ?? 0) + 1;
    if (s.courseProgress[id] >= def.course.sessions && !s.certificates.includes(def.course.cert)) {
      s.certificates.push(def.course.cert);
      log(s, "learn", `🎓 You earned the ${CERTIFICATES[def.course.cert]}!`);
    } else {
      log(s, "learn", `Class done (${s.courseProgress[id]}/${def.course.sessions}).`);
    }
  }
  if (def.cashGain) {
    let amount = randInt(s, def.cashGain[0], def.cashGain[1]);
    if (def.cashSkill) {
      const lvl = level(s, def.cashSkill);
      amount = amount >= 0 ? amount * (1 + lvl * 0.45) : amount;
      if (def.id === "resell") amount += lvl * 1200;
    }
    amount = Math.round((amount * wageMultiplier(s)) / 50) * 50;
    if (amount >= 0) {
      earn(s, amount, def.name);
      log(s, "money", `${def.name}: +${formatNaira(amount)}`);
    } else {
      forceCharge(s, -amount, `${def.name} (loss)`);
      log(s, "bad", `${def.name}: lost ${formatNaira(-amount)}. Markets are risky.`);
    }
  }
}

function finishShift(s: GameState, run: ActivityRun, cancelled: boolean, fraction: number) {
  const career = s.career;
  if (!career) return;
  const def = getCareer(career.careerId)!;
  const lvl = def.levels[career.level];
  const style = WORK_STYLES[run.workStyle ?? "steady"];
  const moodFactor = 0.85 + (mood(s) / 100) * 0.3;
  let pay = lvl.pay * wageMultiplier(s) * style.pay * moodFactor;
  if (run.taskBonus) pay *= 1.15;
  if (run.late) pay *= 0.9;

  if (cancelled) {
    const slip = paySalary(s, pay * fraction * 0.5, def.days.length, "Partial shift pay");
    career.performance = clamp(career.performance - 6);
    log(s, "bad", `You left work early. Half pay for hours worked: ${formatNaira(slip.net)} take-home.`);
    return;
  }

  let perf = style.perf * (hasTrait(s, "hardworking") ? 1.3 : 1);
  if (run.taskBonus) perf += 3;
  if (run.late) perf -= 5;
  if (mood(s) < 30) perf -= 3;
  career.performance = clamp(career.performance + perf);
  career.shiftsAtLevel += 1;
  career.missedStreak = 0;
  s.stats.shiftsWorked += 1;
  const slip = paySalary(s, pay, def.days.length, `Salary: ${lvl.title}`);
  log(
    s,
    "money",
    `Shift done!${run.taskBonus ? " (+15% task bonus)" : ""} Payslip: ${formatNaira(slip.gross)} gross − ${formatNaira(slip.tax)} PAYE tax − ${formatNaira(slip.pension)} pension = ${formatNaira(slip.net)} to your bank.`,
  );
  tryPromotion(s);
}

/** Pay a salary into the bank after PAYE tax and pension, like a real payslip. */
function paySalary(s: GameState, gross: number, shiftsPerWeek: number, label: string) {
  const slip = payslip(gross, shiftsPerWeek);
  earn(s, slip.gross, label, "bank");
  if (slip.tax) earn(s, -slip.tax, "PAYE income tax", "bank");
  if (slip.pension) earn(s, -slip.pension, "Pension (8%)", "bank");
  s.pension = (s.pension ?? 0) + slip.pension + slip.employerPension;
  s.stats.taxPaid = (s.stats.taxPaid ?? 0) + slip.tax;
  return slip;
}

/** Promotions get slower as you climb: 4, 6, 8, 10 shifts. */
export const shiftsForPromotion = (level: number) => 4 + level * 2;

export function promotionBlockers(s: GameState): string[] {
  const career = s.career;
  if (!career) return [];
  const def = getCareer(career.careerId)!;
  const next = def.levels[career.level + 1];
  if (!next) return ["You're at the top!"];
  const out: string[] = [];
  if (career.performance < 80) out.push(`Performance ${Math.round(career.performance)}/80`);
  const needShifts = shiftsForPromotion(career.level);
  if (career.shiftsAtLevel < needShifts) out.push(`Shifts at this level ${career.shiftsAtLevel}/${needShifts}`);
  if (level(s, def.skill) < next.skill) out.push(`${SKILL_NAMES[def.skill]} ${level(s, def.skill)}/${next.skill}`);
  if (next.extra && level(s, next.extra[0]) < next.extra[1]) out.push(`${SKILL_NAMES[next.extra[0]]} ${level(s, next.extra[0])}/${next.extra[1]}`);
  if (next.cert && !s.certificates.includes(next.cert)) out.push(`Needs ${CERTIFICATES[next.cert]}`);
  return out;
}

function tryPromotion(s: GameState) {
  const career = s.career!;
  const def = getCareer(career.careerId)!;
  const next = def.levels[career.level + 1];
  if (!next) return;
  const blockers = promotionBlockers(s);
  if (blockers.length === 0) {
    career.level += 1;
    career.performance = 55;
    career.shiftsAtLevel = 0;
    log(s, "good", `🎉 PROMOTED to ${next.title}! New pay: ${formatNaira(next.pay * wageMultiplier(s))}/shift.`);
  } else if (career.performance >= 80 && career.shiftsAtLevel >= shiftsForPromotion(career.level)) {
    const key = `promoHint_${career.careerId}_${career.level}`;
    if (!s.flags[key]) {
      s.flags[key] = 1;
      log(s, "info", `Your oga wants to promote you, but: ${blockers.join(", ")}.`);
    }
  }
}

/** Where you report for a career in the current city. */
export const workplaceFor = (s: GameState, kind: LocationDef["kinds"][number]) => findKind(s.city, kind);

export interface ShiftStatus {
  canStart: boolean;
  reason: string;
  late: boolean;
  workday: boolean;
  startLabel: string;
}

export function shiftStatus(s: GameState): ShiftStatus {
  const career = s.career;
  const none = { canStart: false, late: false, workday: false, startLabel: "" };
  if (!career) return { ...none, reason: "No job yet" };
  const def = getCareer(career.careerId)!;
  const wd = weekdayOf(s.time);
  const workday = def.days.includes(wd);
  const startLabel = `${def.start}:00`;
  const m = minuteOfDay(s.time);
  const start = def.start * 60;
  if (!workday) return { ...none, workday, startLabel, reason: "Day off today" };
  if (career.lastShiftDay === dayOf(s.time)) return { ...none, workday, startLabel, reason: "Already worked today" };
  if (m < start - 60) return { ...none, workday, startLabel, reason: `Shift starts at ${startLabel}` };
  if (m > start + 120) return { ...none, workday, startLabel, reason: "Too late — shift missed" };
  const work = workplaceFor(s, def.workplace);
  if (!work) return { ...none, workday, startLabel, reason: `No ${def.name} workplace in ${getCity(s.city).name}` };
  if (s.location !== work.id) return { ...none, workday, startLabel, reason: `Go to ${work.name}` };
  if (isBusy(s)) return { ...none, workday, startLabel, reason: "You're busy" };
  return { canStart: true, late: m > start + 15, workday, startLabel, reason: m > start + 15 ? "You're late!" : "Ready to work" };
}

// ---------------------------------------------------------------------------
// The clock: per-minute simulation
// ---------------------------------------------------------------------------

/**
 * While the player is away (app closed), their character looks after the
 * basics: needs don't fall below this, and nobody collapses or gets pop-ups.
 */
const AWAY_NEED_FLOOR = 25;
/** The most time simulated when coming back; longer absences are skipped. */
const MAX_CATCH_UP = 7 * MIN_PER_DAY;
let away = false;

function tickMinute(s: GameState) {
  s.time += 1;
  const run = s.activity;
  const fx = run ? runEffects(s, run) : null;

  // Base need decay
  if (!fx?.noBaseDecay) {
    const sleepMult = fx?.sleep ? 0.25 : 1;
    for (const k of NEED_KEYS) {
      let rate = DECAY[k] * sleepMult;
      if (k === "energy" && fx?.sleep) rate = 0;
      if (k === "social" && hasTrait(s, "social")) rate *= 0.7;
      if (k === "energy" && hasTrait(s, "night_owl")) rate *= 0.85;
      if (k === "fun" && hasTrait(s, "calm")) rate *= 0.8;
      const next = clamp(s.needs[k] - rate / 60);
      s.needs[k] = away ? Math.max(next, Math.min(s.needs[k], AWAY_NEED_FLOOR)) : next;
    }
  }

  // Health
  const hit = away ? 0 : NEED_KEYS.reduce((a, k) => a + (s.needs[k] < 10 ? HEALTH_HIT[k] : 0), 0);
  if (hit > 0) s.health = clamp(s.health - (hit * (hasTrait(s, "calm") ? 0.5 : 1)) / 60);
  else if (NEED_KEYS.every((k) => s.needs[k] > 30)) s.health = clamp(s.health + (hasTrait(s, "athletic") ? 1 : 0.5) / 60);

  // Activity progress
  if (run && fx) {
    const duration = run.end - run.start;
    const f = 1 / duration;
    const sleepQ = s.location === "home" ? home(s).sleepQuality + (hasItem(s, "good_bed") ? 0.15 : 0) : 0.95;
    for (const k of NEED_KEYS) {
      let d = fx.needs[k] ?? 0;
      if (!d) continue;
      if (k === "energy" && fx.sleep && d > 0) d *= sleepQ;
      if (k === "hygiene" && fx.bath && d > 0) d *= home(s).hygieneQuality;
      if (k === "hunger" && d > 0 && hasTrait(s, "foodie")) d *= 1.15;
      s.needs[k] = clamp(s.needs[k] + d * f);
    }
    for (const k of SKILL_KEYS) {
      let xp = fx.skills[k] ?? 0;
      if (!xp) continue;
      if (k === "creativity" && run.activityId === "skit" && hasItem(s, "ring_light")) xp *= 1.3;
      addSkillXp(s, k, xp * f * skillMultiplier(s, k, fx.study));
    }
    if (fx.health) s.health = clamp(s.health + fx.health * f);
    run.applied = Math.min(1, run.applied + f);

    // Power-hungry activities at home during an outage
    const def = getActivity(run.activityId);
    if (def?.requires?.power && s.location === "home") {
      const src = homePower(s);
      if (src === "none") {
        log(s, "bad", "🕯️ NEPA took light! Your session stopped.");
        completeActivity(s, true);
      } else if (src === "generator") {
        // Bill fuel for the in-world time the session covers, not the quick real time.
        s.flags.genMinutes = (s.flags.genMinutes ?? 0) + (def.duration ?? 0) / Math.max(1, run.end - run.start);
        while (s.flags.genMinutes >= 60) {
          s.flags.genMinutes -= 60;
          forceCharge(s, price(s, GENERATOR_COST_PER_HOUR, false), "Generator fuel");
        }
      }
    }
    if (s.activity && s.time >= s.activity.end) completeActivity(s, false);
  }

  // Travel
  if (s.travel && s.time >= s.travel.end) arrive(s);

  // Collapse
  if (s.health <= 0 && !away) collapse(s);

  // You only get a strike for a missed shift if you were playing while it was on.
  if (!away && s.career) {
    const def = getCareer(s.career.careerId);
    const mm = minuteOfDay(s.time);
    if (def?.days.includes(weekdayOf(s.time)) && mm >= def.start * 60 && mm <= def.start * 60 + 120) s.flags.sawShiftDay = dayOf(s.time);
  }

  // Calendar hooks
  const m = minuteOfDay(s.time);
  if (m === 0) daily(s);
  if (weekdayOf(s.time) === 5 && m === 8 * 60) payRent(s);
  if (m === 0 && weekdayOf(s.time) === 0) weekly(s);
  // Real time passes slowly, so surprises are checked every 15 minutes while you play.
  if (!away && m % 15 === 0) surprises(s);
  if (m % 60 === 0) hourly(s);
}

function collapse(s: GameState) {
  s.activity = null;
  s.travel = null;
  s.location = findKind(s.city, "hospital")?.id ?? s.location;
  const bill = price(s, 25000, false);
  forceCharge(s, bill, "Hospital emergency care");
  for (const k of NEED_KEYS) s.needs[k] = Math.max(s.needs[k], 50);
  s.health = 55;
  s.stats.hospitalVisits += 1;
  s.pendingEvent = {
    eventId: "__collapse",
    t: s.time,
    outcome: `You collapsed from exhaustion and woke up at the hospital. Bill: ${formatNaira(bill)}. Look after your needs: eat, sleep, bathe, rest and see friends.`,
  };
}

/** Pop-up events and DMs (live play only). */
function surprises(s: GameState) {
  if (!s.pendingEvent) {
    for (const ev of EVENTS) {
      if (ev.condition(s) && chance(s, ev.chance)) {
        s.pendingEvent = { eventId: ev.id, t: s.time, data: ev.makeData?.(s) };
        break;
      }
    }
  }
  const h = hourOf(s.time);
  if (h >= 7 && h <= 23 && chance(s, MESSAGE_CHANCE_PER_HOUR)) spawnMessage(s);
}

function hourly(s: GameState) {
  // Messages still arrive while you're away (read them when you're back).
  if (away && hourOf(s.time) >= 7 && hourOf(s.time) <= 23 && chance(s, MESSAGE_CHANCE_PER_HOUR)) spawnMessage(s);

  // Achievements & dream
  for (const a of ACHIEVEMENTS) {
    if (!s.achievements.includes(a.id) && a.check(s)) {
      s.achievements.push(a.id);
      log(s, "good", `🏅 Achievement unlocked: ${a.name}`);
    }
  }
  if (!s.flags.dreamDone && dreamProgress(s).done) {
    s.flags.dreamDone = s.time;
    log(s, "good", "🌟 You achieved your lifetime dream! You're a Naija legend.");
  }
}

export function spawnMessage(s: GameState, forceId?: string) {
  const pool = MESSAGE_TEMPLATES.filter((t) => (forceId ? t.id === forceId : !t.condition || t.condition(s)));
  if (!pool.length) return;
  const total = pool.reduce((a, t) => a + t.weight, 0);
  let r = nextRandom(s) * total;
  let tpl = pool[0];
  for (const t of pool) {
    r -= t.weight;
    if (r <= 0) {
      tpl = t;
      break;
    }
  }
  let data: Record<string, number | string> = {};
  if (tpl.pickSender) {
    const npc = tpl.pickSender(s);
    if (!npc) return;
    data.npc = npc;
  }
  data = { ...data, ...(tpl.makeData?.(s, data) ?? {}) };
  pushMessage(s, {
    from: String(data.npc ?? tpl.id),
    fromName: tpl.fromName(s, data),
    templateId: tpl.id,
    kind: tpl.kind,
    text: tpl.text(s, data),
    choices: tpl.choices.map((c) => ({ id: c.id, label: c.label })),
    data,
  });
}

function daily(s: GameState) {
  const today = dayOf(s.time);
  const yesterdayT = s.time - 1;

  // Missed shift yesterday?
  const career = s.career;
  if (career) {
    const def = getCareer(career.careerId)!;
    const shiftStartT = (today - 2) * MIN_PER_DAY + def.start * 60;
    const hiredBefore = (s.flags.careerStartT ?? 0) < shiftStartT;
    const wasPlaying = s.flags.realClock ? s.flags.sawShiftDay === today - 1 : true;
    if (def.days.includes(weekdayOf(yesterdayT)) && career.lastShiftDay !== today - 1 && hiredBefore && wasPlaying) {
      career.missedStreak += 1;
      career.performance = clamp(career.performance - 12);
      if (career.missedStreak >= 3) {
        log(s, "bad", `You missed 3 shifts in a row and were FIRED from ${def.levels[career.level].title}.`);
        s.career = null;
      } else {
        log(s, "bad", `You missed your shift yesterday. Performance dropped. (${career.missedStreak}/3 strikes)`);
      }
    }
  }

  // Friendships cool off without contact
  for (const [id, r] of Object.entries(s.relationships)) {
    if (r.met && today - r.lastTalkDay > 4) r.friendship = clamp(r.friendship - 1);
    void id;
  }

  // Fake gadgets die
  for (const key of Object.keys(s.flags)) {
    if (key.startsWith("fake_") && s.flags[key] <= today) {
      const itemId = key.slice(5);
      s.items = s.items.filter((i) => i !== itemId);
      delete s.flags[key];
      log(s, "bad", `Your ${getItem(itemId)?.name} stopped working — it was a fake! Lesson: check IMEI/serials and buy from trusted sellers.`);
    }
  }

  // Fuel scarcity
  if (today > s.world.fuelScarcityUntilDay && chance(s, 0.03)) {
    s.world.fuelScarcityUntilDay = today + 3;
    log(s, "bad", "⛽ Fuel scarcity! Transport fares are up 50% for the next few days.");
  }

  rollDay(s);
}

function payRent(s: GameState) {
  const week = weekOf(s.time);
  if (s.world.lastRentWeek === week) return;
  s.world.lastRentWeek = week;
  const h = home(s);
  if (h.weeklyRent === 0) return;
  if ((s.flags.rentPaidThroughWeek ?? 0) >= week) return;
  const rent = price(s, h.weeklyRent, false);
  if (charge(s, rent, `Rent: ${h.name}`)) {
    s.missedRent = 0;
    log(s, "money", `Rent paid: -${formatNaira(rent)}.`);
    return;
  }
  s.missedRent += 1;
  if (s.missedRent >= 2) {
    const couch = cityHome(homeCity(s), "couch");
    s.homeId = couch.id;
    s.missedRent = 0;
    s.stats.evictions += 1;
    s.world.power = rollPower(s, "D");
    log(s, "bad", `🚪 EVICTED for unpaid rent. You've moved to ${couch.name} in ${couch.area}.`);
  } else {
    log(s, "bad", `⚠️ You couldn't pay rent (${formatNaira(rent)}). Landlord says pay next Saturday or leave.`);
  }
}

function weekly(s: GameState) {
  const week = weekOf(s.time) - 1; // the week that just ended
  if (s.world.lastWeekSettled >= week) return;
  s.world.lastWeekSettled = week;
  const lines: string[] = [];

  // Savings interest
  if (s.bank > 0) {
    const interest = Math.round(s.bank * SAVINGS_WEEKLY_RATE);
    if (interest > 0) {
      earn(s, interest, "Savings interest", "bank");
      lines.push(`interest +${formatNaira(interest)}`);
    }
  }

  // Pension grows
  if (s.pension) s.pension = Math.round(s.pension * (1 + PENSION_WEEKLY_GROWTH));

  // Investments
  for (const [id, value] of Object.entries(s.investments)) {
    const def = getInvestment(id);
    if (!def || value <= 0) continue;
    const r = def.mean + def.sd * gaussian(s);
    s.investments[id] = Math.max(0, Math.round(value * (1 + r)));
  }

  // Businesses
  for (const b of s.businesses) {
    const def = getBusiness(b.id)!;
    const neglected = dayOf(s.time) - b.lastManagedDay > 14;
    if (def.school) {
      // Schools are run by the player: fees in, salaries and running costs out.
      b.school ??= newSchool(s, def);
      const profit = schoolWeek(s, b, def, neglected);
      b.weeklyHistory = [...b.weeklyHistory.slice(-7), profit];
      lines.push(`${def.emoji} ${profit >= 0 ? "+" : ""}${formatNaira(profit)}${neglected ? " (owner absent!)" : ""}`);
      continue;
    }
    const levelMult = 1 + 0.6 * (b.level - 1);
    const skillMult = 0.8 + 0.06 * level(s, def.skill);
    let profit = def.weekly * levelMult * skillMult * (1 + def.volatility * gaussian(s)) * s.world.priceIndex;
    if (neglected) profit *= 0.5;
    profit = Math.round(profit / 100) * 100;
    b.weeklyHistory = [...b.weeklyHistory.slice(-7), profit];
    if (profit >= 0) earn(s, profit, `${def.name} profit`, "bank");
    else forceCharge(s, -profit, `${def.name} loss`);
    lines.push(`${def.emoji} ${profit >= 0 ? "+" : ""}${formatNaira(profit)}${neglected ? " (neglected!)" : ""}`);
  }

  // Loans
  for (const loan of [...s.loans]) {
    const pay = Math.min(loan.weekly, loan.remaining);
    if (charge(s, pay, `${loan.lender} repayment`)) {
      loan.remaining -= pay;
      if (loan.remaining <= 0) {
        s.loans = s.loans.filter((l) => l !== loan);
        s.flags.loansRepaid = (s.flags.loansRepaid ?? 0) + 1;
        log(s, "good", `🕊️ Loan from ${loan.lender} fully repaid!`);
      }
    } else {
      loan.missed += 1;
      loan.remaining = Math.round(loan.remaining * 1.05);
      log(s, "bad", `Missed loan repayment to ${loan.lender}. 5% penalty added.`);
      if (getLoanDef(loan.id)?.predatory) {
        addNeeds(s, { social: -25, fun: -15 });
        pushMessage(s, { from: "quickcash", fromName: "QuickCash Recovery", templateId: "harass", kind: "system", text: "YOU ARE A DEBTOR!!! We have messaged everyone in your contacts. PAY NOW or we post your picture online. (Predatory lenders shame borrowers — avoid them.)" });
      }
    }
  }

  // Friends repay loans
  for (const [id, r] of Object.entries(s.relationships)) {
    if (r.owes > 0) {
      const npc = getNpc(id);
      if (npc && chance(s, npc.reliability)) {
        earn(s, r.owes, `${npc.name} paid back`, "bank");
        log(s, "money", `${npc.name} paid back ${formatNaira(r.owes)}. 🙏🏾`);
        r.owes = 0;
      } else if (npc && chance(s, 0.3)) {
        log(s, "bad", `${npc.name} still hasn't paid back the ${formatNaira(r.owes)}... it may be gone.`);
        r.owes = 0;
        r.friendship = clamp(r.friendship - 5);
      }
    }
  }

  // Ponzi scheme lifecycle: one juicy payout, then collapse.
  if (s.ponzi) {
    const thisWeek = weekOf(s.time);
    if (!s.ponzi.paidOut && thisWeek >= s.ponzi.week + 1) {
      const roi = Math.round(s.ponzi.invested * 0.25);
      earn(s, roi, "WealthRise 'ROI'", "bank");
      s.ponzi.paidOut = true;
      pushMessage(s, { from: "ponzi", fromName: "WealthRise Club 💰", templateId: "ponzi_roi", kind: "scam", text: `🎉 Your weekly ROI of ${formatNaira(roi)} has been PAID! Reinvest and bring 3 friends to unlock VIP 200% returns!` });
    } else if (s.ponzi.paidOut && thisWeek >= s.ponzi.week + 2) {
      const lost = s.ponzi.invested;
      s.ponzi = null;
      s.stats.scamsFallen += 1;
      pushMessage(s, { from: "ponzi", fromName: "WealthRise Club 💰", templateId: "ponzi_crash", kind: "system", text: `⚠️ Dear members, due to 'system upgrade', withdrawals are suspended indefinitely. (The website is gone and the admins have vanished. You lost ${formatNaira(lost)}. Early payouts were bait, paid from newer members' money — that's how every Ponzi works.)` });
      log(s, "bad", `WealthRise Club collapsed. ${formatNaira(lost)} lost.`);
    }
  }

  // Inflation
  s.world.priceIndex *= 1 + INFLATION_WEEKLY;

  log(s, "info", `📅 Week ${week} wrapped up${lines.length ? ": " + lines.join(" · ") : "."} Prices rose ${(INFLATION_WEEKLY * 100).toFixed(1)}% (inflation).`);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

const clone = (s: GameState): GameState => structuredClone(s);

/**
 * Advance the simulation. Stops early when a pop-up event needs the player.
 * "away" = catching up on time the app was closed (see AWAY_NEED_FLOOR).
 */
export function advance(state: GameState, minutes: number, mode: "live" | "away" = "live"): GameState {
  if (minutes <= 0 || (state.pendingEvent && mode === "live")) return state;
  const s = clone(state);
  if (mode === "away" && minutes > MAX_CATCH_UP) {
    // Very long absence: life was on hold; only the last week is simulated.
    s.time += minutes - MAX_CATCH_UP;
    minutes = MAX_CATCH_UP;
    rollDay(s);
  }
  away = mode === "away";
  try {
    for (let i = 0; i < minutes; i++) {
      tickMinute(s);
      if (s.pendingEvent && !away) break;
    }
  } finally {
    away = false;
  }
  s.updatedAt = Date.now();
  return s;
}

export function dispatch(state: GameState, cmd: Command): DispatchResult {
  const s = clone(state);
  const err = apply(s, cmd);
  if (err) return { state, error: err };
  s.updatedAt = Date.now();
  return { state: s };
}

function apply(s: GameState, cmd: Command): string | void {
  switch (cmd.type) {
    case "setSpeed":
      s.speed = cmd.speed;
      return;

    case "travel": {
      if (isBusy(s)) return "Finish what you're doing first.";
      if (cmd.to === s.location) return "You're already here.";
      if (cmd.to !== "home" && !getLocation(cmd.to)) return "Unknown place.";
      const opt = travelOptions(s, cmd.to).find((o) => o.mode === cmd.mode);
      if (!opt || !opt.ok) return opt?.reason ?? "Can't travel that way.";
      if (!charge(s, opt.fare, `${opt.name} fare`)) return "Can't afford the fare.";
      s.travel = { from: s.location, to: cmd.to, mode: cmd.mode, start: s.time, end: s.time + opt.minutes };
      return;
    }

    case "intercity": {
      if (isBusy(s)) return "Finish what you're doing first.";
      if (cmd.to === s.city) return "You're already in this city.";
      const q = intercityQuote(s, cmd.to, cmd.mode);
      if (!q) return "No route there yet.";
      if (!charge(s, q.fare, `${cmd.mode === "coach" ? "Bus" : "Flight"} to ${getCity(cmd.to).name}`)) return `You need ${formatNaira(q.fare)} for this trip.`;
      s.travel = { from: s.location, to: q.arrival, mode: cmd.mode, start: s.time, end: s.time + q.minutes, toCity: cmd.to };
      log(s, "info", `${cmd.mode === "coach" ? "🚌" : "✈️"} Off to ${getCity(cmd.to).name}!`);
      return;
    }

    case "relocate": {
      const city = CITIES.find((c) => c.id === cmd.city);
      if (!city) return "Unknown city.";
      if (city.id === homeCity(s) && city.id === s.city) return "You already live here.";
      const tier = getHome(s.homeId).tier;
      const next = cityHome(city.id, tier === "hostel" && !s.flags.student ? "selfcon" : tier);
      s.activity = null;
      s.travel = null;
      s.homeId = next.id;
      s.city = city.id;
      s.location = "home";
      s.world.power = rollPower(s, next.band);
      s.world.weather = rollWeather(s);
      log(s, "good", `🧳 You moved your life to ${city.name}! New home: ${next.name}, ${next.area}. Your money, job and progress came with you.`);
      if (s.career) {
        const def = getCareer(s.career.careerId)!;
        if (!findKind(city.id, def.workplace)) log(s, "bad", `There's no ${def.name} workplace in ${city.name}. Find a new job in the Jobs app, or move back.`);
      }
      return;
    }

    case "startActivity": {
      const def = getActivity(cmd.activityId);
      if (!def || !def.at.some((k) => kindsHere(s).includes(k))) return "Not available here.";
      const v = activityView(s, def);
      if (!v.ok) return v.reason;
      if (v.cost && !charge(s, v.cost, def.name)) return "Can't afford it.";
      for (const id of def.requires?.food ?? []) s.pantry[id] = Math.max(0, (s.pantry[id] ?? 0) - 1);
      startRun(s, { activityId: def.id, start: s.time, end: s.time + actionMinutes(def.duration) });
      return;
    }

    case "cancelActivity":
      if (!s.activity) return "Nothing to stop.";
      completeActivity(s, true);
      return;

    case "startShift": {
      const st = shiftStatus(s);
      if (!st.canStart) return st.reason;
      const def = getCareer(s.career!.careerId)!;
      s.career!.lastShiftDay = dayOf(s.time);
      startRun(s, {
        activityId: `shift:${def.id}`,
        start: s.time,
        end: s.time + actionMinutes(def.hours * 60),
        workStyle: cmd.workStyle as WorkStyle,
        taskBonus: cmd.taskBonus,
        late: st.late,
      });
      return;
    }

    case "applyJob": {
      const def = getCareer(cmd.careerId);
      if (!def) return "Unknown job.";
      if (s.career?.careerId === def.id) return "You already work here.";
      const first = def.levels[0];
      if (level(s, def.skill) < first.skill) return `Needs ${SKILL_NAMES[def.skill]} level ${first.skill}.`;
      if (s.activity?.activityId.startsWith("shift:")) return "Finish your current shift first.";
      s.career = { careerId: def.id, level: 0, performance: 50, shiftsAtLevel: 0, missedStreak: 0, lastShiftDay: -1 };
      s.flags.careerStartT = s.time;
      log(s, "good", `You're hired as ${first.title}! Shifts: ${def.start}:00 for ${def.hours}h at ${workplaceFor(s, def.workplace)?.name ?? "your workplace"}.`);
      return;
    }

    case "quitJob":
      if (!s.career) return "You don't have a job.";
      if (s.activity?.activityId.startsWith("shift:")) return "Finish your shift first.";
      log(s, "info", "You resigned.");
      s.career = null;
      return;

    case "bankTransfer": {
      const amt = Math.floor(cmd.amount);
      if (!(amt > 0)) return "Enter an amount.";
      if (bankFrozen(s)) return "Your account is frozen by investigators.";
      if (cmd.direction === "deposit") {
        if (s.cash < amt) return "Not enough cash.";
        s.cash -= amt;
        s.bank += amt;
        s.transactions.push({ t: s.time, amount: amt, label: "Cash deposit", account: "bank" });
      } else {
        const fee = price(s, 100, false);
        if (s.bank < amt + fee) return "Not enough in the bank (₦100 POS fee applies).";
        s.bank -= amt + fee;
        s.cash += amt;
        s.transactions.push({ t: s.time, amount: -(amt + fee), label: "POS withdrawal (incl. fee)", account: "bank" });
      }
      return;
    }

    case "buyItem": {
      const item = getItem(cmd.itemId);
      if (!item) return "Unknown item.";
      if (hasItem(s, item.id)) return "You already own this.";
      const atVillage = kindsHere(s).includes("gadget_market") && locationOpen(s, s.location) && item.gadget;
      const cost = price(s, item.price * (atVillage ? 0.8 : 1));
      if (!charge(s, cost, item.name)) return "Can't afford it.";
      s.items.push(item.id);
      if (atVillage && chance(s, Math.max(0, 0.25 - level(s, "business") * 0.05))) {
        s.flags[`fake_${item.id}`] = dayOf(s.time) + 3;
      }
      log(s, "money", `Bought ${item.name} for ${formatNaira(cost)}.`);
      return;
    }

    case "buyFood": {
      const order = Object.entries(cmd.items)
        .map(([id, n]) => [getFood(id), Math.floor(n)] as const)
        .filter(([f, n]) => f && n > 0) as [NonNullable<ReturnType<typeof getFood>>, number][];
      if (!order.length) return "Pick some foodstuff first.";
      const units = order.reduce((a, [, n]) => a + n, 0);
      if (pantryCount(s) + units > pantryCapacity(s)) {
        return `Your pantry only has room for ${Math.max(0, pantryCapacity(s) - pantryCount(s))} more.${hasItem(s, "fridge") ? "" : " A fridge holds much more."}`;
      }
      let level: number;
      let fee = 0;
      if (cmd.delivery) {
        const h = hourOf(s.time);
        if (h < DELIVERY_HOURS[0] || h >= DELIVERY_HOURS[1]) return `Riders deliver between ${DELIVERY_HOURS[0]}am and ${DELIVERY_HOURS[1] - 12}pm.`;
        level = DELIVERY_PRICE_LEVEL;
        fee = price(s, DELIVERY_FEE, false);
      } else {
        const lvl = foodPriceLevelHere(s);
        if (lvl === null) return "No foodstuff sold here. Go to a market, or order delivery from the Shop app.";
        if (!locationOpen(s, s.location)) return "The market is closed.";
        level = lvl;
      }
      const cost = order.reduce((a, [f, n]) => a + foodPrice(s, f.id, level) * n, 0) + fee;
      const label = order.map(([f, n]) => `${f.name}${n > 1 ? ` ×${n}` : ""}`).join(", ");
      if (!charge(s, cost, cmd.delivery ? `Food delivery: ${label}` : `Foodstuff: ${label}`)) return "Can't afford it.";
      for (const [f, n] of order) s.pantry[f.id] = (s.pantry[f.id] ?? 0) + n;
      log(s, "money", `${cmd.delivery ? "🛵 Delivered home" : "🧺 Bought"}: ${label} — ${formatNaira(cost)}${fee ? " incl. delivery" : ""}.`);
      return;
    }

    case "moveHouse": {
      const h = HOMES.find((x) => x.id === cmd.homeId);
      if (!h || h.hidden) return "Not available.";
      if (h.id === s.homeId) return "You already live here.";
      if (h.studentOnly && !s.flags.student) return "Students only.";
      if (h.city !== s.city) return `Travel to ${getCity(h.city).name} to rent there.`;
      if (isBusy(s)) return "Finish what you're doing first.";
      const upfront = price(s, h.weeklyRent, false) * h.moveInWeeks;
      if (!charge(s, upfront, `Move-in: ${h.name}`)) return `Need ${formatNaira(upfront)} upfront (rent + agency & caution fees).`;
      s.homeId = h.id;
      s.missedRent = 0;
      s.flags.rentPaidThroughWeek = weekOf(s.time) + 1;
      s.world.power = rollPower(s, h.band);
      log(s, "good", `🏠 You moved to ${h.name}, ${h.area}! Next rent due in 2 weeks.`);
      return;
    }

    case "invest": {
      const def = getInvestment(cmd.productId);
      if (!def) return "Unknown product.";
      const amt = Math.floor(cmd.amount);
      if (amt < def.min) return `Minimum is ${formatNaira(def.min)}.`;
      if (bankFrozen(s)) return "Your account is frozen.";
      if (s.bank < amt) return "Invest from your bank balance — deposit cash first.";
      s.bank -= amt;
      s.investments[def.id] = (s.investments[def.id] ?? 0) + amt;
      s.transactions.push({ t: s.time, amount: -amt, label: `Invest: ${def.name}`, account: "bank" });
      log(s, "money", `Invested ${formatNaira(amt)} in ${def.name}.`);
      return;
    }

    case "divest": {
      const def = getInvestment(cmd.productId);
      const v = s.investments[cmd.productId] ?? 0;
      if (!def || v <= 0) return "Nothing to sell.";
      const out = Math.round(v * (1 - DIVEST_FEE));
      delete s.investments[cmd.productId];
      earn(s, out, `Sold ${def.name}`, "bank");
      log(s, "money", `Sold ${def.name}: +${formatNaira(out)} (1% fee).`);
      return;
    }

    case "buyBusiness": {
      const def = getBusiness(cmd.businessId);
      if (!def) return "Unknown business.";
      if (s.businesses.some((b) => b.id === def.id)) return "You already own one.";
      if (def.requires && level(s, def.requires[0]) < def.requires[1]) return `Needs ${SKILL_NAMES[def.requires[0]]} ${def.requires[1]}.`;
      const cost = price(s, def.price, false);
      if (!charge(s, cost, `Started ${def.name}`)) return "Can't afford it.";
      s.businesses.push({ id: def.id, level: 1, boughtOnDay: dayOf(s.time), lastManagedDay: dayOf(s.time), weeklyHistory: [], ...(def.school ? { school: newSchool(s, def) } : {}) });
      log(
        s,
        "good",
        def.school
          ? `${def.emoji} You opened ${def.name}! Run it from the Business app: set fees, hire teachers, chase unpaid fees and hold exams each term.`
          : `${def.emoji} You opened a ${def.name}! Profits arrive every Monday.`,
      );
      return;
    }

    case "upgradeBusiness": {
      const b = s.businesses.find((x) => x.id === cmd.businessId);
      const def = getBusiness(cmd.businessId);
      if (!b || !def) return "You don't own this.";
      if (b.level >= BUSINESS_MAX_LEVEL) return "Already at max level.";
      const cost = price(s, def.price * 0.6 * b.level, false);
      if (!charge(s, cost, `Upgrade ${def.name}`)) return "Can't afford the upgrade.";
      b.level += 1;
      log(s, "good", `${def.emoji} ${def.name} upgraded to level ${b.level}!`);
      return;
    }

    case "sellBusiness": {
      const b = s.businesses.find((x) => x.id === cmd.businessId);
      const def = getBusiness(cmd.businessId);
      if (!b || !def) return "You don't own this.";
      const value = Math.round(def.price * (0.6 + 0.3 * (b.level - 1)) * s.world.priceIndex);
      s.businesses = s.businesses.filter((x) => x !== b);
      earn(s, value, `Sold ${def.name}`, "bank");
      log(s, "money", `Sold ${def.name} for ${formatNaira(value)}.`);
      return;
    }

    case "manageBusiness": {
      const b = s.businesses.find((x) => x.id === cmd.businessId);
      if (!b) return "You don't own this.";
      if (isBusy(s)) return "You're busy.";
      startRun(s, { activityId: `manage:${b.id}`, start: s.time, end: s.time + actionMinutes(120) });
      return;
    }

    case "schoolSet":
    case "schoolChase":
    case "schoolExam": {
      const b = s.businesses.find((x) => x.id === cmd.businessId);
      const def = getBusiness(cmd.businessId);
      if (!b || !def?.school) return "You don't run this school.";
      b.school ??= newSchool(s, def);
      if (cmd.type === "schoolSet") return setSchool(s, b, def, cmd);
      if (cmd.type === "schoolChase") return chaseFees(s, b, def, cmd.method);
      return holdExams(s, b, def);
    }

    case "takeLoan": {
      const def = getLoanDef(cmd.loanId);
      if (!def) return "Unknown loan.";
      if (s.loans.some((l) => l.id === def.id)) return "You already have this loan.";
      if (def.requiresJobLevel && (!s.career || s.career.level + 1 < def.requiresJobLevel)) return `Needs a job at level ${def.requiresJobLevel}+.`;
      if (bankFrozen(s)) return "Your account is frozen.";
      s.loans.push({ id: def.id, principal: def.principal, remaining: def.weekly * def.weeks, weekly: def.weekly, missed: 0, lender: def.lender });
      earn(s, def.principal, `${def.lender} loan`, "bank");
      log(s, "money", `Loan received: +${formatNaira(def.principal)}. You'll repay ${formatNaira(def.weekly)} every Monday.`);
      return;
    }

    case "repayLoan": {
      const loan = s.loans.find((l) => l.id === cmd.loanId);
      if (!loan) return "No such loan.";
      if (!charge(s, loan.remaining, `Repay ${loan.lender}`)) return "Not enough money to pay it off.";
      s.loans = s.loans.filter((l) => l !== loan);
      s.flags.loansRepaid = (s.flags.loansRepaid ?? 0) + 1;
      log(s, "good", `🕊️ ${loan.lender} loan paid off!`);
      return;
    }

    case "talk": {
      const npc = getNpc(cmd.npcId);
      if (!npc) return "Nobody here by that name.";
      if (isBusy(s)) return "You're busy.";
      if (!npcsAt(s.location, weekdayOf(s.time), hourOf(s.time)).some((n) => n.id === npc.id)) return `${npc.name} isn't here.`;
      const it = INTERACTIONS[cmd.interaction as InteractionId];
      if (!it) return "Unknown interaction.";
      const rel = ensureRelationship(s, npc.id);
      if (cmd.interaction === "advice" && rel.adviceDay === dayOf(s.time)) return `${npc.name} already gave you advice today.`;
      if (cmd.interaction === "hangout" && !charge(s, price(s, 1500), `Hangout with ${npc.name}`)) return "Can't afford ₦1,500.";
      if (cmd.interaction === "gift" && !charge(s, price(s, 3000), `Gift for ${npc.name}`)) return "Can't afford ₦3,000.";
      rel.met = true;
      startRun(s, { activityId: `talk:${npc.id}:${cmd.interaction}`, start: s.time, end: s.time + actionMinutes(it.minutes) });
      return;
    }

    case "resolveEvent": {
      const pe = s.pendingEvent;
      if (!pe) return "No event.";
      if (cmd.choiceId === "__dismiss" || pe.outcome) {
        s.pendingEvent = null;
        return;
      }
      const ev = EVENTS.find((e) => e.id === pe.eventId);
      const choice = ev?.choices.find((c) => c.id === cmd.choiceId);
      if (!ev || !choice) {
        s.pendingEvent = null;
        return;
      }
      pe.outcome = choice.resolve(s, pe.data ?? {});
      return;
    }

    case "replyMessage": {
      const msg = s.messages.find((m) => m.id === cmd.messageId);
      if (!msg || msg.resolved) return "Already handled.";
      const tpl = MESSAGE_TEMPLATES.find((t) => t.id === msg.templateId);
      const choice = tpl?.choices.find((c) => c.id === cmd.choiceId);
      if (!tpl || !choice) return "Can't reply to that.";
      msg.resolved = choice.id;
      msg.read = true;
      msg.outcome = choice.resolve(s, msg.data ?? {});
      return;
    }

    case "markMessagesRead":
      for (const m of s.messages) m.read = true;
      return;

    case "sendGift": {
      const amt = Math.floor(cmd.amount);
      if (!(amt >= 100)) return "Minimum gift is ₦100.";
      if (bankFrozen(s)) return "Your account is frozen.";
      if (s.bank < amt) return "Gifts are sent from your bank balance.";
      s.bank -= amt;
      s.transactions.push({ t: s.time, amount: -amt, label: `Gift to ${cmd.to}`, account: "bank" });
      log(s, "money", `🎁 You sent ${formatNaira(amt)} to ${cmd.to}.`);
      return;
    }

    case "receiveGift": {
      const amt = Math.floor(cmd.amount);
      if (!(amt > 0)) return "Invalid gift.";
      earn(s, amt, `Gift from ${cmd.from}`, "bank");
      log(s, "money", `🎁 ${cmd.from} sent you ${formatNaira(amt)}${cmd.note ? `: "${cmd.note}"` : ""}`);
      return;
    }

    case "topUp": {
      const amt = Math.floor(cmd.amount);
      if (!(amt > 0)) return "Invalid top-up.";
      const key = `topup_${cmd.ref}`;
      if (s.flags[key]) return "Already added.";
      s.flags[key] = 1;
      earn(s, amt, "Game money top-up", "bank");
      s.stats.toppedUp = (s.stats.toppedUp ?? 0) + amt;
      log(s, "money", `💰 ${formatNaira(amt)} game money added to your bank. Thank you for supporting ModeQuest!`);
      return;
    }

    case "referralBonus": {
      const amt = Math.floor(cmd.amount);
      if (!(amt > 0)) return "Invalid bonus.";
      const key = `refbonus_${cmd.ref}`;
      if (s.flags[key]) return "Already added.";
      s.flags[key] = 1;
      earn(s, amt, `Invite bonus: ${cmd.friend}`, "bank");
      log(s, "good", `📣 ${cmd.friend} joined from your invite and is playing! +${formatNaira(amt)} invite bonus.`);
      return;
    }

    case "setAppearance":
      s.player.appearance = { ...cmd.appearance };
      return;

    case "completeLesson": {
      const lesson = getLesson(cmd.lessonId);
      if (!lesson) return "Unknown lesson.";
      const score = clamp(Math.round(cmd.score));
      const prev = s.lessons[lesson.id] ?? -1;
      // Remember what was missed (only real questions/cards from this lesson).
      const known = new Set([...(lesson.questions ?? []).map((q) => q.q), ...(lesson.sort?.cards ?? []).map((c) => c.label)]);
      const missed = (cmd.missed ?? []).filter((m) => known.has(m));
      if (missed.length) {
        s.quizMisses ??= {};
        const tally = (s.quizMisses[lesson.id] ??= {});
        for (const m of missed) tally[m] = Math.min(99, (tally[m] ?? 0) + 1);
      }
      s.lessons[lesson.id] = Math.max(prev, score);
      if (score >= 60 && prev < 60) {
        addSkillXp(s, lesson.skill, lesson.xp);
        earn(s, lesson.grant, `Mode Academy grant: ${lesson.title}`, "bank");
        log(s, "learn", `🎓 Passed "${lesson.title}" (${score}%). +${formatNaira(lesson.grant)} grant!`);
      } else if (score >= 60) {
        addSkillXp(s, lesson.skill, Math.round(lesson.xp / 4));
        log(s, "learn", `Reviewed "${lesson.title}" (${score}%). +XP`);
      } else {
        log(s, "info", `"${lesson.title}": ${score}%. Score 60% to pass — try again!`);
      }
      return;
    }
  }
}

export function pendingEventView(s: GameState) {
  const pe = s.pendingEvent;
  if (!pe) return null;
  if (pe.eventId === "__collapse") return { title: "You collapsed!", emoji: "🚑", text: "", choices: [], outcome: pe.outcome };
  const ev = EVENTS.find((e) => e.id === pe.eventId);
  if (!ev) return null;
  return {
    title: ev.title,
    emoji: ev.emoji,
    text: ev.text(s, pe.data ?? {}),
    choices: ev.choices.map((c) => ({ id: c.id, label: c.label })),
    outcome: pe.outcome,
  };
}

/** Market price level where the player is standing (null if no food sold). */
export function foodPriceLevelHere(s: GameState): number | null {
  if (s.location === "home") return null;
  const g = getLocation(s.location)?.groceryPrice;
  return g ? g / 1000 : null;
}

/** Price of one unit of a foodstuff at a given price level. */
export const foodPrice = (s: GameState, id: string, level = 1) => price(s, (getFood(id)?.price ?? 0) * level);

/** Re-derive state for older saves. Bump SAVE_VERSION and add steps here. */
export function migrate(raw: unknown): GameState | null {
  if (!raw || typeof raw !== "object") return null;
  const s = raw as GameState;
  if (typeof s.version !== "number" || !s.player || !s.needs) return null;
  if (s.version > SAVE_VERSION) return null;
  // Reject broken or hand-edited saves instead of crashing on every load.
  const isObj = (v: unknown) => !!v && typeof v === "object";
  if (
    typeof s.time !== "number" ||
    typeof s.cash !== "number" ||
    typeof s.bank !== "number" ||
    !isObj(s.skills) ||
    !isObj(s.world) ||
    !isObj(s.stats) ||
    !isObj(s.flags) ||
    !isObj(s.lessons) ||
    !Array.isArray(s.messages) ||
    !Array.isArray(s.log) ||
    !Array.isArray(s.items) ||
    (s.version >= 3 && !isObj(s.pantry)) ||
    !HOMES.some((h) => h.id === s.homeId)
  ) {
    return null;
  }
  if (s.version < 2) {
    // v2: multiple cities. All v1 saves were in Lagos; "danfo" became "bus".
    s.city = "lagos";
    if (s.travel && (s.travel.mode as string) === "danfo") s.travel.mode = "bus";
    s.version = 2;
  }
  if (s.version < 3) {
    // v3: typed pantry. Old generic packs become jollof ingredients.
    const old = Math.max(0, Math.floor(Number((s as unknown as { groceries?: number }).groceries) || 0));
    s.pantry = old ? { rice: old, tomato_pepper: old } : {};
    delete (s as unknown as { groceries?: number }).groceries;
    s.version = 3;
  }
  if (!CITIES.some((c) => c.id === s.city)) return null;
  if (s.location !== "home" && !getLocation(s.location)) s.location = "home";
  // Schools bought before schools were player-run: open their school office now.
  for (const b of s.businesses ?? []) {
    const def = getBusiness(b.id);
    if (def?.school && !b.school) b.school = newSchool(s, def);
  }
  return s;
}

