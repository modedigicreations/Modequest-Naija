"use client";

import type { RealtimeChannel } from "@supabase/supabase-js";
import { useEffect } from "react";
import { create } from "zustand";
import { useGame } from "@/game/store";
import type { Appearance } from "@/game/types";
import { sb } from "./client";
import { QUICK_CHAT } from "./shared";
import { useSession } from "./session";
import { useShop } from "@/shop/client";

export interface OnlinePlayer {
  id: string;
  nickname: string;
  appearance: Appearance;
  location: string;
  busy: string | null;
  role: string;
  supporter?: boolean;
}

export interface Bubble {
  id: string;
  from: string;
  nickname: string;
  text: string;
  location: string;
  at: number;
}

interface PresenceStore {
  city: string | null;
  players: OnlinePlayer[];
  bubbles: Bubble[];
  lastSaid: number;
  say(location: string, phrase: number): string | null;
}

let channel: RealtimeChannel | null = null;
let subscribed = false;
let latest: OnlinePlayer | null = null;
let bubbleSeq = 0;

export const usePresence = create<PresenceStore>((set, get) => ({
  city: null,
  players: [],
  bubbles: [],
  lastSaid: 0,
  say(location, phrase) {
    const me = useSession.getState().profile;
    if (!channel || !me) return "You're offline.";
    if (Date.now() - get().lastSaid < 3000) return "Slow down a little 🙂";
    const text = QUICK_CHAT[phrase];
    if (!text) return "Unknown phrase.";
    set({ lastSaid: Date.now() });
    void channel.send({ type: "broadcast", event: "qc", payload: { from: me.id, nickname: me.nickname, text, location } });
    return null;
  },
}));

function addBubble(b: Omit<Bubble, "id" | "at">) {
  bubbleSeq += 1;
  const bubble = { ...b, id: `b${bubbleSeq}`, at: Date.now() };
  usePresence.setState((s) => ({ bubbles: [...s.bubbles, bubble].slice(-40) }));
}

/**
 * Keeps this player visible to others in the same city (Supabase Realtime
 * presence) and listens for quick-chat. Mount once inside the game screen.
 */
export function usePresenceSync() {
  const user = useSession((s) => s.user);
  const profile = useSession((s) => s.profile);
  const city = useGame((s) => s.game?.city ?? null);
  const location = useGame((s) => (s.game?.travel ? "travel" : (s.game?.location ?? null)));
  const busy = useGame((s) => s.game?.activity?.activityId ?? null);
  const appearance = useGame((s) => s.game?.player.appearance ?? null);
  const supporter = useShop((s) => !!s.supporterUntil && s.supporterUntil > 0);

  // (Re)join the city channel.
  useEffect(() => {
    const client = sb();
    if (!client || !user || !profile || !city) return;
    const ch = client.channel(`city:${city}`, { config: { presence: { key: user.id }, broadcast: { self: true } } });
    channel = ch;
    usePresence.setState({ city, players: [] });
    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState<OnlinePlayer>();
      const players = Object.values(state)
        .map((metas) => metas[0])
        .filter((p): p is OnlinePlayer & { presence_ref: string } => !!p && p.id !== user.id);
      usePresence.setState({ players });
    });
    ch.on("broadcast", { event: "qc" }, ({ payload }) => {
      if (typeof payload?.text === "string" && (QUICK_CHAT as readonly string[]).includes(payload.text)) addBubble(payload);
    });
    subscribed = false;
    ch.subscribe((status) => {
      if (status === "SUBSCRIBED" && channel === ch) {
        subscribed = true;
        if (latest) void ch.track(latest);
      }
    });
    return () => {
      void client.removeChannel(ch);
      if (channel === ch) {
        channel = null;
        subscribed = false;
      }
      usePresence.setState({ players: [], city: null });
    };
  }, [user, profile, city]);

  // Tell others where we are.
  useEffect(() => {
    if (!user || !profile || !appearance || !location) return;
    latest = { id: user.id, nickname: profile.nickname, appearance, location, busy, role: profile.role, supporter };
    const t = setTimeout(() => {
      if (channel && subscribed && latest) void channel.track(latest);
    }, 300);
    return () => clearTimeout(t);
  }, [user, profile, appearance, location, busy, city, supporter]);
}
