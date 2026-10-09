import type { Needs, SkillKey, Skills } from "../types";
import type { PlaceKind } from "./worldTypes";
import { getCity } from "./world";

export interface ActivityDef {
  id: string;
  name: string;
  emoji: string;
  /** Place kinds where this is available. "home" = the player's home. */
  at: (PlaceKind | "home")[];
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
    kitchen?: boolean; // home kitchen, gas cooker or stove
    /** Pantry foodstuffs used up (one unit of each). */
    food?: string[];
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
  { id: "cook", name: "Cook jollof rice", emoji: "🍛", at: ["home"], duration: 50, needs: { hunger: 60, fun: 4 }, skills: { cooking: 12 }, requires: { kitchen: true, food: ["rice", "tomato_pepper"] }, blurb: "Rice + tomato & pepper mix. Much cheaper than eating out." },
  { id: "cook_beans", name: "Cook beans & dodo", emoji: "🫘", at: ["home"], duration: 70, needs: { hunger: 68, fun: 4 }, skills: { cooking: 14 }, health: 2, requires: { kitchen: true, food: ["beans", "plantain"] }, blurb: "Beans + plantain. Filling and good for you." },
  { id: "cook_yam", name: "Cook yam & egg sauce", emoji: "🍠", at: ["home"], duration: 40, needs: { hunger: 58, fun: 3 }, skills: { cooking: 10 }, requires: { kitchen: true, food: ["yam", "eggs"] }, blurb: "Yam + eggs. A classic breakfast." },
  { id: "cook_egusi", name: "Cook egusi soup & eba", emoji: "🥬", at: ["home"], duration: 80, needs: { hunger: 72, fun: 6, social: 3 }, skills: { cooking: 18 }, requires: { kitchen: true, food: ["soup_pack", "garri"] }, blurb: "Egusi soup pack + garri. Big pot, big cooking XP." },
  { id: "cook_noodles", name: "Noodles & egg", emoji: "🍜", at: ["home"], duration: 15, needs: { hunger: 40 }, skills: { cooking: 3 }, requires: { kitchen: true, food: ["noodles", "eggs"] }, blurb: "Noodles + eggs. Fast when you're tired." },
  { id: "snack", name: "Bread & tea", emoji: "🍞", at: ["home"], duration: 15, needs: { hunger: 25 }, requires: { food: ["bread"] }, blurb: "Bread. No cooking needed." },
  { id: "soak_garri", name: "Soak garri", emoji: "🥣", at: ["home"], duration: 10, needs: { hunger: 22, fun: 2 }, requires: { food: ["garri"] }, blurb: "Garri, cold water, sugar and groundnut. Student classic — no cooking." },
  { id: "laptop_study", name: "Code on your laptop", emoji: "👨🏾‍💻", at: ["home"], duration: 120, needs: { fun: -6, energy: -8 }, skills: { coding: 22 }, requires: { item: "laptop", power: true }, blurb: "Online tutorials and side projects. Needs light!" },
  { id: "freelance", name: "Freelance gig", emoji: "🧾", at: ["home"], duration: 180, needs: { energy: -14, fun: -8 }, skills: { coding: 12, business: 4 }, cashGain: [2500, 4500], cashSkill: "coding", requires: { item: "laptop", power: true, skill: ["coding", 2] }, blurb: "Build a small website for a client. Pay grows with your coding level." },
  { id: "tv", name: "Watch Nollywood", emoji: "📺", at: ["home"], duration: 90, needs: { fun: 30, energy: -2 }, requires: { item: "tv", power: true }, blurb: "Big drama, bigger plot twists." },
  { id: "skit", name: "Shoot a comedy skit", emoji: "🎬", at: ["home"], duration: 90, needs: { fun: 18, energy: -6 }, skills: { creativity: 14, charisma: 4 }, blurb: "Just you, your phone and a wig." },
  { id: "workout", name: "Home workout", emoji: "🏋🏾", at: ["home"], duration: 45, needs: { energy: -12, hygiene: -15, fun: 4 }, skills: { fitness: 10 }, health: 3, blurb: "Push-ups, squats, burpees." },
  { id: "call_family", name: "Call family", emoji: "📞", at: ["home"], duration: 30, needs: { social: 26, fun: 8 }, blurb: "Mummy will ask if you are eating well." },
  { id: "read_books", name: "Read money books", emoji: "📖", at: ["home"], duration: 60, needs: { fun: -3 }, skills: { finance: 12, business: 4 }, requires: { item: "bookshelf" }, blurb: "Personal finance classics on your shelf." },

  // ---------------- Food & fun ----------------
  { id: "amala", name: "Eat at the buka", emoji: "🍲", at: ["buka"], duration: 35, cost: 1500, needs: { hunger: 60, fun: 5, social: 5 }, blurb: "Local food, hot and filling." },
  { id: "buka_help", name: "Help out in the kitchen", emoji: "🔪", at: ["buka"], duration: 120, needs: { energy: -10, hygiene: -10 }, skills: { cooking: 14 }, cashGain: [800, 1200], blurb: "The buka owner pays small, but you learn real cooking." },
  { id: "fastfood", name: "Fast-food combo", emoji: "🍔", at: ["mall"], duration: 30, cost: 3500, needs: { hunger: 55, fun: 8 }, blurb: "Chicken, rice, a cold drink." },
  { id: "cinema", name: "Watch a movie", emoji: "🎟️", at: ["mall"], duration: 150, cost: 4000, needs: { fun: 45, social: 6, energy: -4 }, blurb: "The latest blockbuster in air-con." },
  { id: "freshen", name: "Freshen up", emoji: "🧼", at: ["mall", "cafe", "tech_hub", "airport"], duration: 10, cost: 200, needs: { hygiene: 22 }, blurb: "Wash face, deodorant, you're fine." },
  { id: "cafe_work", name: "Laptop session with coffee", emoji: "☕", at: ["cafe"], duration: 120, cost: 3000, needs: { fun: 6, energy: -4 }, skills: { coding: 14, business: 8 }, blurb: "Steady power and Wi-Fi. Network with founders." },
  { id: "brunch", name: "Fancy brunch", emoji: "🥞", at: ["cafe"], duration: 60, cost: 6500, needs: { hunger: 50, fun: 15, social: 10 }, blurb: "Instagram-worthy, wallet-unfriendly." },
  { id: "beach_chill", name: "Chill at the beach", emoji: "🌊", at: ["beach"], duration: 120, cost: 1000, needs: { fun: 42, social: 16, energy: -6, hygiene: -10 }, blurb: "Gate fee, then vibes." },
  { id: "suya", name: "Eat suya", emoji: "🍢", at: ["beach", "stadium", "lake", "waterfront"], duration: 20, cost: 2000, needs: { hunger: 32, fun: 6 }, blurb: "Spicy yaji, fresh onions." },
  { id: "canopy", name: "Nature walk", emoji: "🌿", at: ["park"], duration: 120, cost: 3000, needs: { fun: 40, energy: -10 }, skills: { fitness: 6 }, health: 4, blurb: "Fresh air, trees and a break from the city." },
  { id: "window_shop", name: "Window-shop", emoji: "👀", at: ["market", "mall"], duration: 60, needs: { fun: 10, energy: -4 }, blurb: "Looking is free. Buying is another matter." },

  // ---------------- Learning ----------------
  { id: "meetup", name: "Developer meetup", emoji: "🧑🏾‍🤝‍🧑🏽", at: ["tech_hub"], duration: 120, needs: { social: 18, fun: 8, energy: -4 }, skills: { coding: 14, charisma: 4 }, requires: { hours: [16, 22] }, blurb: "Evening talks and free small chops." },
  { id: "cowork", name: "Co-working desk", emoji: "🖥️", at: ["tech_hub"], duration: 180, cost: 1500, needs: { fun: -4, energy: -8 }, skills: { coding: 26 }, blurb: "Day pass with hub computers and generator power." },
  { id: "bootcamp", name: "Coding Bootcamp class", emoji: "🧑🏾‍🏫", at: ["tech_hub"], duration: 180, cost: 6000, needs: { energy: -10, fun: -2 }, skills: { coding: 30 }, course: { id: "bootcamp", sessions: 5, cert: "bootcamp" }, blurb: "5 classes → Coding Bootcamp Certificate." },
  { id: "study_code", name: "Study programming books", emoji: "📘", at: ["library"], duration: 120, needs: { fun: -6, energy: -6 }, skills: { coding: 16 }, blurb: "Free, quiet, steady light." },
  { id: "study_money", name: "Study money & business", emoji: "📗", at: ["library"], duration: 120, needs: { fun: -6, energy: -6 }, skills: { finance: 16, business: 8 }, blurb: "Budgeting, investing and how markets work." },
  { id: "read_fun", name: "Read a novel", emoji: "📕", at: ["library"], duration: 60, needs: { fun: 14 }, skills: { creativity: 4 }, blurb: "Chimamanda, Achebe, or that new sci-fi." },
  { id: "lecture", name: "Free public lecture", emoji: "🎤", at: ["university"], duration: 90, needs: { social: 8, energy: -5 }, skills: { finance: 8, business: 8 }, requires: { weekdays: [0, 1, 2, 3, 4], hours: [9, 17] }, blurb: "Visiting speakers on tech, money and Nigeria." },
  { id: "business_diploma", name: "Business Diploma class", emoji: "📈", at: ["university"], duration: 180, cost: 8000, needs: { energy: -10 }, skills: { business: 28 }, course: { id: "business_diploma", sessions: 6, cert: "business_diploma" }, blurb: "6 evening classes → Business Diploma." },
  { id: "finance_cert", name: "Finance Certificate class", emoji: "💹", at: ["university"], duration: 180, cost: 7000, needs: { energy: -10 }, skills: { finance: 28 }, course: { id: "finance_cert", sessions: 5, cert: "finance_cert" }, blurb: "5 classes → Finance Certificate (banks want it)." },
  { id: "lagoon_front", name: "Hang out on campus", emoji: "🌅", at: ["university"], duration: 60, needs: { fun: 16, social: 16 }, blurb: "Breeze, gist and new friends." },
  { id: "seminar", name: "Money-smart seminar", emoji: "🏦", at: ["bank"], duration: 120, needs: { energy: -4, social: 6 }, skills: { finance: 20 }, requires: { weekdays: [0, 2, 4], hours: [10, 16] }, blurb: "Free bank seminar: savings, credit scores, investing." },
  { id: "repair_apprentice", name: "Shadow a phone repairer", emoji: "🔧", at: ["gadget_market"], duration: 180, needs: { energy: -10, hygiene: -6 }, skills: { business: 10, coding: 6 }, cashGain: [1500, 2500], blurb: "Learn the trade, earn small." },
  { id: "resell", name: "Buy & resell goods", emoji: "🧮", at: ["market"], duration: 180, needs: { energy: -12, hygiene: -8 }, skills: { business: 14, charisma: 4 }, cashGain: [-3000, 5000], cashSkill: "business", requires: { minCash: 10000 }, blurb: "Needs ₦10k float. Profit depends on your business skill — you can lose." },

  // ---------------- Creative & fitness ----------------
  { id: "open_mic", name: "Perform at open mic", emoji: "🎙️", at: ["theatre"], duration: 90, needs: { fun: 22, social: 12, energy: -8 }, skills: { creativity: 16, charisma: 8 }, requires: { hours: [17, 23] }, blurb: "Poetry, comedy, or that song you wrote." },
  { id: "watch_play", name: "Watch a stage play", emoji: "🎭", at: ["theatre"], duration: 120, cost: 2500, needs: { fun: 36 }, skills: { creativity: 6 }, blurb: "Wole Soyinka would be proud." },
  { id: "drama_workshop", name: "Media & Drama workshop", emoji: "🎞️", at: ["theatre"], duration: 180, cost: 5000, needs: { energy: -10, fun: 6 }, skills: { creativity: 26 }, course: { id: "creative_cert", sessions: 4, cert: "creative_cert" }, blurb: "4 sessions → Media Arts Certificate." },
  { id: "jog", name: "Jog the tracks", emoji: "🏃🏾", at: ["stadium"], duration: 60, needs: { energy: -15, hygiene: -22, fun: 6 }, skills: { fitness: 16 }, health: 5, blurb: "Laps with the early-morning crew." },
  { id: "football", name: "Five-a-side football", emoji: "⚽", at: ["stadium"], duration: 90, needs: { energy: -20, hygiene: -26, fun: 28, social: 22 }, skills: { fitness: 14, charisma: 4 }, health: 4, blurb: "Winners stay on." },

  // ---------------- Health & community ----------------
  { id: "checkup", name: "Medical check-up", emoji: "🩺", at: ["hospital"], duration: 60, cost: 5000, health: 45, needs: { fun: -4 }, blurb: "Restores health. Prevention is cheaper than cure." },
  { id: "volunteer", name: "Volunteer at the ward", emoji: "🤝🏾", at: ["hospital"], duration: 180, needs: { energy: -10, social: 18 }, skills: { charisma: 14 }, blurb: "Help patients and nurses. Good for the soul." },

  // ---------------- City-specific places ----------------
  { id: "boat_ride", name: "Paddle-boat ride", emoji: "🛶", at: ["lake"], duration: 90, cost: 2500, needs: { fun: 40, social: 8, energy: -6 }, blurb: "Paddle across the lake. Great for a date with friends." },
  { id: "lake_jog", name: "Lakeside jog", emoji: "🏃🏾", at: ["lake"], duration: 60, needs: { energy: -14, hygiene: -20, fun: 10 }, skills: { fitness: 15 }, health: 5, blurb: "A cool breeze makes the laps easier." },
  { id: "watch_boats", name: "Watch the boats come in", emoji: "⛴️", at: ["waterfront"], duration: 60, needs: { fun: 18, social: 6 }, blurb: "Free entertainment with a river breeze." },
  { id: "fishing_help", name: "Help the fishermen", emoji: "🎣", at: ["waterfront"], duration: 180, needs: { energy: -14, hygiene: -18, fun: 4 }, skills: { cooking: 8, fitness: 8 }, cashGain: [1200, 2200], blurb: "Haul nets, sort the catch, earn small." },
  { id: "hse_course", name: "HSE Safety Training", emoji: "🦺", at: ["industrial"], duration: 180, cost: 8000, needs: { energy: -10 }, skills: { business: 10, fitness: 8 }, course: { id: "hse_cert", sessions: 4, cert: "hse_cert" }, blurb: "4 sessions → HSE Certificate (needed for energy jobs)." },
  { id: "site_tour", name: "Industrial site tour", emoji: "🏭", at: ["industrial"], duration: 120, needs: { energy: -6, fun: 6 }, skills: { business: 8, coding: 6 }, requires: { weekdays: [0, 1, 2, 3, 4], hours: [9, 16] }, blurb: "See how pipelines, generators and workshops really work." },
  { id: "public_hearing", name: "Attend a public hearing", emoji: "🗣️", at: ["ministry"], duration: 120, needs: { social: 10, energy: -6 }, skills: { charisma: 12, finance: 8 }, requires: { weekdays: [2], hours: [10, 15] }, blurb: "Citizens question officials about budgets and projects. Civics in action." },
  { id: "civil_prep", name: "Civil Service Exam Prep", emoji: "📝", at: ["ministry", "library"], duration: 150, cost: 4000, needs: { energy: -8, fun: -6 }, skills: { finance: 14, charisma: 8 }, course: { id: "civil_cert", sessions: 4, cert: "civil_cert" }, blurb: "4 sessions → Civil Service Exam Pass." },
  { id: "nursing_course", name: "Nursing Assistant course", emoji: "🩹", at: ["hospital"], duration: 180, cost: 7000, needs: { energy: -10 }, skills: { charisma: 16, fitness: 6 }, course: { id: "nursing_cert", sessions: 5, cert: "nursing_cert" }, blurb: "5 classes → Nursing Assistant Certificate." },
  { id: "guest_house", name: "Sleep at a guest house", emoji: "🛏️", at: ["motor_park", "airport"], duration: 480, cost: 6000, needs: { energy: 80, hunger: -12, hygiene: 20 }, sleep: true, health: 4, blurb: "Away from home? A clean bed for the night." },
  { id: "waiting_snack", name: "Grab a snack in the park", emoji: "🥤", at: ["motor_park"], duration: 15, cost: 700, needs: { hunger: 22 }, blurb: "Gala and a cold drink. Traveller's classic." },
];

export const getActivity = (id: string) => ACTIVITIES.find((a) => a.id === id);

/** Name/emoji/blurb with the city's local flavour (e.g. the buka meal). */
export function localActivity(def: ActivityDef, cityId: string) {
  const local = getCity(cityId).local[def.id];
  return { name: local?.name ?? def.name, emoji: local?.emoji ?? def.emoji, blurb: local?.blurb ?? def.blurb };
}
