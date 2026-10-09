import type { SkillKey } from "../types";
import type { HomeTier, PlaceKind } from "./worldTypes";

// ---------------------------------------------------------------------------
// Items you can buy for your home or yourself.
// ---------------------------------------------------------------------------

export interface ItemDef {
  id: string;
  name: string;
  emoji: string;
  price: number;
  gadget?: boolean; // cheaper at gadget markets, but fakes exist
  blurb: string;
}

export const ITEMS: ItemDef[] = [
  { id: "laptop", name: "Laptop", emoji: "💻", price: 180000, gadget: true, blurb: "Code and freelance from home (needs power)." },
  { id: "tv", name: "Smart TV", emoji: "📺", price: 90000, gadget: true, blurb: "Nollywood nights at home (needs power)." },
  { id: "stove", name: "Kerosene stove", emoji: "🫕", price: 12000, blurb: "Cheap way to cook in a home without a kitchen." },
  { id: "gas_cooker", name: "Gas cooker", emoji: "🔥", price: 45000, blurb: "Cook in any home, even without a kitchen. Cleaner than kerosene." },
  { id: "good_bed", name: "Orthopaedic mattress", emoji: "🛏️", price: 70000, blurb: "+15% energy from sleep." },
  { id: "fridge", name: "Fridge", emoji: "🧊", price: 140000, blurb: "Store up to 24 foodstuffs in your pantry (10 without)." },
  { id: "bookshelf", name: "Money books bookshelf", emoji: "📚", price: 15000, blurb: "Study finance at home." },
  { id: "generator", name: "Generator", emoji: "⛽", price: 110000, blurb: "Power during NEPA outages. Fuel costs ₦700 per hour of use." },
  { id: "solar", name: "Solar + inverter", emoji: "🔆", price: 650000, blurb: "Free, quiet power during outages. Pays for itself over time." },
  { id: "ring_light", name: "Ring light & mic", emoji: "💡", price: 30000, blurb: "+30% creativity from skits." },
  { id: "car", name: "Used Toyota Corolla", emoji: "🚗", price: 3500000, blurb: "Drive yourself. Fuel money still dey." },
];

export const GENERATOR_COST_PER_HOUR = 700;

// ---------------------------------------------------------------------------
// Careers. Each level is a promotion step.
// ---------------------------------------------------------------------------

export interface CareerLevel {
  title: string;
  pay: number; // per shift, at price index 1
  skill: number; // required level of the career's main skill
  cert?: string;
  extra?: [SkillKey, number];
}

export interface CareerDef {
  id: string;
  name: string;
  emoji: string;
  workplace: PlaceKind;
  skill: SkillKey;
  days: number[]; // weekdays
  start: number; // hour
  hours: number;
  levels: CareerLevel[];
  blurb: string;
}

export const CAREERS: CareerDef[] = [
  {
    id: "tech", name: "Tech", emoji: "💻", workplace: "tech_hub", skill: "coding", days: [0, 1, 2, 3, 4], start: 9, hours: 8,
    blurb: "Build apps for Nigerian startups. Slow start, highest ceiling.",
    levels: [
      { title: "Intern Developer", pay: 6000, skill: 0 },
      { title: "Junior Developer", pay: 14000, skill: 2 },
      { title: "Developer", pay: 26000, skill: 4, cert: "bootcamp" },
      { title: "Senior Developer", pay: 45000, skill: 6 },
      { title: "Chief Technology Officer", pay: 90000, skill: 8, extra: ["business", 3] },
    ],
  },
  {
    id: "food", name: "Food", emoji: "🍲", workplace: "buka", skill: "cooking", days: [1, 2, 3, 4, 5, 6], start: 8, hours: 7,
    blurb: "From washing plates at the buka to running a food brand.",
    levels: [
      { title: "Kitchen Helper", pay: 4500, skill: 0 },
      { title: "Cook", pay: 8000, skill: 2 },
      { title: "Head Cook", pay: 14000, skill: 4 },
      { title: "Kitchen Manager", pay: 24000, skill: 6, extra: ["business", 2] },
      { title: "Restaurant Partner", pay: 42000, skill: 8, extra: ["business", 4] },
    ],
  },
  {
    id: "creative", name: "Creative & Media", emoji: "🎬", workplace: "theatre", skill: "creativity", days: [2, 3, 4, 5, 6], start: 12, hours: 7,
    blurb: "Skits, shoots and studio sessions. Talent plus consistency.",
    levels: [
      { title: "Content Assistant", pay: 5000, skill: 0 },
      { title: "Content Creator", pay: 10000, skill: 2 },
      { title: "Video Editor", pay: 18000, skill: 4, cert: "creative_cert" },
      { title: "Creative Director", pay: 34000, skill: 6 },
      { title: "Media Mogul", pay: 72000, skill: 8, extra: ["charisma", 4] },
    ],
  },
  {
    id: "trade", name: "Trade", emoji: "🏬", workplace: "market", skill: "business", days: [0, 1, 2, 3, 4, 5], start: 8, hours: 8,
    blurb: "Learn the market from the inside. Nigerian markets have made many millionaires.",
    levels: [
      { title: "Market Apprentice", pay: 5000, skill: 0 },
      { title: "Sales Rep", pay: 9000, skill: 2 },
      { title: "Shop Manager", pay: 16000, skill: 4 },
      { title: "Distributor", pay: 30000, skill: 6, extra: ["finance", 3] },
      { title: "Merchant Royalty", pay: 62000, skill: 8 },
    ],
  },
  {
    id: "finance", name: "Banking", emoji: "🏦", workplace: "bank", skill: "finance", days: [0, 1, 2, 3, 4], start: 8, hours: 8,
    blurb: "Suits and spreadsheets. Needs money smarts.",
    levels: [
      { title: "Teller Trainee", pay: 7000, skill: 1 },
      { title: "Customer Officer", pay: 13000, skill: 3, cert: "finance_cert" },
      { title: "Financial Analyst", pay: 24000, skill: 5 },
      { title: "Branch Manager", pay: 42000, skill: 7, extra: ["charisma", 4] },
      { title: "Investment Banker", pay: 88000, skill: 9 },
    ],
  },
  {
    id: "logistics", name: "Logistics", emoji: "🛵", workplace: "gadget_market", skill: "fitness", days: [0, 1, 2, 3, 4, 5], start: 9, hours: 7,
    blurb: "Deliver gadgets across the city, then run the fleet.",
    levels: [
      { title: "Dispatch Rider", pay: 5500, skill: 1 },
      { title: "Senior Rider", pay: 9000, skill: 3 },
      { title: "Dispatch Supervisor", pay: 15000, skill: 3, extra: ["business", 3] },
      { title: "Logistics Manager", pay: 28000, skill: 4, extra: ["business", 5] },
      { title: "Fleet Owner", pay: 56000, skill: 4, extra: ["business", 7] },
    ],
  },
  {
    id: "civil", name: "Civil Service", emoji: "🏛️", workplace: "ministry", skill: "finance", days: [0, 1, 2, 3, 4], start: 8, hours: 8,
    blurb: "Serve the public from the Federal Secretariat. Steady pay, steady climb. Abuja only.",
    levels: [
      { title: "Clerical Officer", pay: 6500, skill: 1 },
      { title: "Executive Officer", pay: 12000, skill: 3, cert: "civil_cert" },
      { title: "Senior Executive Officer", pay: 21000, skill: 5 },
      { title: "Assistant Director", pay: 38000, skill: 6, extra: ["charisma", 5] },
      { title: "Director", pay: 70000, skill: 8, extra: ["charisma", 6] },
    ],
  },
  {
    id: "energy", name: "Oil & Gas", emoji: "🛢️", workplace: "industrial", skill: "fitness", days: [0, 1, 2, 3, 4], start: 7, hours: 9,
    blurb: "Field work, workshops and big pay — if you're safety-certified. Port Harcourt only.",
    levels: [
      { title: "Site Helper", pay: 7000, skill: 1 },
      { title: "Field Technician", pay: 16000, skill: 3, cert: "hse_cert" },
      { title: "Senior Technician", pay: 30000, skill: 4, extra: ["coding", 3] },
      { title: "Operations Supervisor", pay: 52000, skill: 5, extra: ["business", 5] },
      { title: "Operations Manager", pay: 95000, skill: 6, extra: ["business", 7] },
    ],
  },
  {
    id: "health", name: "Health", emoji: "🩺", workplace: "hospital", skill: "charisma", days: [0, 2, 4, 5], start: 7, hours: 10,
    blurb: "Care for patients. Long shifts, real impact. Available in every city.",
    levels: [
      { title: "Ward Assistant", pay: 6000, skill: 0 },
      { title: "Nursing Assistant", pay: 13000, skill: 2, cert: "nursing_cert" },
      { title: "Staff Nurse", pay: 22000, skill: 4 },
      { title: "Senior Nurse", pay: 36000, skill: 6, extra: ["finance", 3] },
      { title: "Matron / Ward Manager", pay: 60000, skill: 8, extra: ["business", 4] },
    ],
  },
];

export const WORK_STYLES = {
  steady: { label: "Work steady", emoji: "🙂", perf: 4, pay: 1, needs: { energy: -30, hunger: -22, hygiene: -15, fun: -10, social: 4 }, blurb: "Do your job well." },
  hustle: { label: "Work like jaguda", emoji: "🔥", perf: 8, pay: 1.1, needs: { energy: -45, hunger: -28, hygiene: -22, fun: -18, social: 0 }, blurb: "+10% pay, faster promotion, very tiring." },
  gist: { label: "Gist with colleagues", emoji: "💬", perf: 1, pay: 1, needs: { energy: -25, hunger: -20, hygiene: -14, fun: 6, social: 30 }, blurb: "Great for social, slow for promotion." },
  easy: { label: "Take am easy", emoji: "😌", perf: -3, pay: 0.9, needs: { energy: -16, hunger: -18, hygiene: -12, fun: -2, social: 6 }, blurb: "-10% pay, saves energy, oga is watching." },
} as const;

export const CERTIFICATES: Record<string, string> = {
  bootcamp: "Coding Bootcamp Certificate",
  business_diploma: "Business Diploma",
  finance_cert: "Finance Certificate",
  creative_cert: "Media Arts Certificate",
  hse_cert: "HSE Safety Certificate",
  civil_cert: "Civil Service Exam Pass",
  nursing_cert: "Nursing Assistant Certificate",
};

// ---------------------------------------------------------------------------
// Character creation: backgrounds, traits, dreams.
// ---------------------------------------------------------------------------

export interface BackgroundDef {
  id: string;
  name: string;
  emoji: string;
  cash: number;
  bank: number;
  homeTier: HomeTier;
  prepaidWeeks: number;
  skills: Partial<Record<SkillKey, number>>;
  items: string[];
  loan?: string;
  student?: boolean;
  blurb: string;
}

export const BACKGROUNDS: BackgroundDef[] = [
  { id: "ajebutter", name: "Ajebutter", emoji: "🧈", cash: 20000, bank: 180000, homeTier: "flat", prepaidWeeks: 4, skills: { charisma: 40 }, items: ["tv"], blurb: "Comfortable family, nice flat, money in the bank. But can you hustle?" },
  { id: "hustler", name: "Street Hustler", emoji: "💪🏾", cash: 12000, bank: 0, homeTier: "room", prepaidWeeks: 2, skills: { business: 100, fitness: 40 }, items: [], blurb: "Grew up selling in traffic. Small money, big street sense." },
  { id: "scholar", name: "Scholarship Kid", emoji: "🎓", cash: 8000, bank: 35000, homeTier: "hostel", prepaidWeeks: 4, skills: { coding: 40, finance: 40 }, items: [], student: true, blurb: "Brilliant, broke, and living in a university hostel. Courses cost 30% less." },
  { id: "lapo", name: "Microloan Starter", emoji: "🏧", cash: 10000, bank: 60000, homeTier: "selfcon", prepaidWeeks: 2, skills: {}, items: [], loan: "lapo", blurb: "Started with a ₦60k microloan. A decent self-contain, but the repayments are coming." },
];

export interface TraitDef {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
}

export const TRAITS: TraitDef[] = [
  { id: "hardworking", name: "Hardworking", emoji: "🛠️", blurb: "+30% work performance gains." },
  { id: "bookworm", name: "Bookworm", emoji: "🤓", blurb: "+25% XP from studying and courses." },
  { id: "social", name: "Social Butterfly", emoji: "🦋", blurb: "Social need drains 30% slower; friendships grow faster." },
  { id: "thrifty", name: "Thrifty", emoji: "🪙", blurb: "Pay 10% less for food, fun and shopping." },
  { id: "night_owl", name: "Night Owl", emoji: "🦉", blurb: "Energy drains 15% slower." },
  { id: "foodie", name: "Foodie", emoji: "🌶️", blurb: "+30% cooking XP; meals fill you 15% more." },
  { id: "creative", name: "Creative Soul", emoji: "🎨", blurb: "+30% creativity XP." },
  { id: "athletic", name: "Athletic", emoji: "🏅", blurb: "+30% fitness XP; health recovers faster." },
  { id: "calm", name: "Calm Mind", emoji: "🧘🏾", blurb: "Fun drains 20% slower; low needs hurt health half as much." },
];

export interface DreamDef {
  id: string;
  name: string;
  emoji: string;
  blurb: string;
}

export const DREAMS: DreamDef[] = [
  { id: "oga_top", name: "Oga at the Top", emoji: "👔", blurb: "Reach the top level of any career." },
  { id: "lekki_landlord", name: "Big Landlord", emoji: "🏡", blurb: "₦10M net worth and a luxury home in any city." },
  { id: "yaba_unicorn", name: "Naija Unicorn", emoji: "🦄", blurb: "Grow your own Tech Startup to level 4." },
  { id: "padi", name: "Everybody's Padi", emoji: "🤝🏾", blurb: "Have 5 best friends across Nigeria." },
  { id: "smart_money", name: "Smart Money", emoji: "📈", blurb: "₦2M in savings & investments, no debt, never scammed." },
  { id: "naija_star", name: "Naija Star", emoji: "⭐", blurb: "Max creativity and become Creative Director or higher." },
];

// ---------------------------------------------------------------------------
// Businesses (the ModeQuest tycoon, Naija edition).
// ---------------------------------------------------------------------------

export interface BusinessDef {
  id: string;
  name: string;
  emoji: string;
  price: number;
  weekly: number; // base weekly profit at level 1, price index 1
  skill: SkillKey;
  volatility: number; // 0-1
  requires?: [SkillKey, number];
  blurb: string;
}

// Listed cheapest first.
export const BUSINESSES: BusinessDef[] = ([
  { id: "recharge", name: "Recharge Card & Data Kiosk", emoji: "📶", price: 60000, weekly: 5200, skill: "business", volatility: 0.2, blurb: "Airtime, data and phone charging by the roadside. Tiny but steady." },
  { id: "pure_water", name: "Pure Water Distribution", emoji: "💧", price: 120000, weekly: 10500, skill: "business", volatility: 0.25, blurb: "Buy sachet water by the bag from the factory, supply shops and hawkers." },
  { id: "pos", name: "POS Stand", emoji: "🏧", price: 150000, weekly: 13000, skill: "business", volatility: 0.25, blurb: "Cash withdrawals for the neighbourhood. Steady, small." },
  { id: "mama_put", name: "Mama Put Stall", emoji: "🍛", price: 250000, weekly: 22000, skill: "cooking", volatility: 0.3, blurb: "Rice and stew for workers. Better food, more customers." },
  { id: "tailoring", name: "Tailoring Shop", emoji: "🧵", price: 200000, weekly: 17500, skill: "creativity", volatility: 0.3, blurb: "Native wears, school uniforms and aso-ebi orders. December is madness." },
  { id: "tutorial", name: "Lesson & Tutorial Centre", emoji: "📝", price: 220000, weekly: 19000, skill: "finance", volatility: 0.2, blurb: "WAEC, JAMB and after-school lessons. Results bring referrals." },
  { id: "viewing_centre", name: "Football Viewing Centre", emoji: "📺", price: 280000, weekly: 24000, skill: "charisma", volatility: 0.4, blurb: "Premier League weekends pay the bills. NEPA outages mean diesel costs." },
  { id: "car_wash", name: "Car Wash", emoji: "🚿", price: 300000, weekly: 26000, skill: "fitness", volatility: 0.3, blurb: "Hardworking boys, good soap, busy Saturdays." },
  { id: "keke", name: "Keke Hire Business", emoji: "🛺", price: 350000, weekly: 30000, skill: "business", volatility: 0.35, blurb: "Buy a keke, give it to a driver on hire-purchase. Daily 'delivery' money." },
  { id: "salon", name: "Barbing & Braids Salon", emoji: "💈", price: 380000, weekly: 32000, skill: "creativity", volatility: 0.3, blurb: "Fresh cuts and knotless braids. Creative stylists win." },
  { id: "phone_shop", name: "Phone Accessories Shop", emoji: "🔌", price: 450000, weekly: 40000, skill: "business", volatility: 0.35, blurb: "Chargers, cases and screen guards at the gadget market." },
  { id: "fashion_brand", name: "Made-in-Naija Fashion Brand", emoji: "👞", price: 420000, weekly: 36000, skill: "creativity", volatility: 0.45, requires: ["creativity", 3], blurb: "Your own label of shoes and bags, sold on Instagram and in markets." },
  { id: "poultry", name: "Poultry Farm", emoji: "🐔", price: 500000, weekly: 44000, skill: "business", volatility: 0.55, requires: ["business", 2], blurb: "Eggs and broilers. Good money — until bird flu or feed prices bite." },
  { id: "laundry", name: "Laundry Service", emoji: "🧺", price: 700000, weekly: 58000, skill: "business", volatility: 0.25, requires: ["business", 3], blurb: "Pick-up and delivery. Power costs bite during outages." },
  { id: "tech_startup", name: "Tech Startup", emoji: "🦄", price: 600000, weekly: 26000, skill: "coding", volatility: 0.9, requires: ["coding", 5], blurb: "High risk, high reward. Level 4 = unicorn territory." },
  { id: "bakery", name: "Bakery", emoji: "🥖", price: 900000, weekly: 76000, skill: "cooking", volatility: 0.3, requires: ["cooking", 3], blurb: "Fresh bread every morning for shops and buka. Flour prices decide your profit." },
  { id: "dispatch", name: "Dispatch Bike Company", emoji: "🛵", price: 1000000, weekly: 85000, skill: "business", volatility: 0.35, requires: ["business", 4], blurb: "Riders delivering for online shops and restaurants across town." },
  { id: "print_press", name: "Printing & Branding Press", emoji: "🖨️", price: 1200000, weekly: 100000, skill: "creativity", volatility: 0.3, requires: ["business", 4], blurb: "Banners, flyers, branded shirts — every election and wedding needs you." },
  { id: "solar_co", name: "Solar Installation Co.", emoji: "🔆", price: 1800000, weekly: 160000, skill: "business", volatility: 0.3, requires: ["business", 5], blurb: "Everyone wants light. You sell it." },
  { id: "event_centre", name: "Event Centre", emoji: "🎉", price: 4500000, weekly: 380000, skill: "business", volatility: 0.35, requires: ["business", 7], blurb: "Owambe headquarters. Weekends fully booked." },
  { id: "private_school", name: "Private School", emoji: "🏫", price: 6000000, weekly: 480000, skill: "business", volatility: 0.2, requires: ["business", 8], blurb: "Nursery and primary school. Parents pay termly — if your results are good." },
] as BusinessDef[]).sort((a, b) => a.price - b.price);
export const BUSINESS_MAX_LEVEL = 4;

// ---------------------------------------------------------------------------
// Money products.
// ---------------------------------------------------------------------------

export const SAVINGS_WEEKLY_RATE = 0.0015; // ~8% a year
export const INFLATION_WEEKLY = 0.004; // ~23% a year, like recent Nigerian inflation
export const WAGE_INFLATION_SHARE = 0.6; // wages only partly keep up

export interface InvestmentDef {
  id: string;
  name: string;
  emoji: string;
  mean: number; // weekly return
  sd: number;
  min: number;
  risk: "Low" | "Medium" | "Very high";
  blurb: string;
}

export const INVESTMENTS: InvestmentDef[] = [
  { id: "tbills", name: "Treasury Bills", emoji: "🏛️", mean: 0.0036, sd: 0, min: 10000, risk: "Low", blurb: "Lend to the government. Small, guaranteed return." },
  { id: "index", name: "NGX Index Fund", emoji: "📊", mean: 0.005, sd: 0.03, min: 5000, risk: "Medium", blurb: "Own a slice of Nigeria's biggest companies. Ups and downs, grows long-term." },
  { id: "crypto", name: "Crypto", emoji: "🪙", mean: 0.004, sd: 0.13, min: 2000, risk: "Very high", blurb: "Can double. Can halve. In one week." },
];

export const DIVEST_FEE = 0.01;

export interface LoanDef {
  id: string;
  name: string;
  lender: string;
  principal: number;
  weekly: number;
  weeks: number;
  requiresJobLevel?: number;
  predatory?: boolean;
  blurb: string;
}

export const LOANS: LoanDef[] = [
  { id: "lapo", name: "Microfinance loan", lender: "Esusu Microfinance", principal: 60000, weekly: 12000, weeks: 6, blurb: "Repay ₦72,000 in total (20% interest)." },
  { id: "bank", name: "Personal loan", lender: "Marina Bank", principal: 300000, weekly: 28000, weeks: 12, requiresJobLevel: 2, blurb: "Repay ₦336,000 (12%). Needs a job at level 2+." },
  { id: "quick_cash", name: "QuickCash app loan", lender: "QuickCash", principal: 50000, weekly: 15000, weeks: 5, predatory: true, blurb: "Instant! Repay ₦75,000 (50%!). They harass your contacts if you miss." },
];

export const getItem = (id: string) => ITEMS.find((i) => i.id === id);
export const getCareer = (id: string) => CAREERS.find((c) => c.id === id);
export const getBusiness = (id: string) => BUSINESSES.find((b) => b.id === id);
export const getInvestment = (id: string) => INVESTMENTS.find((i) => i.id === id);
export const getLoanDef = (id: string) => LOANS.find((l) => l.id === id);
export const getBackground = (id: string) => BACKGROUNDS.find((b) => b.id === id)!;
