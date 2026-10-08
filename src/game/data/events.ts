import {
  addFriendship,
  addNeeds,
  addSkillXp,
  bankFrozen,
  charge,
  earn,
  forceCharge,
  level,
  log,
  price,
} from "../helpers";
import type { GameState, Message } from "../types";
import { chance, formatNaira, hourOf, pick, randInt, weekOf, weekdayOf } from "../util";
import { getNpc, NPCS } from "./people";
import { findKind, getLocation } from "./world";

type Data = Record<string, number | string>;

// ---------------------------------------------------------------------------
// DMs (phone Messages app). Scams are the core digital-safety lesson: every
// one has a safe and an unsafe reply, and the outcome explains the red flags.
// ---------------------------------------------------------------------------

export interface MessageChoiceDef {
  id: string;
  label: string;
  resolve: (s: GameState, data: Data) => string;
}

export interface MessageTemplate {
  id: string;
  kind: Message["kind"];
  weight: number;
  condition?: (s: GameState) => boolean;
  /** Which NPC sends it (friend messages); picked at spawn time. */
  pickSender?: (s: GameState) => string | null;
  fromName: (s: GameState, data: Data) => string;
  makeData?: (s: GameState, data: Data) => Data;
  text: (s: GameState, data: Data) => string;
  choices: MessageChoiceDef[];
}

function avoided(s: GameState, lesson: string) {
  s.stats.scamsAvoided += 1;
  addSkillXp(s, "finance", 8);
  log(s, "good", "Scam avoided! +Money Smarts");
  return `✅ Good call. ${lesson}`;
}

function fell(s: GameState, lesson: string) {
  s.stats.scamsFallen += 1;
  return `❌ That was a scam. ${lesson}`;
}

const bestFriendCandidates = (s: GameState, min: number) =>
  NPCS.filter((n) => (s.relationships[n.id]?.friendship ?? 0) >= min).map((n) => n.id);

export const MESSAGE_TEMPLATES: MessageTemplate[] = [
  {
    id: "bvn_phish",
    kind: "scam",
    weight: 3,
    condition: (s) => s.bank > 5000,
    fromName: () => "Marina Bank Support",
    text: () =>
      "Dear Customer, your account will be BLOCKED in 24hrs due to BVN mismatch. Update now: http://marina-bank-verify.ng.co/update and reply with the OTP sent to you. Thank you.",
    choices: [
      {
        id: "send",
        label: "Click the link & send OTP",
        resolve: (s) => {
          const lost = Math.round(Math.max(0, s.bank) * 0.8);
          if (!bankFrozen(s)) {
            s.bank -= lost;
            s.transactions.push({ t: s.time, amount: -lost, label: "Unauthorised transfer", account: "bank" });
          }
          log(s, "bad", `Your bank was emptied: -${formatNaira(lost)}`);
          return fell(s, `They drained ${formatNaira(lost)} from your account. Red flags: urgency ("24hrs"), a strange link (.ng.co is not your bank) and asking for your OTP. Banks NEVER ask for your OTP, PIN or password.`);
        },
      },
      { id: "call", label: "Call the bank's official number", resolve: (s) => avoided(s, "The bank confirmed your account is fine. Always contact your bank through the number on your card or official app — never through links in messages.") },
      { id: "ignore", label: "Delete & block", resolve: (s) => avoided(s, "Fake bank messages use fear and urgency. Your real bank never asks for an OTP or BVN update through a link.") },
    ],
  },
  {
    id: "lottery",
    kind: "scam",
    weight: 2,
    fromName: () => "Naija Mega Promo 🎉",
    makeData: (s) => ({ fee: price(s, 15000, false) }),
    text: (_s, d) =>
      `CONGRATULATIONS!!! Your number has WON ₦5,000,000 in the Naija Mega Promo! To claim, pay a processing fee of ${formatNaira(+d.fee)} to Acct 0123456789 (Promo Claims Ltd). Offer expires today!`,
    choices: [
      {
        id: "pay",
        label: "Pay the fee to claim",
        resolve: (s, d) => {
          if (!charge(s, +d.fee, "'Processing fee'")) return "You couldn't afford the fee anyway. Lucky you — it was a scam. You can't win a promo you never entered.";
          return fell(s, `${formatNaira(+d.fee)} gone, and there was no prize. You can't win a lottery you never entered, and real prizes never ask you to pay to collect.`);
        },
      },
      { id: "ignore", label: "Ignore it", resolve: (s) => avoided(s, "You never entered any promo. 'Pay a fee to receive your prize' is one of the oldest scams.") },
    ],
  },
  {
    id: "job_fee",
    kind: "scam",
    weight: 2,
    condition: (s) => !s.career || s.career.level < 2,
    fromName: () => "Oilfield Careers HR",
    makeData: (s) => ({ fee: price(s, 25000, false) }),
    text: (_s, d) =>
      `Hello! You have been SHORTLISTED for an Offshore Assistant role (₦450,000/month, no experience needed). Pay ${formatNaira(+d.fee)} for registration & medicals to secure your slot. Limited spaces!`,
    choices: [
      {
        id: "pay",
        label: "Pay to secure the job",
        resolve: (s, d) => {
          if (!charge(s, +d.fee, "'Job registration'")) return "You didn't have the money. Good thing: legitimate employers never charge you to get hired.";
          return fell(s, `${formatNaira(+d.fee)} lost. Real employers pay YOU — they never charge application or 'registration' fees. Huge salary + no experience + pay to apply = scam.`);
        },
      },
      { id: "ignore", label: "Report & block", resolve: (s) => avoided(s, "You never applied, the salary is unrealistic and they want money upfront. Classic job scam.") },
    ],
  },
  {
    id: "ponzi",
    kind: "scam",
    weight: 2,
    condition: (s) => !s.ponzi && s.cash + s.bank > 20000,
    fromName: () => "WealthRise Club 💰",
    text: () =>
      "Join 50,000+ Nigerians earning 100% ROI in 14 DAYS! 🚀 Invest any amount, get paid double. Our members already bought cars! Refer friends for bonus. Join now before slots close!",
    choices: [
      {
        id: "invest_small",
        label: "Try it with ₦20,000",
        resolve: (s) => {
          if (!charge(s, 20000, "WealthRise Club 'investment'")) return "You didn't have ₦20,000 free. Probably for the best.";
          s.ponzi = { invested: 20000, week: weekOf(s.time), paidOut: false };
          return "You 'invested' ₦20,000. They say returns come next week... (Watch what happens.)";
        },
      },
      {
        id: "invest_big",
        label: "Go big with ₦100,000",
        resolve: (s) => {
          if (!charge(s, 100000, "WealthRise Club 'investment'")) return "You didn't have ₦100,000 free. Probably for the best.";
          s.ponzi = { invested: 100000, week: weekOf(s.time), paidOut: false };
          return "You 'invested' ₦100,000. They say returns come next week... (Watch what happens.)";
        },
      },
      { id: "ignore", label: "No thanks — sounds like MMM", resolve: (s) => avoided(s, "100% in 14 days is impossible from real business. Early members get paid with new members' money until it collapses. That's a Ponzi scheme.") },
    ],
  },
  {
    id: "mule",
    kind: "scam",
    weight: 1,
    fromName: () => "Big Boi Smally 💎",
    text: () =>
      "Bro/sis, quick money! Some 'clients' abroad will send money to your account, you keep 20% and send me the rest. No stress, I do am every week. Send your account details.",
    choices: [
      {
        id: "accept",
        label: "Send account details",
        resolve: (s) => {
          s.flags.bankFrozenUntil = s.time + 7 * 1440;
          forceCharge(s, price(s, 40000, false), "Lawyer's fee");
          log(s, "bad", "Your bank account is frozen for 7 days by investigators.");
          return fell(s, "The 'clients' were fraud victims. Your account was flagged and frozen for 7 days, and you paid a lawyer to prove you weren't the fraudster. Being a 'money mule' is a crime even if you didn't steal.");
        },
      },
      { id: "refuse", label: "Refuse & block", resolve: (s) => avoided(s, "Letting someone move money through your account makes you a money mule — investigators freeze your account and you can be prosecuted.") },
    ],
  },
  {
    id: "fake_alert",
    kind: "scam",
    weight: 2,
    condition: (s) => s.bank > 30000,
    fromName: () => "+234 811 *** 4410",
    makeData: () => ({ amount: 50000 }),
    text: () =>
      "Good afternoon. Please I mistakenly sent ₦50,000 to your account 🙏 It's my rent money. See the alert screenshot. Kindly refund to 2209876543. God bless you.",
    choices: [
      {
        id: "refund",
        label: "Refund the ₦50,000 now",
        resolve: (s) => {
          if (!charge(s, 50000, "'Refund' to stranger")) return "You didn't have ₦50,000. And when you checked... no money had arrived. It was fake.";
          return fell(s, "No money ever arrived — the 'alert' was a fake screenshot. Always check your actual balance in your bank app, and let the bank handle genuine reversals.");
        },
      },
      { id: "check", label: "Check my bank app first", resolve: (s) => avoided(s, "Your balance hadn't changed — it was a fake credit alert. Screenshots and SMS can be faked; only your bank app is the truth.") },
    ],
  },
  {
    id: "friend_hacked",
    kind: "scam",
    weight: 2,
    condition: (s) => bestFriendCandidates(s, 30).length > 0,
    makeData: (s) => ({ npc: pick(s, bestFriendCandidates(s, 30)) }),
    fromName: (_s, d) => `${getNpc(String(d.npc))?.name ?? "Friend"} (new number)`,
    text: (_s, d) =>
      `Hi, it's ${getNpc(String(d.npc))?.name}. This is my new number, old one got spoilt. Please I'm stranded, send me ₦20,000 urgently, I'll pay back tomorrow. Don't call, I can't talk now 🙏`,
    choices: [
      {
        id: "send",
        label: "Send ₦20,000",
        resolve: (s) => {
          if (!charge(s, 20000, "Transfer to 'friend'")) return "You couldn't afford it. Later you learn the real friend never sent that message.";
          return fell(s, "Your real friend never sent it — scammers copied their name and photo. 'New number + urgent money + don't call' is a big red flag. Always verify by calling the old number or asking a question only they'd know.");
        },
      },
      {
        id: "verify",
        label: "Call their old number to verify",
        resolve: (s, d) => {
          addFriendship(s, String(d.npc), 3);
          return avoided(s, `${getNpc(String(d.npc))?.name} picked up — they never changed numbers. Their account was cloned. Always verify through a channel you already trust.`);
        },
      },
    ],
  },
  {
    id: "giveaway",
    kind: "scam",
    weight: 1,
    fromName: () => "Celebrity Giveaway ✅",
    text: () =>
      "🎁 GIVEAWAY! I'm blessing 100 fans with ₦100,000 each! Send ₦5,000 'activation fee' to confirm you're real, then receive your ₦100k in 5 minutes. Only 7 slots left!!",
    choices: [
      {
        id: "pay",
        label: "Send ₦5,000",
        resolve: (s) => {
          if (!charge(s, 5000, "Giveaway 'activation'")) return "No money to send. That account was fake anyway.";
          return fell(s, "Gone. Fake celebrity accounts use 'activation fees'. If you must pay to receive a gift, it's not a gift.");
        },
      },
      { id: "ignore", label: "Report the account", resolve: (s) => avoided(s, "Real giveaways never ask you to pay. That account was an impersonator.") },
    ],
  },

  {
    id: "scholarship_fee",
    kind: "scam",
    weight: 2,
    fromName: () => "Federal Scholarship Board",
    makeData: (s) => ({ fee: price(s, 12000, false) }),
    text: (_s, d) =>
      `Congratulations! You have been SELECTED for the 2026 Federal Youth Scholarship (₦600,000). Pay ${formatNaira(+d.fee)} processing fee to account 3012345678 (Mrs. Grace Okon) within 48 hours to confirm.`,
    choices: [
      {
        id: "pay",
        label: "Pay the processing fee",
        resolve: (s, d) => {
          if (!charge(s, +d.fee, "'Scholarship processing fee'")) return "You couldn't afford it. Lucky — real scholarships never ask for fees paid to personal accounts.";
          return fell(s, `${formatNaira(+d.fee)} gone. Real scholarships don't charge 'processing fees', and never into a personal account like 'Mrs. Grace Okon'.`);
        },
      },
      { id: "verify", label: "Check the official scholarship website", resolve: (s) => avoided(s, "No such scholarship was listed. Government programmes are announced on official .gov.ng websites, and they don't charge fees into personal accounts.") },
    ],
  },
  {
    id: "nin_update",
    kind: "scam",
    weight: 2,
    fromName: () => "NIMC-Update",
    text: () =>
      "Your NIN will be DEACTIVATED today. Your SIM will be blocked. Re-validate now: http://nimc-ng-verify.top and enter your NIN, date of birth and BVN.",
    choices: [
      {
        id: "enter",
        label: "Enter NIN, birthday and BVN",
        resolve: (s) => {
          const lost = Math.round(Math.max(0, s.bank) * 0.5);
          if (!bankFrozen(s) && lost > 0) {
            s.bank -= lost;
            s.transactions.push({ t: s.time, amount: -lost, label: "Identity theft loss", account: "bank" });
          }
          return fell(s, `With your NIN, birthday and BVN, scammers opened a loan in your name and drained ${formatNaira(lost)}. NIMC doesn't send links like '.top' sites. Verify NIN only through official NIMC offices or apps.`);
        },
      },
      { id: "ignore", label: "Ignore — that's not an official site", resolve: (s) => avoided(s, "'.top' isn't a government domain, and threats of instant blocking are a pressure tactic. Your identity numbers are keys to your money.") },
    ],
  },
  {
    id: "betting_tips",
    kind: "scam",
    weight: 2,
    fromName: () => "SureOdds VIP ⚽",
    makeData: (s) => ({ fee: price(s, 10000, false) }),
    text: (_s, d) =>
      `🔥 100% SURE FIXED MATCHES this weekend! Pay ${formatNaira(+d.fee)} for VIP access and win ₦500,000 guaranteed. Our members are cashing out daily!`,
    choices: [
      {
        id: "pay",
        label: "Pay for VIP fixed odds",
        resolve: (s, d) => {
          if (!charge(s, +d.fee, "'VIP betting tips'")) return "No money to pay — good. 'Fixed matches' sold online are always scams.";
          return fell(s, `${formatNaira(+d.fee)} lost and the 'sure odds' lost too. Nobody sells guaranteed wins — if they had them, they wouldn't need your money. Betting is designed so the house wins.`);
        },
      },
      { id: "ignore", label: "Block — no such thing as sure odds", resolve: (s) => avoided(s, "Guaranteed betting wins don't exist. These groups profit from 'VIP fees', not football.") },
    ],
  },

  // ----------------------------- Friends -----------------------------
  {
    id: "borrow",
    kind: "friend",
    weight: 2,
    pickSender: (s) => {
      const c = bestFriendCandidates(s, 35).filter((id) => (s.relationships[id]?.owes ?? 0) === 0);
      return c.length ? pick(s, c) : null;
    },
    fromName: (_s, d) => getNpc(String(d.npc))?.name ?? "Friend",
    makeData: (s) => ({ amount: pick(s, [5000, 8000, 10000, 15000]) }),
    text: (_s, d) =>
      `Hey 👋🏾 I'm a bit short this week. Abeg, can you lend me ${formatNaira(+d.amount)}? I'll pay back by next week, I promise.`,
    choices: [
      {
        id: "lend",
        label: "Lend the money",
        resolve: (s, d) => {
          const npc = String(d.npc);
          if (!charge(s, +d.amount, `Loan to ${getNpc(npc)?.name}`)) return "You don't have enough to lend right now.";
          s.relationships[npc].owes = +d.amount;
          addFriendship(s, npc, 8);
          return `You lent ${formatNaira(+d.amount)}. Tip: only lend what you can afford to lose — even good friends sometimes can't pay back.`;
        },
      },
      {
        id: "decline",
        label: "Politely decline",
        resolve: (s, d) => {
          addFriendship(s, String(d.npc), -2);
          return "You explained that you're on a tight budget. They understood. Saying no to protect your budget is okay.";
        },
      },
    ],
  },
  {
    id: "hangout_invite",
    kind: "friend",
    weight: 2,
    pickSender: (s) => {
      const c = bestFriendCandidates(s, 25);
      return c.length ? pick(s, c) : null;
    },
    fromName: (_s, d) => getNpc(String(d.npc))?.name ?? "Friend",
    text: () => "Missing you! We should hang out soon. Where you dey this weekend? 😄",
    choices: [
      {
        id: "reply_warm",
        label: "Reply with a long voice note",
        resolve: (s, d) => {
          addFriendship(s, String(d.npc), 5);
          addNeeds(s, { social: 12 });
          return "You caught up properly. Friendship grows when you keep in touch.";
        },
      },
      { id: "reply_short", label: "Reply 'k'", resolve: (s, d) => { addFriendship(s, String(d.npc), -3); return "Ouch. Short replies cool friendships."; } },
    ],
  },

  // ---------------------------- Opportunities ----------------------------
  {
    id: "hackathon",
    kind: "opportunity",
    weight: 1,
    condition: (s) => level(s, "coding") >= 3,
    fromName: (s) => findKind(s.city, "tech_hub")?.name ?? "Tech Hub",
    makeData: (s) => ({ prize: price(s, 150000, false) }),
    text: (_s, d) =>
      `🏆 Weekend Hackathon! Build a solution for city traffic in 24hrs. Prize: ${formatNaira(+d.prize)}. Registration is free. Your coding level will decide your chances.`,
    choices: [
      {
        id: "join",
        label: "Join (costs energy & fun)",
        resolve: (s, d) => {
          addNeeds(s, { energy: -45, fun: 10, social: 20, hunger: -20 });
          addSkillXp(s, "coding", 60);
          const win = chance(s, 0.12 + level(s, "coding") * 0.06);
          if (win) {
            earn(s, +d.prize, "Hackathon prize", "bank");
            log(s, "money", `You won the hackathon! +${formatNaira(+d.prize)}`);
            return `🏆 Your team WON! ${formatNaira(+d.prize)} paid to your bank, plus serious coding XP.`;
          }
          return "You didn't win this time, but you shipped a real project and leveled up your coding.";
        },
      },
      { id: "skip", label: "Not this time", resolve: () => "Maybe next time." },
    ],
  },
];

// ---------------------------------------------------------------------------
// Pop-up events that need an immediate decision.
// ---------------------------------------------------------------------------

export interface EventDef {
  id: string;
  title: string;
  emoji: string;
  /** Hourly chance when its condition holds. */
  chance: number;
  condition: (s: GameState) => boolean;
  makeData?: (s: GameState) => Data;
  text: (s: GameState, data: Data) => string;
  choices: { id: string; label: string; resolve: (s: GameState, data: Data) => string }[];
}

export const EVENTS: EventDef[] = [
  {
    id: "pickpocket",
    title: "Pickpocket!",
    emoji: "🫳🏾",
    chance: 0.25,
    condition: (s) => !s.travel && (getLocation(s.location)?.kinds.includes("market") ?? false) && s.cash > 15000,
    makeData: (s) => ({ lost: Math.round(s.cash * (0.3 + 0.3 * (randInt(s, 0, 10) / 10))) }),
    text: (_s, d) =>
      `In the market crowd, someone slipped a hand into your pocket. ${formatNaira(+d.lost)} cash is gone.`,
    choices: [
      {
        id: "ok",
        label: "Lesson learnt",
        resolve: (s, d) => {
          const lost = Math.min(Math.max(0, s.cash), +d.lost);
          s.cash -= lost;
          s.transactions.push({ t: s.time, amount: -lost, label: "Pickpocketed", account: "cash" });
          return "Carry only the cash you need in crowded markets. Keep the rest in the bank and pay by transfer.";
        },
      },
    ],
  },
  {
    id: "nepa_bill",
    title: "NEPA bill at the door",
    emoji: "🧾",
    chance: 0.01,
    condition: (s) => !s.travel && s.location === "home" && !s.flags.prepaidMeter && s.homeId !== "uncle_couch",
    makeData: (s) => ({ bill: price(s, 9000, false) }),
    text: (_s, d) =>
      `An electricity officer brings an 'estimated' bill of ${formatNaira(+d.bill)} — even though light barely came this month.`,
    choices: [
      { id: "pay", label: "Just pay it", resolve: (s, d) => { forceCharge(s, +d.bill, "Estimated electricity bill"); return "Paid. Estimated billing often overcharges — a prepaid meter means you only pay for what you use."; } },
      {
        id: "meter",
        label: "Apply for a prepaid meter (₦30,000)",
        resolve: (s) => {
          if (!charge(s, price(s, 30000, false), "Prepaid meter")) return "You can't afford the meter yet. You paid nothing today, but they'll be back.";
          s.flags.prepaidMeter = 1;
          addSkillXp(s, "finance", 10);
          return "Meter installed! No more estimated bills. Paying more now to save over time is smart financial planning.";
        },
      },
      {
        id: "argue",
        label: "Dispute it (charisma)",
        resolve: (s, d) => {
          if (chance(s, 0.25 + level(s, "charisma") * 0.08)) {
            addSkillXp(s, "charisma", 8);
            return "You calmly showed that light barely came. The officer waived the bill. Knowing your rights pays.";
          }
          forceCharge(s, +d.bill, "Estimated electricity bill");
          return "They didn't budge. You paid anyway.";
        },
      },
    ],
  },
  {
    id: "found_wallet",
    title: "A dropped wallet",
    emoji: "👛",
    chance: 0.012,
    condition: (s) => !s.travel && s.location !== "home",
    text: () => "You find a wallet on the ground with ₦20,000 and an ID card. Nobody saw you pick it up.",
    choices: [
      {
        id: "return",
        label: "Return it to the owner",
        resolve: (s) => {
          addSkillXp(s, "charisma", 15);
          addNeeds(s, { fun: 10, social: 10 });
          s.flags.integrity = (s.flags.integrity ?? 0) + 1;
          if (chance(s, 0.5)) {
            earn(s, 10000, "Reward for returning wallet");
            return "The owner was so grateful they gave you ₦10,000 as thanks. Integrity is its own reward — sometimes literally.";
          }
          return "The owner thanked you with tears in their eyes. You feel great.";
        },
      },
      {
        id: "keep",
        label: "Keep the money",
        resolve: (s) => {
          earn(s, 20000, "Kept wallet money");
          addNeeds(s, { fun: -15 });
          return "You're ₦20,000 richer, but it doesn't sit right. That might have been someone's rent.";
        },
      },
    ],
  },
  {
    id: "family_request",
    title: "Family calls",
    emoji: "👨‍👩‍👧",
    chance: 0.006,
    condition: (s) => !s.travel && s.cash + s.bank > 40000,
    makeData: (s) => ({ amount: price(s, 15000, false) }),
    text: (_s, d) =>
      `Your younger sibling's school fees are short by ${formatNaira(+d.amount)}. Mummy asks if you can help.`,
    choices: [
      {
        id: "help",
        label: "Send the money",
        resolve: (s, d) => {
          forceCharge(s, +d.amount, "School fees for sibling");
          addNeeds(s, { social: 20, fun: 10 });
          return "Your family is proud of you. This is why an emergency fund matters — life happens.";
        },
      },
      { id: "explain", label: "Explain you can't right now", resolve: (s) => { addNeeds(s, { social: -10 }); return "They understood, though it hurt. Budgeting for 'family support' helps you say yes when it matters."; } },
    ],
  },
  {
    id: "flood",
    title: "Flood!",
    emoji: "🌊",
    chance: 0.08,
    condition: (s) => s.world.weather === "storm" && !s.travel && s.location !== "home",
    text: () => "Heavy rain has flooded the road. Your shoes and clothes are soaked.",
    choices: [
      { id: "ok", label: "Wade through", resolve: (s) => { addNeeds(s, { hygiene: -30, fun: -10 }); return "Nigerian cities and flooding — on storm days, travel takes much longer. Plan ahead."; } },
    ],
  },
  {
    id: "birthday",
    title: "Birthday party",
    emoji: "🎂",
    chance: 0.01,
    condition: (s) => !s.travel && !s.activity && hourOf(s.time) >= 15 && hourOf(s.time) <= 19 && bestFriendCandidates(s, 40).length > 0,
    makeData: (s) => ({ npc: pick(s, bestFriendCandidates(s, 40)) }),
    text: (_s, d) => `It's ${getNpc(String(d.npc))?.name}'s birthday! They're having a small party tonight.`,
    choices: [
      {
        id: "go",
        label: "Go with a ₦3,000 gift",
        resolve: (s, d) => {
          if (!charge(s, price(s, 3000), "Birthday gift")) return "You couldn't afford a gift, so you sent warm wishes instead.";
          addFriendship(s, String(d.npc), 15);
          addNeeds(s, { fun: 35, social: 40, hunger: 30, energy: -15 });
          return "Jollof, music and dancing. Your friendship grew a lot.";
        },
      },
      { id: "text", label: "Send a birthday message", resolve: (s, d) => { addFriendship(s, String(d.npc), 3); return "They appreciated it."; } },
    ],
  },
  {
    id: "harmattan",
    title: "Harmattan haze",
    emoji: "🌫️",
    chance: 0.02,
    condition: (s) => (s.city === "abuja" || s.city === "enugu") && !s.travel && s.location !== "home",
    text: () => "Dry, dusty harmattan wind is blowing from the Sahara. Your lips are cracking and the air is hazy.",
    choices: [
      { id: "mask", label: "Buy a face mask & lip balm (₦800)", resolve: (s) => { if (charge(s, price(s, 800), "Mask & lip balm")) { addNeeds(s, { hygiene: -5 }); return "Protected. Harmattan dust can trigger asthma and catarrh — cover up and drink water."; } addNeeds(s, { hygiene: -15 }); s.health = Math.max(0, s.health - 5); return "Couldn't afford it. The dust got to you a bit."; } },
      { id: "ignore", label: "Ignore it", resolve: (s) => { addNeeds(s, { hygiene: -15 }); s.health = Math.max(0, s.health - 5); return "You're dusty and coughing. In harmattan season, cover your nose and stay hydrated."; } },
    ],
  },
  {
    id: "soot",
    title: "Black soot",
    emoji: "🖤",
    chance: 0.015,
    condition: (s) => s.city === "portharcourt" && !s.travel,
    text: () => "You wipe your face and the tissue comes away black. Soot from illegal oil refining ('kpofire') is in the air again.",
    choices: [
      { id: "ok", label: "Wash up and stay indoors more", resolve: (s) => { addNeeds(s, { hygiene: -20 }); s.health = Math.max(0, s.health - 4); addSkillXp(s, "finance", 3); return "Air pollution affects lungs and health. Environmental choices — like illegal refining — have real costs for everyone. A check-up is wise if you're coughing."; } },
    ],
  },
  {
    id: "masquerade",
    title: "Masquerade festival!",
    emoji: "🎭",
    chance: 0.03,
    condition: (s) => s.city === "enugu" && weekdayOf(s.time) >= 5 && hourOf(s.time) >= 11 && hourOf(s.time) <= 17 && !s.travel && !s.activity && s.location !== "home",
    text: () => "Drums! A colourful mmanwu masquerade procession is passing through the street.",
    choices: [
      { id: "watch", label: "Watch and dance along", resolve: (s) => { addNeeds(s, { fun: 30, social: 20, energy: -8 }); addSkillXp(s, "creativity", 10); return "Culture is alive! Masquerades carry centuries of Igbo history and art."; } },
      { id: "skip", label: "Keep moving", resolve: () => "Maybe next time." },
    ],
  },
  {
    id: "owambe",
    title: "Owambe invitation",
    emoji: "👗",
    chance: 0.01,
    condition: (s) => s.city === "lagos" && !s.travel && weekdayOf(s.time) <= 4,
    makeData: (s) => ({ asoebi: price(s, 25000) }),
    text: (_s, d) => `Your cousin's wedding is this Saturday. The family asks everyone to buy the aso-ebi fabric for ${formatNaira(+d.asoebi)}.`,
    choices: [
      { id: "buy", label: "Buy the aso-ebi", resolve: (s, d) => { if (!charge(s, +d.asoebi, "Aso-ebi fabric")) return "You couldn't afford it — and that's okay. Family will understand."; addNeeds(s, { social: 30, fun: 25 }); return "You'll look great! But that was a WANT, not a need. Budget for family events so they don't wreck your rent."; } },
      { id: "plain", label: "Attend in your best clothes instead", resolve: (s) => { addNeeds(s, { social: 18, fun: 18 }); addSkillXp(s, "finance", 6); return "You still showed up and celebrated. Love isn't measured in fabric. Smart budgeting!"; } },
    ],
  },
  {
    id: "exam_leak",
    title: "'Expo' for sale",
    emoji: "📄",
    chance: 0.01,
    condition: (s) => !!s.flags.student && !s.travel,
    makeData: (s) => ({ cost: price(s, 8000) }),
    text: (_s, d) => `Someone in your class is selling 'leaked' exam answers for ${formatNaira(+d.cost)}. "Everybody is buying," they say.`,
    choices: [
      { id: "refuse", label: "Refuse and study properly", resolve: (s) => { addSkillXp(s, "finance", 6); addSkillXp(s, "charisma", 6); s.flags.integrity = (s.flags.integrity ?? 0) + 1; return "Good choice. The 'expo' was fake anyway, and exam malpractice can get you expelled. Real skills last."; } },
      { id: "buy", label: "Buy the answers", resolve: (s, d) => { if (!charge(s, +d.cost, "'Exam expo'")) return "You couldn't afford it — lucky escape."; s.stats.scamsFallen += 1; addNeeds(s, { fun: -20 }); return "The answers were fake, you wasted money, and you were nearly caught. Exam malpractice can mean expulsion and a criminal record."; } },
    ],
  },
];

/** Daily-ish scam/friend message spawn chance per game hour. */
export const MESSAGE_CHANCE_PER_HOUR = 0.035;
