import { migrate } from "./engine";
import type { GameState } from "./types";

/**
 * Where saves live. Solo play uses the browser; a future multiplayer build
 * swaps in a server adapter (accounts + shared city) behind this interface.
 */
export interface SaveAdapter {
  load(): Promise<GameState | null>;
  save(state: GameState): Promise<void>;
  clear(): Promise<void>;
}

const KEY = "modequest:save";

export class LocalSaveAdapter implements SaveAdapter {
  async load(): Promise<GameState | null> {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? migrate(JSON.parse(raw)) : null;
    } catch {
      return null;
    }
  }

  async save(state: GameState): Promise<void> {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      // Storage full or blocked (private mode). The game keeps running.
    }
  }

  async clear(): Promise<void> {
    try {
      localStorage.removeItem(KEY);
    } catch {
      // ignore
    }
  }
}

export function exportSave(state: GameState): string {
  return btoa(unescape(encodeURIComponent(JSON.stringify(state))));
}

export function importSave(code: string): GameState | null {
  try {
    const text = code.trim().startsWith("{") ? code : decodeURIComponent(escape(atob(code.trim())));
    return migrate(JSON.parse(text));
  } catch {
    return null;
  }
}
