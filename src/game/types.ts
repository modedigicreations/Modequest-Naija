// Core game types. The engine is pure TypeScript with no React or browser
// dependencies, so the same code can later run on a server for a shared city.

export const NEED_KEYS = ["hunger", "energy", "hygiene", "fun", "social"] as const;
export type NeedKey = (typeof NEED_KEYS)[number];

export const SKILL_KEYS = [
  "coding",
  "cooking",
  "creativity",
  "business",
  "fitness",
  "finance",
  "charisma",
] as const;
export type SkillKey = (typeof SKILL_KEYS)[number];

export type Needs = Record<NeedKey, number>;
export type Skills = Record<SkillKey, number>; // stored as XP; level derived

export type Weather = "sunny" | "cloudy" | "rain" | "storm";
export type TransportMode = "walk" | "keke" | "bus" | "brt" | "ride" | "car" | "coach" | "flight";
export type WorkStyle = "steady" | "hustle" | "gist" | "easy";
export type LogKind = "info" | "good" | "bad" | "money" | "learn";

export interface Appearance {
  skin: number; // index into SKIN_TONES
  hair: number; // index into HAIR_STYLES
  hairColor: number;
  outfit: number; // outfit colour index
  accessory: number; // 0 = none
  /** Purchased cosmetics worn instead of the basic outfit/accessory. */
  premiumOutfit?: string;
  premiumAccessory?: string;
}

export interface Player {
  name: string;
  pronoun: "he" | "she" | "they";
  appearance: Appearance;
  background: string;
  traits: string[];
  dream: string;
}

export interface TravelState {
  from: string;
  to: string;
  /** Set for trips between cities. */
  toCity?: string;
  mode: TransportMode;
  start: number;
  end: number;
}

export interface ActivityRun {
  activityId: string;
  start: number;
  end: number;
  /** For shifts: chosen work style and whether the task bonus was won. */
  workStyle?: WorkStyle;
  taskBonus?: boolean;
  late?: boolean;
  /** Fraction of per-minute effects already applied (for partial cancel). */
  applied: number;
  usesGenerator?: boolean;
}

export interface CareerState {
  careerId: string;
  level: number; // 0-based index into levels
  performance: number; // 0-100
  shiftsAtLevel: number;
  missedStreak: number;
  lastShiftDay: number; // day number of last completed/started shift, -1 if none
}

export interface OwnedBusiness {
  id: string; // business def id
  level: number;
  boughtOnDay: number;
  lastManagedDay: number;
  weeklyHistory: number[]; // last few weekly profits
}

export interface Loan {
  id: string;
  principal: number;
  remaining: number;
  weekly: number;
  missed: number;
  lender: string;
}

export interface Relationship {
  friendship: number; // 0-100
  met: boolean;
  lastTalkDay: number;
  adviceDay: number;
  owes: number; // money this NPC owes the player
}

export interface MessageChoice {
  id: string;
  label: string;
}

export interface Message {
  id: string;
  from: string; // npc id or display name
  fromName: string;
  templateId: string;
  text: string;
  t: number;
  read: boolean;
  kind: "scam" | "friend" | "system" | "opportunity";
  choices?: MessageChoice[];
  resolved?: string; // chosen choice id
  outcome?: string; // explanation shown after resolving
  data?: Record<string, number | string>;
}

export interface PendingEvent {
  eventId: string;
  t: number;
  data?: Record<string, number | string>;
  /** Set once a choice is made; the UI shows it until dismissed. */
  outcome?: string;
}

export interface LogEntry {
  id: number;
  t: number;
  kind: LogKind;
  text: string;
}

export interface Transaction {
  t: number;
  amount: number; // negative = spent
  label: string;
  account: "cash" | "bank";
}

export interface PonziState {
  invested: number;
  week: number;
  paidOut: boolean;
}

export interface WorldState {
  weatherDay: number;
  weather: Weather;
  powerDay: number;
  power: boolean[]; // 24 hourly slots for the player's home band
  priceIndex: number; // inflation multiplier, starts at 1
  fuelScarcityUntilDay: number;
  lastWeekSettled: number;
  lastRentWeek: number;
}

export interface GameState {
  version: number;
  saveId: string;
  createdAt: number; // real-world ms
  updatedAt: number;
  rng: number; // RNG state
  time: number; // game minutes since Day 1 00:00
  speed: 0 | 1 | 2 | 3;
  player: Player;
  needs: Needs;
  health: number;
  skills: Skills;
  cash: number;
  bank: number;
  /** City the player is currently in. Home city comes from homeId. */
  city: string;
  location: string;
  travel: TravelState | null;
  activity: ActivityRun | null;
  homeId: string;
  missedRent: number;
  items: string[];
  groceries: number;
  career: CareerState | null;
  certificates: string[];
  courseProgress: Record<string, number>;
  businesses: OwnedBusiness[];
  investments: Record<string, number>; // product id -> current value
  ponzi: PonziState | null;
  loans: Loan[];
  relationships: Record<string, Relationship>;
  messages: Message[];
  pendingEvent: PendingEvent | null;
  log: LogEntry[];
  logSeq: number;
  transactions: Transaction[];
  lessons: Record<string, number>; // lesson id -> best score (0-100)
  achievements: string[];
  stats: {
    scamsAvoided: number;
    scamsFallen: number;
    totalEarned: number;
    shiftsWorked: number;
    friendsMade: number;
    hospitalVisits: number;
    evictions: number;
    /** In-game naira bought with real money (kept off wealth leaderboards). */
    toppedUp?: number;
  };
  world: WorldState;
  flags: Record<string, number>;
}

export interface NewGameOptions {
  city: string;
  name: string;
  pronoun: Player["pronoun"];
  appearance: Appearance;
  background: string;
  traits: string[];
  dream: string;
  seed?: number;
}

export type Command =
  | { type: "setSpeed"; speed: GameState["speed"] }
  | { type: "travel"; to: string; mode: TransportMode }
  | { type: "intercity"; to: string; mode: "coach" | "flight" }
  | { type: "relocate"; city: string }
  | { type: "startActivity"; activityId: string }
  | { type: "cancelActivity" }
  | { type: "startShift"; workStyle: WorkStyle; taskBonus: boolean }
  | { type: "applyJob"; careerId: string }
  | { type: "quitJob" }
  | { type: "bankTransfer"; direction: "deposit" | "withdraw"; amount: number }
  | { type: "buyItem"; itemId: string }
  | { type: "buyGroceries"; packs: number }
  | { type: "moveHouse"; homeId: string }
  | { type: "invest"; productId: string; amount: number }
  | { type: "divest"; productId: string }
  | { type: "buyBusiness"; businessId: string }
  | { type: "upgradeBusiness"; businessId: string }
  | { type: "sellBusiness"; businessId: string }
  | { type: "manageBusiness"; businessId: string }
  | { type: "takeLoan"; loanId: string }
  | { type: "repayLoan"; loanId: string }
  | { type: "talk"; npcId: string; interaction: string }
  | { type: "resolveEvent"; choiceId: string }
  | { type: "replyMessage"; messageId: string; choiceId: string }
  | { type: "markMessagesRead" }
  | { type: "completeLesson"; lessonId: string; score: number }
  | { type: "sendGift"; to: string; amount: number }
  | { type: "receiveGift"; from: string; amount: number; note?: string }
  | { type: "topUp"; amount: number; ref: string }
  | { type: "setAppearance"; appearance: Appearance };

export interface DispatchResult {
  state: GameState;
  error?: string;
}
