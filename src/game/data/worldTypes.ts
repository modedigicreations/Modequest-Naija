// Shared world types. City packs (data/cities/*) only import types from here,
// so adding a new city is just adding a new data file.

import type { TransportMode, Weather } from "../types";

/** What a place is for. Activities, careers and shops target kinds, not ids. */
export type PlaceKind =
  | "tech_hub"
  | "library"
  | "university"
  | "gadget_market"
  | "mall"
  | "food_market"
  | "buka"
  | "stadium"
  | "theatre"
  | "market"
  | "hospital"
  | "bank"
  | "cafe"
  | "park"
  | "beach"
  | "lake"
  | "waterfront"
  | "industrial"
  | "ministry"
  | "motor_park"
  | "airport";

export interface LocationDef {
  id: string; // globally unique
  name: string;
  area: string;
  emoji: string;
  x: number; // 1000×700 city map
  y: number;
  zone: string; // crossing between zones adds bridge time (e.g. Lagos mainland/island)
  kinds: PlaceKind[];
  open: number;
  close: number; // close <= open means past midnight; equal = 24h
  days?: number[];
  groceryPrice?: number;
  blurb: string;
}

export type HomeTier = "couch" | "room" | "hostel" | "selfcon" | "flat" | "luxury" | "penthouse";

export interface HomeDef {
  id: string;
  name: string;
  area: string;
  x: number;
  y: number;
  zone: string;
  tier: HomeTier;
  weeklyRent: number;
  band: "A" | "B" | "C" | "D";
  sleepQuality: number;
  hygieneQuality: number;
  kitchen: boolean;
  studentOnly?: boolean;
  hidden?: boolean;
  moveInWeeks: number;
  blurb: string;
}

export interface NpcSchedule {
  days: number[];
  from: number;
  to: number;
  at: string; // location id in the same city
}

export interface NpcDef {
  id: string;
  name: string;
  emoji: string;
  role: string;
  reliability: number;
  schedule: NpcSchedule[];
  greeting: string;
  advice: string[];
}

export interface MapShape {
  d: string;
  fill: "land" | "land2" | "lagoon" | "ocean" | "hill" | "green";
}

export interface MapLabel {
  text: string;
  x: number;
  y: number;
  kind: "area" | "water" | "feature";
  rotate?: number;
}

export interface CityMap {
  base: "land" | "lagoon";
  shapes: MapShape[];
  roads: string[];
  bridges?: string[];
  labels: MapLabel[];
}

/** Local name for a generic activity, e.g. the buka meal in each city. */
export interface LocalActivity {
  name: string;
  emoji?: string;
  blurb?: string;
}

export interface CityDef {
  id: string;
  name: string;
  nickname: string;
  state: string;
  emoji: string;
  blurb: string;
  /** Position on the Nigeria overview map (0-100 × 0-100). */
  nx: number;
  ny: number;
  locations: LocationDef[];
  homes: HomeDef[];
  npcs: NpcDef[];
  /** Local transport names; modes missing here aren't available in this city. */
  transport: Partial<Record<TransportMode, { name: string; emoji?: string; blurb?: string }>>;
  zoneCrossMinutes: number;
  /** Rush-hour slowdown for road transport (Lagos go-slow is the worst). */
  rushFactor: number;
  weather: Record<Weather, number>; // relative weights
  local: Record<string, LocalActivity>; // activity id -> local flavour
  map: CityMap;
}
