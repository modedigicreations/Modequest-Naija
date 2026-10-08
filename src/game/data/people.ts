// Lagos residents the player can befriend. When multiplayer arrives, real
// players will appear alongside these NPCs at the same locations.

export interface NpcSchedule {
  days: number[]; // weekdays, 0 = Mon
  from: number; // hour
  to: number; // hour (exclusive)
  at: string; // location id
}

export interface NpcDef {
  id: string;
  name: string;
  emoji: string;
  role: string;
  reliability: number; // chance they repay borrowed money
  schedule: NpcSchedule[];
  greeting: string;
}

const WEEKDAYS = [0, 1, 2, 3, 4];
const ALL = [0, 1, 2, 3, 4, 5, 6];
const WEEKEND = [5, 6];

export const NPCS: NpcDef[] = [
  { id: "tunde", name: "Tunde", emoji: "🧑🏾‍💻", role: "Startup founder", reliability: 0.9, greeting: "Guy! You don dey code? We need devs.", schedule: [{ days: WEEKDAYS, from: 10, to: 19, at: "tech_hub" }, { days: [5], from: 11, to: 15, at: "eko_cafe" }] },
  { id: "chioma", name: "Chioma", emoji: "👩🏾‍🎓", role: "UNILAG student", reliability: 0.85, greeting: "Hey! Exams are next week, I'm dying 😩", schedule: [{ days: WEEKDAYS, from: 9, to: 15, at: "unilag" }, { days: WEEKDAYS, from: 15, to: 19, at: "library" }, { days: [6], from: 13, to: 19, at: "beach" }] },
  { id: "aisha", name: "Aisha", emoji: "🧕🏾", role: "Fashion designer", reliability: 0.8, greeting: "This fabric? Balogun, ₦4k a yard. I haggled o.", schedule: [{ days: [0, 1, 2, 3, 4, 5], from: 9, to: 15, at: "balogun" }, { days: [5], from: 16, to: 21, at: "theatre" }] },
  { id: "emeka", name: "Emeka", emoji: "👨🏾‍🔧", role: "Gadget dealer", reliability: 0.6, greeting: "Original phone, no be china o! Wetin you wan buy?", schedule: [{ days: [0, 1, 2, 3, 4, 5], from: 9, to: 18, at: "computer_village" }] },
  { id: "nkechi", name: "Mama Nkechi", emoji: "👩🏾‍🍳", role: "Buka owner", reliability: 0.95, greeting: "My pikin! Come and chop. You don too lean.", schedule: [{ days: ALL, from: 7, to: 21, at: "amala_spot" }] },
  { id: "bayo", name: "Bayo", emoji: "⚽", role: "Footballer", reliability: 0.5, greeting: "Five-a-side this evening. You dey?", schedule: [{ days: ALL, from: 6, to: 9, at: "stadium" }, { days: ALL, from: 16, to: 20, at: "stadium" }] },
  { id: "funke", name: "Funke", emoji: "👩🏾‍💼", role: "Banker", reliability: 0.95, greeting: "Are you saving at least 20% of your income? Be honest.", schedule: [{ days: WEEKDAYS, from: 8, to: 17, at: "bank_hq" }, { days: [5], from: 10, to: 14, at: "eko_cafe" }] },
  { id: "kunle", name: "Kunle", emoji: "🤳🏾", role: "Content creator", reliability: 0.55, greeting: "Oya smile, you're on my vlog! 📸", schedule: [{ days: WEEKEND, from: 12, to: 21, at: "beach" }, { days: [2, 3, 4], from: 12, to: 19, at: "theatre" }] },
  { id: "zainab", name: "Zainab", emoji: "👩🏾‍⚕️", role: "Nurse", reliability: 0.9, greeting: "Are you drinking enough water? You look tired.", schedule: [{ days: ALL, from: 7, to: 17, at: "hospital" }] },
  { id: "segun", name: "Uncle Segun", emoji: "👴🏾", role: "Retired accountant", reliability: 1, greeting: "Ah, young person! Sit down, let me tell you about compound interest.", schedule: [{ days: [0, 1, 2, 3, 4, 5], from: 9, to: 13, at: "library" }, { days: ALL, from: 17, to: 20, at: "amala_spot" }] },
  { id: "temi", name: "Temi", emoji: "🎸", role: "Musician", reliability: 0.7, greeting: "I just dropped a new song. Rate am 1 to 10.", schedule: [{ days: [3, 4, 5, 6], from: 17, to: 23, at: "theatre" }, { days: [6], from: 12, to: 17, at: "lekki_park" }] },
  { id: "ifeanyi", name: "Ifeanyi", emoji: "📦", role: "Dispatch rider", reliability: 0.75, greeting: "I've crossed Third Mainland four times today. Four!", schedule: [{ days: [0, 1, 2, 3, 4, 5], from: 8, to: 12, at: "computer_village" }, { days: [0, 1, 2, 3, 4, 5], from: 13, to: 17, at: "ikeja_mall" }] },
];

export function npcsAt(locationId: string, weekday: number, hour: number): NpcDef[] {
  return NPCS.filter((n) =>
    n.schedule.some((s) => s.at === locationId && s.days.includes(weekday) && hour >= s.from && hour < s.to),
  );
}

export const getNpc = (id: string) => NPCS.find((n) => n.id === id);

export const INTERACTIONS = {
  gist: { label: "Gist", emoji: "💬", minutes: 20, blurb: "Small talk. Builds friendship." },
  joke: { label: "Crack a joke", emoji: "😂", minutes: 10, blurb: "Charisma check. Big win or awkward silence." },
  advice: { label: "Ask for advice", emoji: "💡", minutes: 15, blurb: "Learn something useful (once a day each)." },
  hangout: { label: "Hang out", emoji: "🎉", minutes: 90, blurb: "Spend real time together. Costs ₦1,500." },
  gift: { label: "Give a gift", emoji: "🎁", minutes: 10, blurb: "₦3,000 gift. Friends appreciate it." },
} as const;

export type InteractionId = keyof typeof INTERACTIONS;

/** Advice is how NPCs teach money and digital-safety lessons in the world. */
export const ADVICE: Record<string, string[]> = {
  tunde: [
    "Build things people actually need. A simple app that solves a real Lagos problem beats a fancy one nobody uses.",
    "Put your projects on GitHub. Employers want proof, not just certificates.",
    "Never share your company's passwords in WhatsApp groups. Use a password manager.",
  ],
  chioma: [
    "I use the 50/30/20 rule: 50% needs, 30% wants, 20% savings. Even on a student allowance.",
    "Two-factor authentication saved my Instagram when someone tried to hack it.",
  ],
  aisha: [
    "At Balogun, never accept the first price. Start at half and meet in the middle.",
    "Separate your business money from your personal money. Different accounts.",
  ],
  emeka: [
    "Always check a phone's IMEI and test the battery before you pay. Fakes dey everywhere.",
    "If a deal is too cheap, ask yourself why.",
  ],
  nkechi: [
    "Cooking at home is half the price of buying food outside every day.",
    "I started this buka with one pot. Start small, reinvest your profit.",
  ],
  bayo: [
    "Exercise isn't only for the body. When I run, my head clears.",
    "Some guys wanted me to 'invest' in a betting syndicate. If they guarantee winnings, it's a scam.",
  ],
  funke: [
    "Your bank will NEVER ask for your PIN, OTP or password by SMS or call. Never.",
    "Interest on loans compounds against you; interest on savings compounds for you. Pick a side.",
    "Keep 3 months of expenses as an emergency fund before you invest in anything risky.",
  ],
  kunle: [
    "Posting every day beats posting perfectly once a month. Consistency is the algorithm.",
    "Don't post your location in real time. Post after you've left.",
  ],
  zainab: [
    "Sleep is free medicine. Seven to eight hours.",
    "A check-up costs less than treatment. Prevention is cheaper than cure.",
  ],
  segun: [
    "₦10,000 saved monthly at 10% for 10 years becomes over ₦2 million. Time is the secret ingredient.",
    "Inflation eats cash under the mattress. Make your money work.",
    "Anyone promising to double your money in weeks is paying old investors with new investors' money. That's a Ponzi scheme.",
  ],
  temi: [
    "Register your songs and keep your contracts. Read before you sign anything.",
    "Multiple income streams: shows, streams, merch, teaching. Never rely on one.",
  ],
  ifeanyi: [
    "Fuel price goes up, everything goes up. Always budget a little extra for transport.",
    "My boss pays me through the bank. Cash is easy to lose, records protect you.",
  ],
};
