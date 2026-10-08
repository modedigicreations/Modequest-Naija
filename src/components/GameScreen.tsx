"use client";

import { useCallback, useEffect, useState } from "react";
import { useGame } from "@/game/store";
import BusyBar from "./BusyBar";
import CityMap from "./CityMap";
import EventModal from "./EventModal";
import Phone, { type AppId } from "./Phone";
import PlacePanel from "./PlacePanel";
import Toasts from "./Toasts";
import TopBar from "./TopBar";

export default function GameScreen() {
  const game = useGame((s) => s.game);
  const dispatch = useGame((s) => s.dispatch);
  const [tab, setTab] = useState<"here" | "map">("here");
  const [phoneApp, setPhoneApp] = useState<AppId | "home" | null>(null);

  const unread = game?.messages.filter((m) => !m.read || (m.choices && !m.resolved)).length ?? 0;

  const openPhone = useCallback((app: AppId | "home" = "home") => setPhoneApp(app), []);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement;
      if (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT") return;
      const g = useGame.getState().game;
      if (!g) return;
      if (e.key === "m" || e.key === "M") setTab((x) => (x === "map" ? "here" : "map"));
      else if (e.key === "p" || e.key === "P") setPhoneApp((x) => (x ? null : "home"));
      else if (e.key === " ") {
        e.preventDefault();
        dispatch({ type: "setSpeed", speed: g.speed === 0 ? 1 : 0 });
      } else if (["1", "2", "3"].includes(e.key)) dispatch({ type: "setSpeed", speed: Number(e.key) as 1 | 2 | 3 });
    };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [dispatch]);

  if (!game) return null;

  return (
    <div className="h-dvh flex flex-col overflow-hidden">
      <TopBar onPhone={() => openPhone()} unread={unread} />

      <main className="flex-1 min-h-0 grid lg:grid-cols-[minmax(0,1fr)_440px]">
        <section className={`${tab === "map" ? "flex" : "hidden"} lg:flex min-h-0 flex-col`}>
          <CityMap active={tab === "map"} onArrivePlan={() => setTab("here")} />
        </section>
        <section className={`${tab === "here" ? "flex" : "hidden"} lg:flex min-h-0 flex-col lg:border-l border-[var(--line)] bg-[var(--bg)]`}>
          <PlacePanel onOpenMap={() => setTab("map")} onOpenPhone={openPhone} />
        </section>
      </main>

      <BusyBar />

      {/* Mobile bottom navigation */}
      <nav className="lg:hidden grid grid-cols-3 gap-2 px-3 pt-2 pb-[max(10px,env(safe-area-inset-bottom))] border-t border-[var(--line)] bg-[var(--card)]">
        <button className={`btn btn-sm py-2.5 ${tab === "here" ? "btn-primary" : "btn-ghost"}`} onClick={() => setTab("here")}>
          📍 Here
        </button>
        <button className={`btn btn-sm py-2.5 ${tab === "map" ? "btn-primary" : "btn-ghost"}`} onClick={() => setTab("map")}>
          🗺️ Map
        </button>
        <button className="btn btn-sm py-2.5 btn-ghost relative" onClick={() => openPhone()}>
          📱 Phone
          {unread > 0 && <span className="absolute -top-1.5 -right-1 min-w-5 h-5 px-1 rounded-full bg-[var(--coral)] text-white text-[11px] grid place-items-center">{unread}</span>}
        </button>
      </nav>

      <Phone app={phoneApp} setApp={setPhoneApp} />
      <EventModal />
      <Toasts />
    </div>
  );
}
