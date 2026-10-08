import type { TransportMode, Weather } from "../types";
import { ABUJA } from "./cities/abuja";
import { ENUGU } from "./cities/enugu";
import { LAGOS } from "./cities/lagos";
import { PORT_HARCOURT } from "./cities/portharcourt";
import type { CityDef, HomeDef, HomeTier, LocationDef, NpcDef } from "./worldTypes";

export type { CityDef, HomeDef, HomeTier, LocationDef, MapShape, NpcDef, PlaceKind } from "./worldTypes";

/** Every playable city. Add a city by adding a data pack to this list. */
export const CITIES: CityDef[] = [LAGOS, ABUJA, PORT_HARCOURT, ENUGU];

export const LOCATIONS: (LocationDef & { city: string })[] = CITIES.flatMap((c) => c.locations.map((l) => ({ ...l, city: c.id })));
export const HOMES: (HomeDef & { city: string })[] = CITIES.flatMap((c) => c.homes.map((h) => ({ ...h, city: c.id })));
export const ALL_NPCS: (NpcDef & { city: string })[] = CITIES.flatMap((c) => c.npcs.map((n) => ({ ...n, city: c.id })));

export const getCity = (id: string) => CITIES.find((c) => c.id === id) ?? LAGOS;
export const getLocation = (id: string) => LOCATIONS.find((l) => l.id === id);
export const getHome = (id: string) => HOMES.find((h) => h.id === id)!;

export function cityHome(cityId: string, tier: HomeTier) {
  return HOMES.find((h) => h.city === cityId && h.tier === tier) ?? HOMES.find((h) => h.city === cityId)!;
}

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
  traffic: boolean;
  needs: { energy?: number; hygiene?: number; fun?: number };
  fitnessXp?: number;
  requiresItem?: string;
  blurb: string;
}

/** Generic in-city modes. Each city renames them and decides which exist. */
export const TRANSPORT: TransportDef[] = [
  { id: "walk", name: "Trek", emoji: "🚶", minPerPx: 0.4, wait: 0, baseFare: 0, farePerPx: 0, traffic: false, needs: { energy: -8, hygiene: -6 }, fitnessXp: 4, blurb: "Free and builds fitness. Fine for short hops; a long trek is exhausting." },
  { id: "keke", name: "Keke", emoji: "🛺", minPerPx: 0.12, wait: 5, baseFare: 200, farePerPx: 1.6, maxDistance: 260, traffic: true, needs: { hygiene: -3 }, blurb: "Tricycle for short hops on local streets." },
  { id: "bus", name: "Bus", emoji: "🚌", minPerPx: 0.14, wait: 10, baseFare: 300, farePerPx: 1.4, traffic: true, needs: { energy: -4, hygiene: -6, fun: -3 }, blurb: "Shared bus. Cheap but slow." },
  { id: "brt", name: "BRT Bus", emoji: "🚍", minPerPx: 0.1, wait: 15, baseFare: 500, farePerPx: 0.6, traffic: false, needs: { energy: -2 }, blurb: "Dedicated lane beats the go-slow. Long queue at the terminal." },
  { id: "ride", name: "Ride-hail", emoji: "🚕", minPerPx: 0.09, wait: 6, baseFare: 800, farePerPx: 9, traffic: true, needs: {}, blurb: "Air-con and comfort. Surge pricing in rush hour." },
  { id: "car", name: "Your Car", emoji: "🚗", minPerPx: 0.085, wait: 0, baseFare: 0, farePerPx: 2.6, traffic: true, needs: { fun: 2 }, requiresItem: "car", blurb: "Fuel money only. Still stuck in traffic like everybody." },
];

// ---------------------------------------------------------------------------
// Travel between cities: luxury bus from the motor park, or fly.
// ---------------------------------------------------------------------------

export const INTERCITY_MODES: Record<"coach" | "flight", TransportDef> = {
  coach: { id: "coach", name: "Luxury bus", emoji: "🚌", minPerPx: 0, wait: 30, baseFare: 0, farePerPx: 0, traffic: false, needs: { energy: -30, hygiene: -35, fun: -15 }, blurb: "Long road trip from the motor park. Cheap, tiring, scenic." },
  flight: { id: "flight", name: "Flight", emoji: "✈️", minPerPx: 0, wait: 90, baseFare: 0, farePerPx: 0, traffic: false, needs: { energy: -10, hygiene: -5 }, blurb: "Fast but pricey. Check in 90 minutes early." },
};

/** Local display name/emoji/blurb for a mode in a city. */
export function transportIn(cityId: string, mode: TransportMode): TransportDef & { available: boolean } {
  if (mode === "coach" || mode === "flight") return { ...INTERCITY_MODES[mode], available: true };
  const base = TRANSPORT.find((t) => t.id === mode)!;
  const local = getCity(cityId).transport[mode];
  return { ...base, name: local?.name ?? base.name, emoji: local?.emoji ?? base.emoji, blurb: local?.blurb ?? base.blurb, available: !!local };
}

/** Road distance in hours by luxury bus. */
const ROAD_HOURS: Record<string, number> = {
  "abuja-lagos": 10,
  "lagos-portharcourt": 9,
  "enugu-lagos": 8,
  "abuja-portharcourt": 9,
  "abuja-enugu": 5,
  "enugu-portharcourt": 4,
};

export function intercityRoute(from: string, to: string, mode: "coach" | "flight") {
  const key = [from, to].sort().join("-");
  const hours = ROAD_HOURS[key] ?? 8;
  if (mode === "coach") return { minutes: hours * 60 + INTERCITY_MODES.coach.wait, fare: 5000 + hours * 2400 };
  return { minutes: 75 + INTERCITY_MODES.flight.wait, fare: 85000 + hours * 3000 };
}

export const WEATHER_INFO: Record<Weather, { label: string; emoji: string; travel: number }> = {
  sunny: { label: "Sunny", emoji: "☀️", travel: 1 },
  cloudy: { label: "Cloudy", emoji: "⛅", travel: 1 },
  rain: { label: "Rain", emoji: "🌧️", travel: 1.25 },
  storm: { label: "Flood alert", emoji: "⛈️", travel: 1.6 },
};

/** Location of a given kind in a city, preferring places where it's the main kind. */
export const findKind = (cityId: string, kind: LocationDef["kinds"][number]) =>
  LOCATIONS.find((l) => l.city === cityId && l.kinds[0] === kind) ?? LOCATIONS.find((l) => l.city === cityId && l.kinds.includes(kind));
