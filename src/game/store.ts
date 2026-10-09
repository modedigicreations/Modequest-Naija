"use client";

import { create } from "zustand";
import { advance, dispatch as engineDispatch, newGame, realGameTime, syncToRealClock } from "./engine";
import { LocalSaveAdapter, type SaveAdapter } from "./persistence";
import type { Command, GameState, NewGameOptions } from "./types";

/** A gap longer than this (minutes) means the app was closed or asleep: catch up gently. */
const AWAY_AFTER_MINUTES = 3;

/** Older saves ran on a fast clock; move them onto real Nigerian time once. */
const onRealClock = (g: GameState | null) => (g && !g.flags.realClock ? syncToRealClock(g, Date.now()) : g);

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
  /** Bring the game up to the real clock. */
  tick(): void;
  hold(key: string, on: boolean): void;
  save(): void;
  flushSave(): Promise<void>;
  /** Switch where saves live (guest ⇄ signed-in account) and reload. */
  switchAdapter(adapter: SaveAdapter): Promise<void>;
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
    const saved = onRealClock(await get().adapter.load());
    set({ game: saved, hasSave: !!saved, screen: "title" });
  },

  setScreen(screen) {
    set({ screen });
  },

  startNew(opts) {
    const game = newGame({ ...opts, now: Date.now() });
    set({ game, hasSave: true, screen: "play", carry: 0 });
    void get().adapter.save(game);
  },

  load(state) {
    const game = onRealClock(state)!;
    set({ game, hasSave: true, screen: "play", carry: 0 });
    void get().adapter.save(game);
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

  tick() {
    const { game } = get();
    if (!game || game.pendingEvent) return;
    if (!game.flags.realClock) {
      set({ game: onRealClock(game) });
      return;
    }
    // Follow the real clock; a long gap (app closed, phone asleep) is caught up gently.
    const behind = realGameTime(game, Date.now()) - game.time;
    if (behind <= 0) return;
    set({ game: advance(game, behind, behind > AWAY_AFTER_MINUTES ? "away" : "live") });
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

  async flushSave() {
    const { game, adapter } = get();
    if (game) await adapter.save(game);
    await adapter.flush?.();
  },

  async switchAdapter(adapter) {
    await get().flushSave();
    const saved = onRealClock(await adapter.load());
    set({ adapter, game: saved, hasSave: !!saved, screen: "title", carry: 0 });
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
