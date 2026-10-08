// What can be bought with real money. Shared by server (prices are always
// taken from here, never from the browser) and client (store UI).

export type ProductKind = "cosmetic" | "bundle" | "supporter" | "topup" | "plan";

export interface CosmeticDef {
  id: string;
  name: string;
  slot: "outfit" | "accessory";
  emoji: string;
}

/** Premium wardrobe. Visual only — no gameplay advantage. */
export const COSMETICS: CosmeticDef[] = [
  { id: "outfit_ankara_blue", name: "Blue Ankara Fit", slot: "outfit", emoji: "👘" },
  { id: "outfit_ankara_sunset", name: "Sunset Ankara Fit", slot: "outfit", emoji: "🌅" },
  { id: "outfit_agbada", name: "White Agbada", slot: "outfit", emoji: "🥻" },
  { id: "outfit_jersey", name: "Green-White-Green Jersey", slot: "outfit", emoji: "⚽" },
  { id: "outfit_gown", name: "Graduation Gown", slot: "outfit", emoji: "🎓" },
  { id: "outfit_supporter", name: "Supporter Gold Ankara", slot: "outfit", emoji: "⭐" },
  { id: "acc_crown", name: "Gold Crown", slot: "accessory", emoji: "👑" },
  { id: "acc_shades", name: "Cool Shades", slot: "accessory", emoji: "🕶️" },
  { id: "acc_gradcap", name: "Graduation Cap", slot: "accessory", emoji: "🎓" },
  { id: "acc_headset", name: "Pro Gamer Headset", slot: "accessory", emoji: "🎧" },
];

export const getCosmetic = (id: string) => COSMETICS.find((c) => c.id === id);

export type PlanId = "classroom" | "school";

export interface PlanDef {
  id: PlanId | "free";
  name: string;
  maxClasses: number;
  maxStudents: number;
}

export const PLANS: PlanDef[] = [
  { id: "free", name: "Free", maxClasses: 1, maxStudents: 40 },
  { id: "classroom", name: "Classroom", maxClasses: 5, maxStudents: 250 },
  { id: "school", name: "Whole School", maxClasses: 60, maxStudents: 3000 },
];

export interface Product {
  id: string;
  kind: ProductKind;
  name: string;
  emoji: string;
  priceNaira: number; // real naira charged
  blurb: string;
  grants: {
    cosmetics?: string[];
    naira?: number; // in-game naira
    supporterDays?: number;
    plan?: PlanId;
    planDays?: number;
  };
  /** Only teacher accounts can buy (school plans). */
  teacherOnly?: boolean;
}

export const PRODUCTS: Product[] = [
  // Cosmetics
  { id: "c_ankara_blue", kind: "cosmetic", name: "Blue Ankara Fit", emoji: "👘", priceNaira: 500, blurb: "Bold blue Ankara print for your avatar.", grants: { cosmetics: ["outfit_ankara_blue"] } },
  { id: "c_ankara_sunset", kind: "cosmetic", name: "Sunset Ankara Fit", emoji: "🌅", priceNaira: 500, blurb: "Orange and purple Ankara print.", grants: { cosmetics: ["outfit_ankara_sunset"] } },
  { id: "c_agbada", kind: "cosmetic", name: "White Agbada", emoji: "🥻", priceNaira: 800, blurb: "Flowing white agbada with gold trim.", grants: { cosmetics: ["outfit_agbada"] } },
  { id: "c_jersey", kind: "cosmetic", name: "Green-White-Green Jersey", emoji: "⚽", priceNaira: 600, blurb: "Represent Naija on match day.", grants: { cosmetics: ["outfit_jersey"] } },
  { id: "c_gown", kind: "cosmetic", name: "Graduation Gown", emoji: "🎓", priceNaira: 700, blurb: "For the scholars.", grants: { cosmetics: ["outfit_gown"] } },
  { id: "c_crown", kind: "cosmetic", name: "Gold Crown", emoji: "👑", priceNaira: 700, blurb: "Oga at the top energy.", grants: { cosmetics: ["acc_crown"] } },
  { id: "c_shades", kind: "cosmetic", name: "Cool Shades", emoji: "🕶️", priceNaira: 400, blurb: "Too cool for go-slow.", grants: { cosmetics: ["acc_shades"] } },
  { id: "c_gradcap", kind: "cosmetic", name: "Graduation Cap", emoji: "🎓", priceNaira: 400, blurb: "Pairs well with the gown.", grants: { cosmetics: ["acc_gradcap"] } },
  { id: "c_headset", kind: "cosmetic", name: "Pro Gamer Headset", emoji: "🎧", priceNaira: 500, blurb: "Glowing headset for coders and gamers.", grants: { cosmetics: ["acc_headset"] } },
  // Bundle
  { id: "b_naija_style", kind: "bundle", name: "Naija Style Pack", emoji: "🎁", priceNaira: 1500, blurb: "Both Ankara fits, the Agbada and Cool Shades. Save ₦700.", grants: { cosmetics: ["outfit_ankara_blue", "outfit_ankara_sunset", "outfit_agbada", "acc_shades"] } },
  // Supporter
  { id: "s_supporter_30", kind: "supporter", name: "ModeQuest Supporter · 30 days", emoji: "⭐", priceNaira: 1000, blurb: "⭐ badge on leaderboards and the map for 30 days, plus the Supporter Gold Ankara outfit to keep forever. Helps keep the game free for schools.", grants: { supporterDays: 30, cosmetics: ["outfit_supporter"] } },
  // In-game naira (kept off the wealth leaderboard)
  { id: "t_small", kind: "topup", name: "₦30,000 game money", emoji: "💰", priceNaira: 300, blurb: "Adds ₦30,000 in-game naira to your bank.", grants: { naira: 30000 } },
  { id: "t_medium", kind: "topup", name: "₦80,000 game money", emoji: "💰", priceNaira: 700, blurb: "Adds ₦80,000 in-game naira to your bank.", grants: { naira: 80000 } },
  { id: "t_large", kind: "topup", name: "₦200,000 game money", emoji: "💰", priceNaira: 1500, blurb: "Adds ₦200,000 in-game naira to your bank.", grants: { naira: 200000 } },
  // School plans
  { id: "p_classroom_term", kind: "plan", name: "Classroom plan · 1 term", emoji: "🏫", priceNaira: 7500, blurb: "Up to 5 classes and 250 students for 120 days.", grants: { plan: "classroom", planDays: 120 }, teacherOnly: true },
  { id: "p_school_year", kind: "plan", name: "Whole School plan · 1 year", emoji: "🏛️", priceNaira: 35000, blurb: "Up to 60 classes and 3,000 students for 365 days.", grants: { plan: "school", planDays: 365 }, teacherOnly: true },
];

export const getProduct = (id: string) => PRODUCTS.find((p) => p.id === id);

/** Spending cap per player per rolling 30 days (real naira). School plans are exempt. */
export const PLAYER_MONTHLY_CAP_NAIRA = 20000;
