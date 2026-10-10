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
  { id: "outfit_aso_oke", name: "Aso-oke Owambe Fit", slot: "outfit", emoji: "💜" },
  { id: "outfit_senator", name: "Senator Wear", slot: "outfit", emoji: "🧥" },
  { id: "outfit_kaftan", name: "Embroidered Kaftan", slot: "outfit", emoji: "🪡" },
  { id: "outfit_isiagu", name: "Isi-agu Top", slot: "outfit", emoji: "🦁" },
  { id: "outfit_carnival", name: "Calabar Carnival Costume", slot: "outfit", emoji: "🎉" },
  { id: "outfit_chef", name: "Chef's Whites", slot: "outfit", emoji: "👨🏾‍🍳" },
  { id: "outfit_akwa_ocha", name: "Akwa Ocha", slot: "outfit", emoji: "🤍" },
  { id: "outfit_premiere_tux", name: "Nollywood Premiere Tux", slot: "outfit", emoji: "🎬" },
  { id: "outfit_uli", name: "Uli Art Print", slot: "outfit", emoji: "🖌️" },
  { id: "outfit_etibo", name: "Etibo", slot: "outfit", emoji: "👔" },
  { id: "outfit_george", name: "George Wrapper", slot: "outfit", emoji: "🟥" },
  { id: "acc_crown", name: "Gold Crown", slot: "accessory", emoji: "👑" },
  { id: "acc_beret", name: "Director's Beret", slot: "accessory", emoji: "🎥" },
  { id: "acc_fedora", name: "Highlife Fedora", slot: "accessory", emoji: "🎷" },
  { id: "acc_resha", name: "Resha Hat", slot: "accessory", emoji: "🎩" },
  { id: "acc_gele", name: "Gele Headwrap", slot: "accessory", emoji: "🎀" },
  { id: "acc_red_cap", name: "Okpu (Red Cap)", slot: "accessory", emoji: "🧢" },
  { id: "acc_zanna", name: "Zanna Cap", slot: "accessory", emoji: "🎩" },
  { id: "acc_coral", name: "Coral Beads", slot: "accessory", emoji: "📿" },
  { id: "acc_chef_hat", name: "Chef's Hat", slot: "accessory", emoji: "🍳" },
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
  /** City collection this belongs to (shown grouped by city in the store). */
  city?: string;
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
  { id: "c_aso_oke", kind: "cosmetic", name: "Aso-oke Owambe Fit", emoji: "💜", priceNaira: 600, blurb: "Purple and gold hand-woven aso-oke for the party of the year.", grants: { cosmetics: ["outfit_aso_oke"] } },
  { id: "c_senator", kind: "cosmetic", name: "Senator Wear", emoji: "🧥", priceNaira: 700, blurb: "Deep green senator with gold embroidery. Boardroom ready.", grants: { cosmetics: ["outfit_senator"] } },
  { id: "c_kaftan", kind: "cosmetic", name: "Embroidered Kaftan", emoji: "🪡", priceNaira: 600, blurb: "Sky-blue kaftan with a gold-stitched neckline.", grants: { cosmetics: ["outfit_kaftan"] } },
  { id: "c_isiagu", kind: "cosmetic", name: "Isi-agu Top", emoji: "🦁", priceNaira: 700, blurb: "The proud lion-head print of Igbo chiefs and celebrations.", grants: { cosmetics: ["outfit_isiagu"] } },
  { id: "c_carnival", kind: "cosmetic", name: "Calabar Carnival Costume", emoji: "🎉", priceNaira: 800, blurb: "Sequins, feathers and colour from Africa's biggest street party.", grants: { cosmetics: ["outfit_carnival"] }, city: "calabar" },
  // City collections
  { id: "c_akwa_ocha", kind: "cosmetic", name: "Akwa Ocha", emoji: "🤍", priceNaira: 700, blurb: "The white hand-woven cloth of the Anioma people, draped with pride.", grants: { cosmetics: ["outfit_akwa_ocha"] }, city: "asaba" },
  { id: "c_premiere_tux", kind: "cosmetic", name: "Nollywood Premiere Tux", emoji: "🎬", priceNaira: 800, blurb: "Red-carpet ready: black tux, bow tie and pocket square.", grants: { cosmetics: ["outfit_premiere_tux"] }, city: "asaba" },
  { id: "c_beret", kind: "cosmetic", name: "Director's Beret", emoji: "🎥", priceNaira: 400, blurb: "Lights, camera, action! For Asaba's film makers.", grants: { cosmetics: ["acc_beret"] }, city: "asaba" },
  { id: "c_uli", kind: "cosmetic", name: "Uli Art Print", emoji: "🖌️", priceNaira: 700, blurb: "Flowing Igbo uli motifs, like the art of Owerri's Mbari houses.", grants: { cosmetics: ["outfit_uli"] }, city: "owerri" },
  { id: "c_fedora", kind: "cosmetic", name: "Highlife Fedora", emoji: "🎷", priceNaira: 400, blurb: "Owerri nights, highlife music, a sharp hat.", grants: { cosmetics: ["acc_fedora"] }, city: "owerri" },
  { id: "c_etibo", kind: "cosmetic", name: "Etibo", emoji: "👔", priceNaira: 700, blurb: "The Ijaw gentleman's long collarless shirt with gold buttons.", grants: { cosmetics: ["outfit_etibo"] }, city: "yenagoa" },
  { id: "c_george", kind: "cosmetic", name: "George Wrapper", emoji: "🟥", priceNaira: 700, blurb: "Bright checked George fabric, a Niger Delta classic for big occasions.", grants: { cosmetics: ["outfit_george"] }, city: "yenagoa" },
  { id: "c_resha", kind: "cosmetic", name: "Resha Hat", emoji: "🎩", priceNaira: 400, blurb: "The Ijaw bowler hat. Completes the etibo look.", grants: { cosmetics: ["acc_resha"] }, city: "yenagoa" },
  { id: "b_asaba", kind: "bundle", name: "Asaba Pack", emoji: "🎬", priceNaira: 1500, blurb: "Akwa ocha, premiere tux and director's beret. Save ₦400.", grants: { cosmetics: ["outfit_akwa_ocha", "outfit_premiere_tux", "acc_beret"] }, city: "asaba" },
  { id: "b_owerri", kind: "bundle", name: "Owerri Pack", emoji: "💚", priceNaira: 900, blurb: "Uli art print and highlife fedora. Save ₦200.", grants: { cosmetics: ["outfit_uli", "acc_fedora"] }, city: "owerri" },
  { id: "b_yenagoa", kind: "bundle", name: "Yenagoa Pack", emoji: "🛶", priceNaira: 1400, blurb: "Etibo, George wrapper and resha hat. Save ₦400.", grants: { cosmetics: ["outfit_etibo", "outfit_george", "acc_resha"] }, city: "yenagoa" },
  { id: "c_chef", kind: "cosmetic", name: "Chef's Whites", emoji: "👨🏾‍🍳", priceNaira: 500, blurb: "For the jollof champions.", grants: { cosmetics: ["outfit_chef"] } },
  { id: "c_gele", kind: "cosmetic", name: "Gele Headwrap", emoji: "🎀", priceNaira: 500, blurb: "A tall, gold gele. Owambe ready.", grants: { cosmetics: ["acc_gele"] } },
  { id: "c_red_cap", kind: "cosmetic", name: "Okpu (Red Cap)", emoji: "🧢", priceNaira: 400, blurb: "The red cap of honour from the East.", grants: { cosmetics: ["acc_red_cap"] } },
  { id: "c_zanna", kind: "cosmetic", name: "Zanna Cap", emoji: "🎩", priceNaira: 400, blurb: "Embroidered northern cap, worn with pride.", grants: { cosmetics: ["acc_zanna"] } },
  { id: "c_coral", kind: "cosmetic", name: "Coral Beads", emoji: "📿", priceNaira: 500, blurb: "Royal coral beads from Benin tradition.", grants: { cosmetics: ["acc_coral"] } },
  { id: "c_chef_hat", kind: "cosmetic", name: "Chef's Hat", emoji: "🍳", priceNaira: 300, blurb: "Tall white toque. Pairs with Chef's Whites.", grants: { cosmetics: ["acc_chef_hat"] } },
  // Bundles
  { id: "b_owambe", kind: "bundle", name: "Owambe Pack", emoji: "💃🏾", priceNaira: 1200, blurb: "Aso-oke fit, gele and coral beads. Save ₦400.", grants: { cosmetics: ["outfit_aso_oke", "acc_gele", "acc_coral"] } },
  { id: "b_heritage", kind: "bundle", name: "Naija Heritage Pack", emoji: "🇳🇬", priceNaira: 2000, blurb: "Isi-agu, kaftan, senator wear, red cap and zanna cap. Save ₦800.", grants: { cosmetics: ["outfit_isiagu", "outfit_kaftan", "outfit_senator", "acc_red_cap", "acc_zanna"] } },
  { id: "b_chef", kind: "bundle", name: "Master Chef Pack", emoji: "🍲", priceNaira: 700, blurb: "Chef's whites and chef's hat. Save ₦100.", grants: { cosmetics: ["outfit_chef", "acc_chef_hat"] } },
  // Bundle
  { id: "b_naija_style", kind: "bundle", name: "Naija Style Pack", emoji: "🎁", priceNaira: 1500, blurb: "Both Ankara fits, the Agbada and Cool Shades. Save ₦700.", grants: { cosmetics: ["outfit_ankara_blue", "outfit_ankara_sunset", "outfit_agbada", "acc_shades"] } },
  // Supporter
  { id: "s_supporter_90", kind: "supporter", name: "ModeQuest Supporter · 90 days", emoji: "🌟", priceNaira: 2500, blurb: "Everything in the 30-day pass for 3 months. Save ₦500.", grants: { supporterDays: 90, cosmetics: ["outfit_supporter"] } },
  { id: "s_supporter_365", kind: "supporter", name: "ModeQuest Supporter · 1 year", emoji: "💫", priceNaira: 8000, blurb: "A whole year of the ⭐ badge and the Supporter Gold Ankara. Save ₦4,000.", grants: { supporterDays: 365, cosmetics: ["outfit_supporter"] } },
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
