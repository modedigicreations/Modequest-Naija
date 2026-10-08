"use client";

import { create } from "zustand";
import { advance, dispatch as engineDispatch, newGame } from "./engine";
import { LocalSaveAdapter, type SaveAdapter } from "./persistence";
import type { Command, GameState, NewGameOptions } from "./types";

// Game minutes per real second: [idle, busy] for each speed setting.
const RATES: Record<1 | 2 | 3, [number, number]> = {
  1: [2, 20],
  2: [6, 40],
  3: [15, 60],
};

export type Screen = "loading" | "title" | "create" | "play";

interface Flash {
  id: number;
  text: string;
}

interface GameStore {
  screen: Screen;
  game: GameState | null;
  hasSave: boolean;
  flash: Flash | null;
  /** UI surfaces that pause the clock (lessons, shift picker, etc.). */
  holds: Set<string>;
  adapter: SaveAdapter;
  carry: number;
  lastSave: number;

  init(): Promise<void>;
  setScreen(screen: Screen): void;
  startNew(opts: NewGameOptions): void;
  load(state: GameState): void;
  dispatch(cmd: Command): boolean;
  tick(realMs: number): void;
  hold(key: string, on: boolean): void;
  save(): void;
  wipe(): Promise<void>;
  showFlash(text: string): void;
}

let flashSeq = 0;

export const useGame = create<GameStore>((set, get) => ({
  screen: "loading",
  game: null,
  hasSave: false,
  flash: null,
  holds: new Set(),
  adapter: new LocalSaveAdapter(),
  carry: 0,
  lastSave: 0,

  async init() {
    const saved = await get().adapter.load();
    set({ game: saved, hasSave: !!saved, screen: "title" });
  },

  setScreen(screen) {
    set({ screen });
  },

  startNew(opts) {
    const game = newGame(opts);
    set({ game, hasSave: true, screen: "play", carry: 0 });
    void get().adapter.save(game);
  },

  load(state) {
    set({ game: state, hasSave: true, screen: "play", carry: 0 });
    void get().adapter.save(state);
  },

  dispatch(cmd) {
    const g = get().game;
    if (!g) return false;
    const r = engineDispatch(g, cmd);
    if (r.error) {
      get().showFlash(r.error);
      return false;
    }
    set({ game: r.state });
    return true;
  },

  tick(realMs) {
    const { game, holds, carry } = get();
    if (!game || game.speed === 0 || game.pendingEvent || holds.size > 0) return;
    const busy = !!game.activity || !!game.travel;
    const rate = RATES[game.speed][busy ? 1 : 0];
    const total = carry + (realMs / 1000) * rate;
    const whole = Math.floor(total);
    if (whole <= 0) {
      set({ carry: total });
      return;
    }
    set({ game: advance(game, whole), carry: total - whole });
    if (Date.now() - get().lastSave > 15000) get().save();
  },

  hold(key, on) {
    const holds = new Set(get().holds);
    if (on) holds.add(key);
    else holds.delete(key);
    set({ holds });
  },

  save() {
    const g = get().game;
    if (!g) return;
    set({ lastSave: Date.now() });
    void get().adapter.save(g);
  },

  async wipe() {
    await get().adapter.clear();
    set({ game: null, hasSave: false, screen: "title" });
  },

  showFlash(text) {
    flashSeq += 1;
    set({ flash: { id: flashSeq, text } });
  },
}));
