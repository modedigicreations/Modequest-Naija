"use client";

import { sb } from "./client";

// Anonymous site stats for the owner dashboard: one "visit" per browser tab
// session and a "still here" ping every minute. The IDs are random — no names,
// emails or IP addresses are recorded.

let started = false;

function stableId(storage: Storage, key: string): string | null {
  try {
    let v = storage.getItem(key);
    if (!v) {
      v = crypto.randomUUID();
      storage.setItem(key, v);
    }
    return v;
  } catch {
    return null;
  }
}

export function startSiteStats(now: () => { city: string | null; playing: boolean }) {
  if (started || typeof window === "undefined") return;
  started = true;
  // Local copies (development and tests) talk to the live database too:
  // never let them count as real visits.
  if (/^(localhost|127\.0\.0\.1|\[::1\]|0\.0\.0\.0)$/.test(window.location.hostname)) return;
  const client = sb();
  if (!client) return;
  const visitor = stableId(localStorage, "modequest:vid");
  const session = stableId(sessionStorage, "modequest:sid");
  if (!visitor || !session) return;

  try {
    if (!sessionStorage.getItem("modequest:visited")) {
      sessionStorage.setItem("modequest:visited", "1");
      void client.rpc("track_visit", { visitor }).then(() => undefined, () => undefined);
    }
  } catch {
    // storage blocked: skip counting this visit
  }

  const beat = () => {
    if (document.visibilityState !== "visible") return;
    const { city, playing } = now();
    void client.rpc("heartbeat", { session, visitor, city, playing }).then(() => undefined, () => undefined);
  };
  beat();
  window.setInterval(beat, 60_000);
  document.addEventListener("visibilitychange", beat);
}
