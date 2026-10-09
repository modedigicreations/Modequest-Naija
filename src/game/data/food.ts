// Foodstuffs for the home pantry. One unit = enough for one meal.
// Prices are at price index 1 and a "normal" market; each market has its own
// price level (LocationDef.groceryPrice ÷ 1000), and delivery costs more.

export interface FoodDef {
  id: string;
  name: string;
  emoji: string;
  price: number;
  blurb: string;
}

export const FOODSTUFFS: FoodDef[] = [
  { id: "rice", name: "Rice", emoji: "🍚", price: 500, blurb: "One mudu of rice — jollof's best friend." },
  { id: "tomato_pepper", name: "Tomato & pepper mix", emoji: "🍅", price: 400, blurb: "Blended tomatoes, pepper and onions for stew." },
  { id: "beans", name: "Beans", emoji: "🫘", price: 450, blurb: "Honey beans. Filling and full of protein." },
  { id: "plantain", name: "Plantain", emoji: "🍌", price: 450, blurb: "Ripe plantain for dodo." },
  { id: "yam", name: "Yam", emoji: "🍠", price: 600, blurb: "A good piece of yam tuber." },
  { id: "eggs", name: "Eggs", emoji: "🥚", price: 400, blurb: "A few eggs for egg sauce or noodles." },
  { id: "garri", name: "Garri", emoji: "🥣", price: 300, blurb: "Make eba, or soak it with sugar and groundnut." },
  { id: "soup_pack", name: "Egusi soup pack", emoji: "🥬", price: 700, blurb: "Egusi, vegetables, palm oil and stockfish." },
  { id: "noodles", name: "Instant noodles", emoji: "🍜", price: 350, blurb: "Quick and cheap. Better with an egg." },
  { id: "bread", name: "Bread", emoji: "🍞", price: 500, blurb: "Agege-style bread, with tea and milk at home." },
];

export const getFood = (id: string) => FOODSTUFFS.find((f) => f.id === id);

/** Delivery from the phone costs more than going to market. */
export const DELIVERY_PRICE_LEVEL = 1.25;
export const DELIVERY_FEE = 700;
/** Riders deliver between these hours. */
export const DELIVERY_HOURS: [number, number] = [7, 21];

/** Pantry space in units (a fridge holds much more). */
export const PANTRY_SIZE = 10;
export const PANTRY_SIZE_FRIDGE = 24;
