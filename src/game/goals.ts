import { CAREERS, getCareer } from "./data/economy";
import { debtTotal, investmentsTotal, level, netWorth } from "./helpers";
import { LESSONS } from "./data/lessons";
import { getHome } from "./data/world";
import type { GameState } from "./types";

export interface AchievementDef {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
  check: (s: GameState) => boolean;
}

const bestFriends = (s: GameState) =>
  Object.values(s.relationships).filter((r) => r.friendship >= 80).length;

export const ACHIEVEMENTS: AchievementDef[] = [
  { id: "first_job", name: "First Paycheck", emoji: "💵", blurb: "Complete your first work shift.", check: (s) => s.stats.shiftsWorked >= 1 },
  { id: "promoted", name: "Moving Up", emoji: "📈", blurb: "Get promoted.", check: (s) => (s.career?.level ?? 0) >= 1 },
  { id: "saver", name: "Rainy Day Fund", emoji: "☔", blurb: "Have ₦100,000 in your bank savings.", check: (s) => s.bank >= 100000 },
  { id: "investor", name: "First Investment", emoji: "📊", blurb: "Invest in T-Bills, an index fund or crypto.", check: (s) => investmentsTotal(s) > 0 },
  { id: "scam_shield", name: "Scam Shield", emoji: "🛡️", blurb: "Avoid 5 scams.", check: (s) => s.stats.scamsAvoided >= 5 },
  { id: "padi", name: "Padi for Life", emoji: "🤝🏾", blurb: "Make your first best friend.", check: (s) => bestFriends(s) >= 1 },
  { id: "entrepreneur", name: "Entrepreneur", emoji: "🏪", blurb: "Own a business.", check: (s) => s.businesses.length >= 1 },
  { id: "certified", name: "Certified", emoji: "📜", blurb: "Earn a certificate.", check: (s) => s.certificates.length >= 1 },
  { id: "scholar", name: "Academy Scholar", emoji: "🎓", blurb: "Pass 6 Mode Academy lessons.", check: (s) => Object.values(s.lessons).filter((v) => v >= 60).length >= 6 },
  { id: "coder", name: "Code Wizard", emoji: "🧙🏾", blurb: "Pass all Code Lab puzzles.", check: (s) => LESSONS.filter((l) => l.kind === "code").every((l) => (s.lessons[l.id] ?? 0) >= 60) },
  { id: "light", name: "Let There Be Light", emoji: "🔆", blurb: "Own a generator or solar.", check: (s) => s.items.includes("solar") || s.items.includes("generator") },
  { id: "debt_free", name: "Debt Free", emoji: "🕊️", blurb: "Pay off a loan completely.", check: (s) => (s.flags.loansRepaid ?? 0) >= 1 },
  { id: "half_million", name: "Half a Milli", emoji: "💰", blurb: "Reach ₦500,000 net worth.", check: (s) => netWorth(s) >= 500000 },
  { id: "millionaire", name: "Millionaire", emoji: "🤑", blurb: "Reach ₦1,000,000 net worth.", check: (s) => netWorth(s) >= 1000000 },
  { id: "week4", name: "City Survivor", emoji: "🗓️", blurb: "Survive 4 weeks on your own.", check: (s) => s.time >= 28 * 1440 },
  { id: "fit", name: "Fit Fam", emoji: "💪🏾", blurb: "Reach Fitness level 5.", check: (s) => level(s, "fitness") >= 5 },
];

export interface DreamProgress {
  progress: number; // 0-1
  detail: string;
  done: boolean;
}

export function dreamProgress(s: GameState): DreamProgress {
  switch (s.player.dream) {
    case "oga_top": {
      const lvl = s.career ? s.career.level + 1 : 0;
      const name = s.career ? getCareer(s.career.careerId)?.name : "no career";
      return { progress: lvl / 5, detail: `Career level ${lvl}/5 (${name})`, done: lvl >= 5 };
    }
    case "lekki_landlord": {
      const nw = netWorth(s);
      const lekki = ["luxury", "penthouse"].includes(getHome(s.homeId).tier);
      const p = Math.min(1, Math.max(0, nw) / 10_000_000) * (lekki ? 1 : 0.9);
      return { progress: p, detail: `Net worth ₦${Math.max(0, nw).toLocaleString()} / ₦10M · ${lekki ? "Lives in luxury ✅" : "Needs a luxury home"}`, done: nw >= 10_000_000 && lekki };
    }
    case "yaba_unicorn": {
      const st = s.businesses.find((b) => b.id === "tech_startup");
      const lvl = st?.level ?? 0;
      return { progress: lvl / 4, detail: st ? `Tech Startup level ${lvl}/4` : `Coding ${level(s, "coding")}/5 needed to found a startup`, done: lvl >= 4 };
    }
    case "padi": {
      const n = bestFriends(s);
      return { progress: Math.min(1, n / 5), detail: `${n}/5 best friends`, done: n >= 5 };
    }
    case "smart_money": {
      const pot = Math.max(0, s.bank) + investmentsTotal(s);
      const clean = s.stats.scamsFallen === 0 && debtTotal(s) === 0;
      return { progress: Math.min(1, pot / 2_000_000), detail: `Savings + investments ₦${Math.round(pot).toLocaleString()} / ₦2M · ${clean ? "No debt, never scammed ✅" : "Must be debt-free and never scammed"}`, done: pot >= 2_000_000 && clean };
    }
    case "naija_star": {
      const cr = level(s, "creativity");
      const career = s.career?.careerId === "creative" ? s.career.level + 1 : 0;
      return { progress: (Math.min(cr, 10) / 10) * 0.6 + (Math.min(career, 4) / 4) * 0.4, detail: `Creativity ${cr}/10 · Creative career level ${career}/4`, done: cr >= 10 && career >= 4 };
    }
    default:
      return { progress: 0, detail: "", done: false };
  }
}

export const careerTitle = (s: GameState) => {
  if (!s.career) return "Job seeker";
  const c = CAREERS.find((x) => x.id === s.career!.careerId);
  return c?.levels[s.career.level]?.title ?? "Worker";
};
