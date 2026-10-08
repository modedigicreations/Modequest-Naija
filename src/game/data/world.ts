import type { TransportMode, Weather } from "../types";

// ---------------------------------------------------------------------------
// Locations. Coordinates are in the 1000×700 map viewBox. "side" decides
// whether a trip crosses the lagoon bridges (island ⇄ mainland).
// ---------------------------------------------------------------------------

export interface LocationDef {
  id: string;
  name: string;
  area: string;
  emoji: string;
  x: number;
  y: number;
  side: "mainland" | "island";
  open: number; // hour opens (0-23)
  close: number; // hour closes; close <= open means it runs past midnight
  days?: number[]; // weekdays open (0 = Mon); all days if omitted
  blurb: string;
}

export const LOCATIONS: LocationDef[] = [
  { id: "tech_hub", name: "Yaba Tech Hub", area: "Yaba", emoji: "💻", x: 482, y: 290, side: "mainland", open: 8, close: 22, blurb: "Startups, hackathons and the loudest generator in Yaba. Lagos' 'Silicon Lagoon'." },
  { id: "library", name: "State Library", area: "Yaba", emoji: "📚", x: 402, y: 338, side: "mainland", open: 8, close: 19, days: [0, 1, 2, 3, 4, 5], blurb: "Free study desks, steady light and a librarian who will shush you." },
  { id: "unilag", name: "UNILAG", area: "Akoka", emoji: "🎓", x: 545, y: 238, side: "mainland", open: 7, close: 20, blurb: "University of Lagos — courses, lectures and lagoon-front gist." },
  { id: "computer_village", name: "Computer Village", area: "Ikeja", emoji: "📱", x: 300, y: 128, side: "mainland", open: 8, close: 19, days: [0, 1, 2, 3, 4, 5], blurb: "Africa's biggest phone & gadget market. Bargain hard, check for fakes." },
  { id: "ikeja_mall", name: "Ikeja Mall", area: "Ikeja", emoji: "🛍️", x: 378, y: 102, side: "mainland", open: 9, close: 22, blurb: "Cinema, supermarket and air-con. Window-shopping is free." },
  { id: "mushin_market", name: "Mushin Market", area: "Mushin", emoji: "🧺", x: 250, y: 282, side: "mainland", open: 6, close: 20, days: [0, 1, 2, 3, 4, 5], blurb: "Cheapest foodstuff in town if you know how to price." },
  { id: "amala_spot", name: "Mama Nkechi's Amala Spot", area: "Surulere", emoji: "🍲", x: 330, y: 392, side: "mainland", open: 7, close: 22, blurb: "Amala, ewedu and gbegiri. The buka everybody swears by." },
  { id: "stadium", name: "National Stadium", area: "Surulere", emoji: "⚽", x: 392, y: 430, side: "mainland", open: 6, close: 21, blurb: "Jog the tracks, play five-a-side, catch evening football." },
  { id: "theatre", name: "National Theatre", area: "Iganmu", emoji: "🎭", x: 452, y: 478, side: "mainland", open: 10, close: 23, blurb: "Art shows, drama rehearsals and open-mic Fridays." },
  { id: "balogun", name: "Balogun Market", area: "Lagos Island", emoji: "🏬", x: 526, y: 540, side: "island", open: 8, close: 18, days: [0, 1, 2, 3, 4, 5], blurb: "Fabrics, shoes, everything. Busy, loud, and pickpockets love it." },
  { id: "hospital", name: "General Hospital", area: "Lagos Island", emoji: "🏥", x: 612, y: 500, side: "island", open: 0, close: 0, blurb: "Open 24/7. Checkups, treatment and a long waiting room." },
  { id: "bank_hq", name: "Marina Bank HQ", area: "Victoria Island", emoji: "🏦", x: 652, y: 566, side: "island", open: 8, close: 17, days: [0, 1, 2, 3, 4], blurb: "Financial district. Suits, ATMs and serious faces." },
  { id: "eko_cafe", name: "Eko Waterfront Café", area: "Ikoyi", emoji: "☕", x: 692, y: 452, side: "island", open: 8, close: 23, blurb: "Pricey coffee, fast Wi-Fi, and everyone is 'working on something'." },
  { id: "lekki_park", name: "Lekki Conservation Centre", area: "Lekki", emoji: "🌿", x: 880, y: 528, side: "island", open: 8, close: 17, blurb: "Canopy walkway, monkeys and peace far from go-slow." },
  { id: "beach", name: "Elegushi Beach", area: "Lekki", emoji: "🏖️", x: 836, y: 612, side: "island", open: 9, close: 23, blurb: "Waves, music, suya and the whole of Lagos on a Sunday." },
];

/** Neighbourhood anchors used for the player's home pin. */
export interface HomeDef {
  id: string;
  name: string;
  area: string;
  x: number;
  y: number;
  side: "mainland" | "island";
  weeklyRent: number;
  band: "A" | "B" | "C" | "D";
  sleepQuality: number; // multiplier on energy recovery
  hygieneQuality: number; // multiplier on bath effect
  kitchen: boolean;
  studentOnly?: boolean;
  hidden?: boolean; // not listed for rent (e.g. fallback couch)
  moveInWeeks: number; // weeks of rent paid upfront (agency + caution fee)
  blurb: string;
}

export const HOMES: HomeDef[] = [
  { id: "uncle_couch", name: "Uncle Segun's Couch", area: "Mushin", x: 168, y: 372, side: "mainland", weeklyRent: 0, band: "D", sleepQuality: 0.7, hygieneQuality: 0.7, kitchen: false, hidden: true, moveInWeeks: 0, blurb: "Free, but your uncle will ask about your plans every morning." },
  { id: "mushin_room", name: "Face-me-I-face-you Room", area: "Mushin", x: 180, y: 338, side: "mainland", weeklyRent: 2500, band: "D", sleepQuality: 0.85, hygieneQuality: 0.8, kitchen: false, moveInWeeks: 4, blurb: "Shared bathroom, shared drama. Cheapest roof in Lagos." },
  { id: "unilag_hostel", name: "UNILAG Hostel", area: "Akoka", x: 566, y: 214, side: "mainland", weeklyRent: 1200, band: "C", sleepQuality: 0.85, hygieneQuality: 0.85, kitchen: false, studentOnly: true, moveInWeeks: 4, blurb: "Four to a room, lagoon breeze, endless gist. Scholars only." },
  { id: "yaba_selfcon", name: "Yaba Self-Contain", area: "Yaba", x: 492, y: 338, side: "mainland", weeklyRent: 7000, band: "C", sleepQuality: 1, hygieneQuality: 1, kitchen: true, moveInWeeks: 4, blurb: "Your own room, bathroom and kitchenette, 10 minutes to the tech hub." },
  { id: "surulere_flat", name: "Surulere Mini-Flat", area: "Surulere", x: 300, y: 432, side: "mainland", weeklyRent: 15000, band: "B", sleepQuality: 1.1, hygieneQuality: 1.1, kitchen: true, moveInWeeks: 4, blurb: "Living room, real kitchen, decent light. Grown-up life." },
  { id: "lekki_flat", name: "Lekki 2-Bedroom Flat", area: "Lekki Phase 1", x: 770, y: 552, side: "island", weeklyRent: 45000, band: "A", sleepQuality: 1.2, hygieneQuality: 1.2, kitchen: true, moveInWeeks: 4, blurb: "Estate security, steady light, and neighbours with big dreams." },
  { id: "banana_island", name: "Banana Island Penthouse", area: "Banana Island", x: 724, y: 392, side: "island", weeklyRent: 250000, band: "A", sleepQuality: 1.35, hygieneQuality: 1.3, kitchen: true, moveInWeeks: 4, blurb: "Lagoon views, 24-hour power, the address that ends conversations." },
];

/**
 * Electricity tariff bands: roughly how many hours of grid power the area
 * gets daily. This mirrors Nigeria's Band A–E tariff system.
 */
export const POWER_BANDS: Record<HomeDef["band"], { min: number; max: number }> = {
  A: { min: 19, max: 23 },
  B: { min: 14, max: 18 },
  C: { min: 9, max: 13 },
  D: { min: 5, max: 9 },
};

export interface TransportDef {
  id: TransportMode;
  name: string;
  emoji: string;
  minPerPx: number;
  wait: number;
  baseFare: number;
  farePerPx: number;
  maxDistance?: number;
  traffic: boolean; // slowed by rush-hour go-slow
  needs: { energy?: number; hygiene?: number; fun?: number };
  fitnessXp?: number;
  requiresItem?: string;
  blurb: string;
}

export const TRANSPORT: TransportDef[] = [
  { id: "walk", name: "Trek", emoji: "🚶", minPerPx: 0.4, wait: 0, baseFare: 0, farePerPx: 0, traffic: false, needs: { energy: -8, hygiene: -6 }, fitnessXp: 4, blurb: "Free and builds fitness. Fine for short hops; a long trek is exhausting." },
  { id: "keke", name: "Keke", emoji: "🛺", minPerPx: 0.12, wait: 5, baseFare: 200, farePerPx: 1.6, maxDistance: 260, traffic: true, needs: { hygiene: -3 }, blurb: "Tricycle for short hops. Mainland streets only." },
  { id: "danfo", name: "Danfo", emoji: "🚌", minPerPx: 0.14, wait: 10, baseFare: 300, farePerPx: 1.4, traffic: true, needs: { energy: -4, hygiene: -6, fun: -3 }, blurb: "Yellow bus, conductor shouting 'Oshodi! Oshodi!'. Cheap but slow." },
  { id: "brt", name: "BRT Bus", emoji: "🚍", minPerPx: 0.1, wait: 15, baseFare: 500, farePerPx: 0.6, traffic: false, needs: { energy: -2 }, blurb: "Dedicated lane beats the go-slow. Long queue at the terminal." },
  { id: "ride", name: "Ride-hail", emoji: "🚕", minPerPx: 0.09, wait: 6, baseFare: 800, farePerPx: 9, traffic: true, needs: {}, blurb: "Air-con and comfort. Surge pricing in rush hour." },
  { id: "car", name: "Your Car", emoji: "🚗", minPerPx: 0.085, wait: 0, baseFare: 0, farePerPx: 2.6, traffic: true, needs: { fun: 2 }, requiresItem: "car", blurb: "Fuel money only. Still stuck in traffic like everybody." },
];

export const WEATHER_INFO: Record<Weather, { label: string; emoji: string; travel: number }> = {
  sunny: { label: "Sunny", emoji: "☀️", travel: 1 },
  cloudy: { label: "Cloudy", emoji: "⛅", travel: 1 },
  rain: { label: "Rain", emoji: "🌧️", travel: 1.25 },
  storm: { label: "Flood alert", emoji: "⛈️", travel: 1.6 },
};

export const BRIDGE_MINUTES = 15;

export const getLocation = (id: string) => LOCATIONS.find((l) => l.id === id);
export const getHome = (id: string) => HOMES.find((h) => h.id === id)!;
export const getTransport = (id: TransportMode) => TRANSPORT.find((t) => t.id === id)!;
