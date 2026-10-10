"use client";

import { useEffect } from "react";
import { useGame } from "@/game/store";
import { captureReferral } from "@/online/referral";
import { startSiteStats } from "@/online/stats";
import { useSession } from "@/online/session";
import CharacterCreator from "./CharacterCreator";
import GameScreen from "./GameScreen";
import { useStoredTheme } from "./phone/Settings";
import TitleScreen from "./TitleScreen";

export default function GameRoot() {
  const screen = useGame((s) => s.screen);
  const init = useGame((s) => s.init);
  useStoredTheme();

  const initSession = useSession((s) => s.init);

  useEffect(() => {
    captureReferral();
    // Installable app + saved game files (less data, opens offline). Production only.
    if (process.env.NODE_ENV === "production" && "serviceWorker" in navigator) {
      void navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    void init()
      .then(() => initSession())
      .then(() => startSiteStats(() => ({ city: useGame.getState().game?.city ?? null, playing: useGame.getState().screen === "play" })));
  }, [init, initSession]);

  // Real-time clock
  useEffect(() => {
    if (screen !== "play") return;
    const id = window.setInterval(() => useGame.getState().tick(), 1000);
    const save = () => useGame.getState().save();
    const onVis = () => document.visibilityState === "hidden" && void useGame.getState().flushSave();
    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("beforeunload", save);
    return () => {
      window.clearInterval(id);
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("beforeunload", save);
      save();
    };
  }, [screen]);

  if (screen === "loading") {
    return (
      <div className="min-h-dvh grid place-items-center">
        <div className="font-display text-2xl font-extrabold anim-bob">🚌 Loading Naija…</div>
      </div>
    );
  }
  if (screen === "title") return <TitleScreen />;
  if (screen === "create") return <CharacterCreator />;
  return <GameScreen />;
}
