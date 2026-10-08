import { getHome } from "./data/world";
import { getBusiness, getItem } from "./data/economy";
import type { GameState, LogKind, Message, NeedKey, SkillKey } from "./types";
import { NEED_KEYS } from "./types";
import { clamp, hourOf, skillLevel } from "./util";

// Mutating helpers that operate on a draft GameState inside the engine.

export function log(s: GameState, kind: LogKind, text: string) {
  s.logSeq += 1;
  s.log.push({ id: s.logSeq, t: s.time, kind, text });
  if (s.log.length > 120) s.log.splice(0, s.log.length - 120);
}

function recordTx(s: GameState, amount: number, label: string, account: "cash" | "bank") {
  s.transactions.push({ t: s.time, amount: Math.round(amount), label, account });
  if (s.transactions.length > 200) s.transactions.splice(0, s.transactions.length - 200);
}

export function earn(s: GameState, amount: number, label: string, account: "cash" | "bank" = "cash") {
  amount = Math.round(amount);
  if (amount === 0) return;
  if (account === "cash") s.cash += amount;
  else s.bank += amount;
  if (amount > 0) s.stats.totalEarned += amount;
  recordTx(s, amount, label, account);
}

/** The bank can be frozen (e.g. after letting fraudsters use your account). */
export const bankFrozen = (s: GameState) => (s.flags.bankFrozenUntil ?? 0) > s.time;

export const totalMoney = (s: GameState) => s.cash + (bankFrozen(s) ? 0 : Math.max(0, s.bank));

/**
 * Pay from cash first, then the bank (card/transfer). Returns false without
 * charging anything if the player can't afford it.
 */
export function charge(s: GameState, amount: number, label: string): boolean {
  amount = Math.round(amount);
  if (amount <= 0) return true;
  if (totalMoney(s) < amount) return false;
  const fromCash = Math.min(Math.max(0, s.cash), amount);
  const fromBank = amount - fromCash;
  if (fromCash > 0) {
    s.cash -= fromCash;
    recordTx(s, -fromCash, label, "cash");
  }
  if (fromBank > 0) {
    s.bank -= fromBank;
    recordTx(s, -fromBank, label, "bank");
  }
  return true;
}

/** Take money even if it pushes the bank negative (overdraft from bills). */
export function forceCharge(s: GameState, amount: number, label: string) {
  if (charge(s, amount, label)) return;
  const fromCash = Math.max(0, s.cash);
  s.cash -= fromCash;
  if (fromCash) recordTx(s, -fromCash, label, "cash");
  const rest = Math.round(amount - fromCash);
  s.bank -= rest;
  recordTx(s, -rest, label, "bank");
}

export const hasTrait = (s: GameState, id: string) => s.player.traits.includes(id);
export const hasItem = (s: GameState, id: string) => s.items.includes(id);

/** Consumer price: base × inflation × thrifty discount. */
export function price(s: GameState, base: number, consumer = true): number {
  let p = base * s.world.priceIndex;
  if (consumer && hasTrait(s, "thrifty")) p *= 0.9;
  return Math.round(p / 50) * 50 || (base > 0 ? 50 : 0);
}

/** Wages rise with inflation, but only partly. */
export function wageMultiplier(s: GameState): number {
  return 1 + (s.world.priceIndex - 1) * 0.6;
}

export function addNeeds(s: GameState, delta: Partial<Record<NeedKey, number>>, mult = 1) {
  for (const k of NEED_KEYS) {
    const d = delta[k];
    if (d) s.needs[k] = clamp(s.needs[k] + d * mult);
  }
}

export function mood(s: GameState): number {
  const n = s.needs;
  const avg = (n.hunger * 1.2 + n.energy * 1.2 + n.hygiene * 0.8 + n.fun + n.social * 0.8) / 5;
  const healthPenalty = s.health < 40 ? (40 - s.health) * 0.5 : 0;
  return clamp(avg - healthPenalty);
}

export function moodLabel(m: number): { label: string; emoji: string } {
  if (m >= 80) return { label: "Thriving", emoji: "🤩" };
  if (m >= 60) return { label: "Good", emoji: "😊" };
  if (m >= 40) return { label: "Okay", emoji: "😐" };
  if (m >= 20) return { label: "Stressed", emoji: "😣" };
  return { label: "Miserable", emoji: "😫" };
}

const SKILL_TRAIT: Partial<Record<SkillKey, string>> = {
  cooking: "foodie",
  creativity: "creative",
  fitness: "athletic",
};

export function skillMultiplier(s: GameState, key: SkillKey, studying = false): number {
  let m = 0.6 + mood(s) / 125; // 0.6 at mood 0, 1.4 at mood 100
  if (SKILL_TRAIT[key] && hasTrait(s, SKILL_TRAIT[key]!)) m *= 1.3;
  if (studying && hasTrait(s, "bookworm")) m *= 1.25;
  return m;
}

export const SKILL_NAMES: Record<SkillKey, string> = {
  coding: "Coding",
  cooking: "Cooking",
  creativity: "Creativity",
  business: "Business",
  fitness: "Fitness",
  finance: "Money Smarts",
  charisma: "Charisma",
};

export function addSkillXp(s: GameState, key: SkillKey, xp: number) {
  if (xp <= 0) return;
  const before = skillLevel(s.skills[key]);
  s.skills[key] += xp;
  const after = skillLevel(s.skills[key]);
  if (after > before) log(s, "learn", `${SKILL_NAMES[key]} reached level ${after}!`);
}

export const level = (s: GameState, key: SkillKey) => skillLevel(s.skills[key]);

export function ensureRelationship(s: GameState, npcId: string) {
  if (!s.relationships[npcId]) {
    s.relationships[npcId] = { friendship: 0, met: false, lastTalkDay: -99, adviceDay: -99, owes: 0 };
  }
  return s.relationships[npcId];
}

export function addFriendship(s: GameState, npcId: string, amount: number) {
  const r = ensureRelationship(s, npcId);
  const mult = amount > 0 && hasTrait(s, "social") ? 1.25 : 1;
  const before = r.friendship;
  r.friendship = clamp(r.friendship + amount * mult);
  if (before < 80 && r.friendship >= 80) s.stats.friendsMade += 1;
}

export function friendshipTier(f: number): string {
  if (f >= 80) return "Best friend";
  if (f >= 50) return "Friend";
  if (f >= 20) return "Acquaintance";
  return "Stranger";
}

export function pushMessage(s: GameState, msg: Omit<Message, "id" | "t" | "read">) {
  s.logSeq += 1;
  s.messages.unshift({ ...msg, id: `m${s.logSeq}`, t: s.time, read: false });
  if (s.messages.length > 60) s.messages.length = 60;
}

export const home = (s: GameState) => getHome(s.homeId);

/** Grid power at the player's home right now (NEPA). */
export const gridPowerOn = (s: GameState) => s.world.power[hourOf(s.time)] ?? false;

/** Can the player use electric things at home right now, and how? */
export function homePower(s: GameState): "grid" | "solar" | "generator" | "none" {
  if (gridPowerOn(s)) return "grid";
  if (hasItem(s, "solar")) return "solar";
  if (hasItem(s, "generator")) return "generator";
  return "none";
}

// Money sitting in a Ponzi scheme is deliberately not counted: it's gone.
export const investmentsTotal = (s: GameState) =>
  Object.values(s.investments).reduce((a, b) => a + b, 0);

export const debtTotal = (s: GameState) => s.loans.reduce((a, l) => a + l.remaining, 0);

export function netWorth(s: GameState): number {
  const items = s.items.reduce((a, id) => a + (getItem(id)?.price ?? 0) * 0.5, 0);
  const biz = s.businesses.reduce((a, b) => {
    const def = getBusiness(b.id);
    return a + (def ? def.price * (0.6 + 0.3 * (b.level - 1)) : 0);
  }, 0);
  return Math.round(s.cash + s.bank + investmentsTotal(s) + items + biz - debtTotal(s));
}

export const groceryCapacity = (s: GameState) => (hasItem(s, "fridge") ? 12 : 4);
