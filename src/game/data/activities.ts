import type { Needs, SkillKey, Skills } from "../types";

export interface ActivityDef {
  id: string;
  name: string;
  emoji: string;
  /** Location ids where this is available. "home" = the player's home. */
  at: string[];
  duration: number; // game minutes
  cost?: number; // naira at price index 1
  needs?: Partial<Needs>; // total change over the full duration
  skills?: Partial<Skills>; // total XP over the full duration
  health?: number;
  cashGain?: [number, number]; // random earnings on completion
  /** Earnings scale with this skill's level (freelance, reselling). */
  cashSkill?: SkillKey;
  requires?: {
    item?: string;
    power?: boolean; // needs electricity when done at home
    kitchen?: boolean; // home kitchen or a gas cooker
    groceries?: number;
    skill?: [SkillKey, number];
    minCash?: number;
    weekdays?: number[];
    hours?: [number, number]; // only between these hours
  };
  sleep?: boolean; // energy gain scales with home sleep quality
  bath?: boolean; // hygiene gain scales with home bathroom
  course?: { id: string; sessions: number; cert: string };
  blurb: string;
}

export const ACTIVITIES: ActivityDef[] = [
  // ---------------- Home ----------------
  { id: "sleep", name: "Sleep", emoji: "😴", at: ["home"], duration: 480, needs: { energy: 90, hunger: -12, hygiene: -8 }, sleep: true, health: 6, blurb: "A full night's rest. Bed quality matters." },
  { id: "nap", name: "Quick nap", emoji: "💤", at: ["home"], duration: 120, needs: { energy: 24, hunger: -4 }, sleep: true, blurb: "Recharge a little." },
  { id: "bath", name: "Bath", emoji: "🚿", at: ["home"], duration: 25, needs: { hygiene: 75, fun: 3 }, bath: true, blurb: "Bucket or shower, you go come out fresh." },
  { id: "cook", name: "Cook a pot of jollof", emoji: "🍛", at: ["home"], duration: 50, needs: { hunger: 60, fun: 4 }, skills: { cooking: 12 }, requires: { kitchen: true, groceries: 1 }, blurb: "Uses 1 foodstuff pack. Cheaper than buying food outside." },
  { id: "snack", name: "Bread & tea", emoji: "🍞", at: ["home"], duration: 15, needs: { hunger: 25 }, requires: { groceries: 1 }, blurb: "Uses 1 foodstuff pack. No kitchen needed." },
  { id: "laptop_study", name: "Code on your laptop", emoji: "👨🏾‍💻", at: ["home"], duration: 120, needs: { fun: -6, energy: -8 }, skills: { coding: 22 }, requires: { item: "laptop", power: true }, blurb: "Online tutorials and side projects. Needs light!" },
  { id: "freelance", name: "Freelance gig", emoji: "🧾", at: ["home"], duration: 180, needs: { energy: -14, fun: -8 }, skills: { coding: 12, business: 4 }, cashGain: [2500, 4500], cashSkill: "coding", requires: { item: "laptop", power: true, skill: ["coding", 2] }, blurb: "Build a small website for a client. Pay grows with your coding level." },
  { id: "tv", name: "Watch Nollywood", emoji: "📺", at: ["home"], duration: 90, needs: { fun: 30, energy: -2 }, requires: { item: "tv", power: true }, blurb: "Big drama, bigger plot twists." },
  { id: "skit", name: "Shoot a comedy skit", emoji: "🎬", at: ["home"], duration: 90, needs: { fun: 18, energy: -6 }, skills: { creativity: 14, charisma: 4 }, blurb: "Just you, your phone and a wig." },
  { id: "workout", name: "Home workout", emoji: "🏋🏾", at: ["home"], duration: 45, needs: { energy: -12, hygiene: -15, fun: 4 }, skills: { fitness: 10 }, health: 3, blurb: "Push-ups, squats, burpees." },
  { id: "call_family", name: "Call family", emoji: "📞", at: ["home"], duration: 30, needs: { social: 26, fun: 8 }, blurb: "Mummy will ask if you are eating well." },
  { id: "read_books", name: "Read money books", emoji: "📖", at: ["home"], duration: 60, needs: { fun: -3 }, skills: { finance: 12, business: 4 }, requires: { item: "bookshelf" }, blurb: "Personal finance classics on your shelf." },

  // ---------------- Food & fun ----------------
  { id: "amala", name: "Eat amala & ewedu", emoji: "🍲", at: ["amala_spot"], duration: 35, cost: 1500, needs: { hunger: 60, fun: 5, social: 5 }, blurb: "Hot, filling, legendary." },
  { id: "buka_help", name: "Help out in the kitchen", emoji: "🔪", at: ["amala_spot"], duration: 120, needs: { energy: -10, hygiene: -10 }, skills: { cooking: 14 }, cashGain: [800, 1200], blurb: "Mama Nkechi pays small, but you learn real cooking." },
  { id: "fastfood", name: "Fast-food combo", emoji: "🍔", at: ["ikeja_mall"], duration: 30, cost: 3500, needs: { hunger: 55, fun: 8 }, blurb: "Chicken, rice, a cold drink." },
  { id: "cinema", name: "Watch a movie", emoji: "🎟️", at: ["ikeja_mall"], duration: 150, cost: 4000, needs: { fun: 45, social: 6, energy: -4 }, blurb: "The latest blockbuster in air-con." },
  { id: "freshen", name: "Freshen up", emoji: "🧼", at: ["ikeja_mall", "eko_cafe", "tech_hub"], duration: 10, cost: 200, needs: { hygiene: 22 }, blurb: "Wash face, deodorant, you're fine." },
  { id: "cafe_work", name: "Laptop session with coffee", emoji: "☕", at: ["eko_cafe"], duration: 120, cost: 3000, needs: { fun: 6, energy: -4 }, skills: { coding: 14, business: 8 }, blurb: "Steady power and Wi-Fi. Network with founders." },
  { id: "brunch", name: "Fancy brunch", emoji: "🥞", at: ["eko_cafe"], duration: 60, cost: 6500, needs: { hunger: 50, fun: 15, social: 10 }, blurb: "Instagram-worthy, wallet-unfriendly." },
  { id: "beach_chill", name: "Chill at the beach", emoji: "🌊", at: ["beach"], duration: 120, cost: 1000, needs: { fun: 42, social: 16, energy: -6, hygiene: -10 }, blurb: "Gate fee, then vibes." },
  { id: "suya", name: "Eat suya", emoji: "🍢", at: ["beach", "stadium"], duration: 20, cost: 2000, needs: { hunger: 32, fun: 6 }, blurb: "Spicy yaji, fresh onions." },
  { id: "canopy", name: "Canopy walk", emoji: "🌉", at: ["lekki_park"], duration: 120, cost: 3000, needs: { fun: 40, energy: -10 }, skills: { fitness: 6 }, health: 4, blurb: "Africa's longest canopy walkway. Don't look down." },
  { id: "window_shop", name: "Window-shop", emoji: "👀", at: ["balogun", "ikeja_mall"], duration: 60, needs: { fun: 10, energy: -4 }, blurb: "Looking is free. Buying is another matter." },

  // ---------------- Learning ----------------
  { id: "meetup", name: "Developer meetup", emoji: "🧑🏾‍🤝‍🧑🏽", at: ["tech_hub"], duration: 120, needs: { social: 18, fun: 8, energy: -4 }, skills: { coding: 14, charisma: 4 }, requires: { hours: [16, 22] }, blurb: "Evening talks and free small chops." },
  { id: "cowork", name: "Co-working desk", emoji: "🖥️", at: ["tech_hub"], duration: 180, cost: 1500, needs: { fun: -4, energy: -8 }, skills: { coding: 26 }, blurb: "Day pass with hub computers and generator power." },
  { id: "bootcamp", name: "Coding Bootcamp class", emoji: "🧑🏾‍🏫", at: ["tech_hub"], duration: 180, cost: 6000, needs: { energy: -10, fun: -2 }, skills: { coding: 30 }, course: { id: "bootcamp", sessions: 5, cert: "bootcamp" }, blurb: "5 classes → Coding Bootcamp Certificate." },
  { id: "study_code", name: "Study programming books", emoji: "📘", at: ["library"], duration: 120, needs: { fun: -6, energy: -6 }, skills: { coding: 16 }, blurb: "Free, quiet, steady light." },
  { id: "study_money", name: "Study money & business", emoji: "📗", at: ["library"], duration: 120, needs: { fun: -6, energy: -6 }, skills: { finance: 16, business: 8 }, blurb: "Budgeting, investing and how markets work." },
  { id: "read_fun", name: "Read a novel", emoji: "📕", at: ["library"], duration: 60, needs: { fun: 14 }, skills: { creativity: 4 }, blurb: "Chimamanda, Achebe, or that new sci-fi." },
  { id: "lecture", name: "Free public lecture", emoji: "🎤", at: ["unilag"], duration: 90, needs: { social: 8, energy: -5 }, skills: { finance: 8, business: 8 }, requires: { weekdays: [0, 1, 2, 3, 4], hours: [9, 17] }, blurb: "Visiting speakers on tech, money and Nigeria." },
  { id: "business_diploma", name: "Business Diploma class", emoji: "📈", at: ["unilag"], duration: 180, cost: 8000, needs: { energy: -10 }, skills: { business: 28 }, course: { id: "business_diploma", sessions: 6, cert: "business_diploma" }, blurb: "6 evening classes → Business Diploma." },
  { id: "finance_cert", name: "Finance Certificate class", emoji: "💹", at: ["unilag"], duration: 180, cost: 7000, needs: { energy: -10 }, skills: { finance: 28 }, course: { id: "finance_cert", sessions: 5, cert: "finance_cert" }, blurb: "5 classes → Finance Certificate (banks want it)." },
  { id: "lagoon_front", name: "Hang at the lagoon front", emoji: "🌅", at: ["unilag"], duration: 60, needs: { fun: 16, social: 16 }, blurb: "Breeze, gist and the Third Mainland Bridge view." },
  { id: "seminar", name: "Money-smart seminar", emoji: "🏦", at: ["bank_hq"], duration: 120, needs: { energy: -4, social: 6 }, skills: { finance: 20 }, requires: { weekdays: [0, 2, 4], hours: [10, 16] }, blurb: "Free bank seminar: savings, credit scores, investing." },
  { id: "repair_apprentice", name: "Shadow a phone repairer", emoji: "🔧", at: ["computer_village"], duration: 180, needs: { energy: -10, hygiene: -6 }, skills: { business: 10, coding: 6 }, cashGain: [1500, 2500], blurb: "Learn the trade, earn small." },
  { id: "resell", name: "Buy & resell goods", emoji: "🧮", at: ["balogun", "computer_village"], duration: 180, needs: { energy: -12, hygiene: -8 }, skills: { business: 14, charisma: 4 }, cashGain: [-3000, 5000], cashSkill: "business", requires: { minCash: 10000 }, blurb: "Needs ₦10k float. Profit depends on your business skill — you can lose." },

  // ---------------- Creative & fitness ----------------
  { id: "open_mic", name: "Perform at open mic", emoji: "🎙️", at: ["theatre"], duration: 90, needs: { fun: 22, social: 12, energy: -8 }, skills: { creativity: 16, charisma: 8 }, requires: { hours: [17, 23] }, blurb: "Poetry, comedy, or that song you wrote." },
  { id: "watch_play", name: "Watch a stage play", emoji: "🎭", at: ["theatre"], duration: 120, cost: 2500, needs: { fun: 36 }, skills: { creativity: 6 }, blurb: "Wole Soyinka would be proud." },
  { id: "drama_workshop", name: "Media & Drama workshop", emoji: "🎞️", at: ["theatre"], duration: 180, cost: 5000, needs: { energy: -10, fun: 6 }, skills: { creativity: 26 }, course: { id: "creative_cert", sessions: 4, cert: "creative_cert" }, blurb: "4 sessions → Media Arts Certificate." },
  { id: "jog", name: "Jog the tracks", emoji: "🏃🏾", at: ["stadium"], duration: 60, needs: { energy: -15, hygiene: -22, fun: 6 }, skills: { fitness: 16 }, health: 5, blurb: "Laps with the early-morning crew." },
  { id: "football", name: "Five-a-side football", emoji: "⚽", at: ["stadium"], duration: 90, needs: { energy: -20, hygiene: -26, fun: 28, social: 22 }, skills: { fitness: 14, charisma: 4 }, health: 4, blurb: "Winners stay on." },

  // ---------------- Health & community ----------------
  { id: "checkup", name: "Medical check-up", emoji: "🩺", at: ["hospital"], duration: 60, cost: 5000, health: 45, needs: { fun: -4 }, blurb: "Restores health. Prevention is cheaper than cure." },
  { id: "volunteer", name: "Volunteer at the ward", emoji: "🤝🏾", at: ["hospital"], duration: 180, needs: { energy: -10, social: 18 }, skills: { charisma: 14 }, blurb: "Help patients and nurses. Good for the soul." },
];

export const getActivity = (id: string) => ACTIVITIES.find((a) => a.id === id);
