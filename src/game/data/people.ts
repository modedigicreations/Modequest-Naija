import { ALL_NPCS } from "./world";

// People now live in their city packs (data/cities/*). When multiplayer
// arrives, real players appear alongside these NPCs at the same locations.

export { ALL_NPCS as NPCS };
export type { NpcDef, NpcSchedule } from "./worldTypes";

export function npcsAt(locationId: string, weekday: number, hour: number) {
  return ALL_NPCS.filter((n) =>
    n.schedule.some((s) => s.at === locationId && s.days.includes(weekday) && hour >= s.from && hour < s.to),
  );
}

export const getNpc = (id: string) => ALL_NPCS.find((n) => n.id === id);

export const INTERACTIONS = {
  gist: { label: "Gist", emoji: "💬", minutes: 20, blurb: "Small talk. Builds friendship." },
  joke: { label: "Crack a joke", emoji: "😂", minutes: 10, blurb: "Charisma check. Big win or awkward silence." },
  advice: { label: "Ask for advice", emoji: "💡", minutes: 15, blurb: "Learn something useful (once a day each)." },
  hangout: { label: "Hang out", emoji: "🎉", minutes: 90, blurb: "Spend real time together. Costs ₦1,500." },
  gift: { label: "Give a gift", emoji: "🎁", minutes: 10, blurb: "₦3,000 gift. Friends appreciate it." },
} as const;

export type InteractionId = keyof typeof INTERACTIONS;
