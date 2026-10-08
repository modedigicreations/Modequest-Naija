"use client";

import { useEffect } from "react";
import { useGame } from "@/game/store";
import CharacterCreator from "./CharacterCreator";
import GameScreen from "./GameScreen";
import { useStoredTheme } from "./phone/Settings";
import TitleScreen from "./TitleScreen";

export default function GameRoot() {
  const screen = useGame((s) => s.screen);
  const init = useGame((s) => s.init);
  useStoredTheme();

  useEffect(() => {
    void init();
  }, [init]);

  // Real-time clock
  useEffect(() => {
    if (screen !== "play") return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      useGame.getState().tick(Math.min(1000, now - last));
      last = now;
    }, 200);
    const save = () => useGame.getState().save();
    const onVis = () => document.visibilityState === "hidden" && save();
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
        <div className="font-display text-2xl font-extrabold anim-bob">🚌 Loading Lagos…</div>
      </div>
    );
  }
  if (screen === "title") return <TitleScreen />;
  if (screen === "create") return <CharacterCreator />;
  return <GameScreen />;
}
