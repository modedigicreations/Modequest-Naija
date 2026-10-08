"use client";

import { useEffect } from "react";
import { useGame } from "@/game/store";
import { formatClock } from "@/game/util";
import Academy from "./phone/Academy";
import { BankApp, BusinessApp, InvestApp } from "./phone/MoneyApps";
import { ContactsApp, GoalsApp, HomesApp, JobsApp, ShopApp, SkillsApp } from "./phone/LifeApps";
import MessagesApp from "./phone/Messages";
import SettingsApp from "./phone/Settings";

export type AppId = "messages" | "bank" | "invest" | "jobs" | "business" | "shop" | "homes" | "academy" | "skills" | "goals" | "contacts" | "settings";

const APPS: { id: AppId; name: string; emoji: string; color: string }[] = [
  { id: "messages", name: "Messages", emoji: "💬", color: "#0f9d58" },
  { id: "bank", name: "Bank", emoji: "🏦", color: "#2e86ff" },
  { id: "jobs", name: "Jobs", emoji: "💼", color: "#7b4dff" },
  { id: "academy", name: "Academy", emoji: "🎓", color: "#ff5a4e" },
  { id: "invest", name: "Invest", emoji: "📈", color: "#14b8a6" },
  { id: "business", name: "Business", emoji: "🏪", color: "#f97316" },
  { id: "shop", name: "Shop", emoji: "🛒", color: "#ffc629" },
  { id: "homes", name: "Homes", emoji: "🏠", color: "#a16207" },
  { id: "skills", name: "Skills", emoji: "📘", color: "#0ea5e9" },
  { id: "goals", name: "Goals", emoji: "🌟", color: "#db2777" },
  { id: "contacts", name: "Padis", emoji: "🤝🏾", color: "#65a30d" },
  { id: "settings", name: "Settings", emoji: "⚙️", color: "#64748b" },
];

export default function Phone({ app, setApp }: { app: AppId | "home" | null; setApp: (a: AppId | "home" | null) => void }) {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);

  useEffect(() => {
    if (!app) return;
    const fn = (e: KeyboardEvent) => e.key === "Escape" && setApp(app === "home" ? null : "home");
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [app, setApp]);

  if (!app) return null;
  const unread = game.messages.filter((m) => !m.read || (m.choices && !m.resolved)).length;
  const current = APPS.find((a) => a.id === app);

  return (
    <div className="fixed inset-0 z-40 bg-black/40 lg:bg-transparent lg:pointer-events-none" onClick={() => setApp(null)}>
      <div
        className="pointer-events-auto absolute inset-0 lg:inset-auto lg:right-6 lg:bottom-6 lg:w-[400px] lg:h-[min(780px,calc(100dvh-48px))] lg:rounded-[40px] lg:border-[10px] lg:border-[#1d1530] bg-[var(--bg)] flex flex-col overflow-hidden anim-up"
        style={{ boxShadow: "0 30px 80px rgba(0,0,0,0.35)" }}
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-label="Phone"
      >
        <div className="flex items-center justify-between px-4 pt-[max(10px,env(safe-area-inset-top))] pb-2 bg-[var(--card)] border-b border-[var(--line)]">
          {app === "home" ? (
            <span className="font-display font-extrabold">📱 Phone</span>
          ) : (
            <button className="btn btn-ghost btn-sm" onClick={() => setApp("home")}>
              ← Apps
            </button>
          )}
          <span className="font-bold text-sm">{current ? `${current.emoji} ${current.name}` : formatClock(game.time)}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => setApp(null)} aria-label="Close phone">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto scroll-thin p-3">
          {app === "home" && (
            <div className="grid grid-cols-4 gap-x-2 gap-y-4 pt-2">
              {APPS.map((a) => (
                <button
                  key={a.id}
                  className="flex flex-col items-center gap-1"
                  onClick={() => {
                    setApp(a.id);
                    if (a.id === "messages") dispatch({ type: "markMessagesRead" });
                  }}
                >
                  <span className="relative w-14 h-14 rounded-2xl grid place-items-center text-2xl" style={{ background: a.color, boxShadow: "var(--shadow)" }}>
                    {a.emoji}
                    {a.id === "messages" && unread > 0 && (
                      <span className="absolute -top-1.5 -right-1.5 min-w-5 h-5 px-1 rounded-full bg-[var(--coral)] text-white text-[11px] font-bold grid place-items-center border-2 border-[var(--bg)]">{unread}</span>
                    )}
                  </span>
                  <span className="text-[11px] font-semibold">{a.name}</span>
                </button>
              ))}
            </div>
          )}
          {app === "messages" && <MessagesApp />}
          {app === "bank" && <BankApp />}
          {app === "invest" && <InvestApp />}
          {app === "business" && <BusinessApp />}
          {app === "jobs" && <JobsApp />}
          {app === "shop" && <ShopApp />}
          {app === "homes" && <HomesApp />}
          {app === "academy" && <Academy />}
          {app === "skills" && <SkillsApp />}
          {app === "goals" && <GoalsApp />}
          {app === "contacts" && <ContactsApp />}
          {app === "settings" && <SettingsApp onClose={() => setApp(null)} />}
        </div>
      </div>
    </div>
  );
}
