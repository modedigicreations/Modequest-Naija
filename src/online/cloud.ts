"use client";

import { migrate } from "@/game/engine";
import { careerTitle } from "@/game/goals";
import { netWorth } from "@/game/helpers";
import { LocalSaveAdapter, type SaveAdapter } from "@/game/persistence";
import type { GameState } from "@/game/types";
import { dayOf } from "@/game/util";
import { sb } from "./client";

const CLOUD_INTERVAL_MS = 30_000;

/** Numbers teachers and leaderboards read, without parsing the whole save. */
export function saveSummary(s: GameState) {
  return {
    city: s.city,
    day: dayOf(s.time),
    net_worth: netWorth(s),
    lessons_passed: Object.values(s.lessons).filter((v) => v >= 60).length,
    lesson_scores: s.lessons,
    scams_avoided: s.stats.scamsAvoided,
    scams_fallen: s.stats.scamsFallen,
    shifts: s.stats.shiftsWorked,
    career: careerTitle(s),
    topped_up: s.stats.toppedUp ?? 0,
    // Wealth leaderboards rank what you earned, not what you bought.
    earned_worth: netWorth(s) - (s.stats.toppedUp ?? 0),
  };
}

/**
 * Saves locally on every call (fast, works offline) and to Supabase at most
 * every 30 seconds. On load, whichever copy is newer wins.
 */
export class CloudSaveAdapter implements SaveAdapter {
  private local: LocalSaveAdapter;
  private lastCloud = 0;
  private pending: GameState | null = null;
  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor(private uid: string) {
    this.local = new LocalSaveAdapter(`modequest:save:${uid}`);
  }

  async load(): Promise<GameState | null> {
    const local = await this.local.load();
    let remote: GameState | null = null;
    try {
      const { data } = await sb()!.from("saves").select("state").eq("user_id", this.uid).maybeSingle();
      remote = data ? migrate(data.state) : null;
    } catch {
      // offline: fall back to local
    }
    if (local && remote) return (local.updatedAt ?? 0) >= (remote.updatedAt ?? 0) ? local : remote;
    return local ?? remote;
  }

  async save(state: GameState): Promise<void> {
    await this.local.save(state);
    this.pending = state;
    const wait = Math.max(0, this.lastCloud + CLOUD_INTERVAL_MS - Date.now());
    if (!this.timer) this.timer = setTimeout(() => void this.flush(), wait);
  }

  /** True while a save hasn't reached the cloud yet (e.g. offline). */
  get unsynced() {
    return this.pending !== null;
  }

  /** Push the latest state to the cloud now (e.g. when the tab is hidden). */
  async flush(): Promise<void> {
    if (this.timer) clearTimeout(this.timer);
    this.timer = null;
    const state = this.pending;
    if (!state) return;
    this.pending = null;
    this.lastCloud = Date.now();
    try {
      const { error } = await sb()!
        .from("saves")
        .upsert({ user_id: this.uid, state, updated_at: new Date().toISOString(), ...saveSummary(state) });
      if (error) throw error;
    } catch {
      this.pending ??= state; // retry next time
    }
  }

  async clear(): Promise<void> {
    await this.local.clear();
    try {
      await sb()!.from("saves").delete().eq("user_id", this.uid);
    } catch {
      // ignore
    }
  }
}
