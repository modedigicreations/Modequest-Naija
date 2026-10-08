"use client";

import { WEATHER_INFO } from "@/game/data/world";
import { careerTitle } from "@/game/goals";
import { gridPowerOn, homePower, mood, moodLabel } from "@/game/helpers";
import { useGame } from "@/game/store";
import { NEED_KEYS, type NeedKey } from "@/game/types";
import { WEEKDAYS, dayOf, formatClock, formatNaira, weekOf, weekdayOf } from "@/game/util";
import Avatar from "./Avatar";
import { Meter } from "./ui";

export const NEED_INFO: Record<NeedKey, { label: string; emoji: string }> = {
  hunger: { label: "Hunger", emoji: "🍲" },
  energy: { label: "Energy", emoji: "⚡" },
  hygiene: { label: "Hygiene", emoji: "🚿" },
  fun: { label: "Fun", emoji: "🎉" },
  social: { label: "Social", emoji: "💬" },
};

export default function TopBar({ onPhone, unread }: { onPhone: () => void; unread: number }) {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const setScreen = useGame((s) => s.setScreen);
  const save = useGame((s) => s.save);

  const w = WEATHER_INFO[game.world.weather];
  const grid = gridPowerOn(game);
  const backup = homePower(game);
  const m = mood(game);
  const ml = moodLabel(m);
  const paused = game.speed === 0;

  return (
    <header className="bg-[var(--card)] border-b border-[var(--line)] px-3 sm:px-4 pt-[max(8px,env(safe-area-inset-top))] pb-2">
      <div className="flex items-center gap-3">
        <div className="hidden sm:block rounded-2xl bg-[var(--bg-2)] shrink-0">
          <Avatar a={game.player.appearance} size={44} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-display font-extrabold text-[17px] leading-none">
              {WEEKDAYS[weekdayOf(game.time)]} {formatClock(game.time)}
            </span>
            <span className="chip">Day {dayOf(game.time)} · Wk {weekOf(game.time)}</span>
            <span className="chip" title={`Weather: ${w.label}`}>
              {w.emoji} <span className="hidden sm:inline">{w.label}</span>
            </span>
            <span
              className={`chip ${grid ? "chip-good" : backup !== "none" ? "chip-info" : "chip-bad"}`}
              title="Electricity at your home (NEPA)"
            >
              {grid ? "⚡ Light" : backup === "solar" ? "🔆 Solar" : backup === "generator" ? "⛽ Gen" : "🕯️ No light"}
            </span>
          </div>
          <div className="text-[12px] text-[var(--ink-2)] truncate mt-1">
            <b>{game.player.name}</b> · {careerTitle(game)} · {ml.emoji} {ml.label}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="font-display font-extrabold text-[17px] leading-none text-[var(--green)]">{formatNaira(game.cash)}</div>
          <div className="text-[11px] text-[var(--muted)] mt-1">🏦 {formatNaira(game.bank)}</div>
        </div>
      </div>

      <div className="flex items-center gap-2 mt-2">
        <div className="grid grid-cols-6 gap-x-1.5 sm:gap-x-2 gap-y-1 flex-1 min-w-0">
          {NEED_KEYS.map((k) => (
            <div key={k} className="min-w-0">
              <div className="text-[10px] font-bold text-[var(--muted)] truncate">
                {NEED_INFO[k].emoji}
                <span className="hidden md:inline"> {NEED_INFO[k].label}</span>
              </div>
              <Meter compact value={game.needs[k]} label={NEED_INFO[k].label} />
            </div>
          ))}
          <div className="min-w-0">
            <div className="text-[10px] font-bold text-[var(--muted)] truncate">
              ❤️<span className="hidden md:inline"> Health</span>
            </div>
            <Meter compact value={game.health} label="Health" color={game.health < 30 ? "var(--coral)" : "var(--purple)"} />
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0" role="group" aria-label="Game speed">
          <button
            className={`btn btn-sm ${paused ? "btn-coral" : "btn-ghost"} w-9 px-0`}
            onClick={() => dispatch({ type: "setSpeed", speed: paused ? 1 : 0 })}
            aria-label={paused ? "Resume" : "Pause"}
            title="Pause (space)"
          >
            {paused ? "▶" : "⏸"}
          </button>
          {([1, 2, 3] as const).map((sp) => (
            <button
              key={sp}
              className={`btn btn-sm w-9 px-0 hidden sm:inline-flex ${game.speed === sp ? "btn-primary" : "btn-ghost"}`}
              onClick={() => dispatch({ type: "setSpeed", speed: sp })}
              aria-label={`Speed ${sp}`}
              title={`Speed ${sp} (key ${sp})`}
            >
              {">".repeat(sp)}
            </button>
          ))}
          <button
            className={`btn btn-sm sm:hidden w-9 px-0 ${game.speed > 1 ? "btn-primary" : "btn-ghost"}`}
            onClick={() => dispatch({ type: "setSpeed", speed: game.speed >= 3 ? 1 : ((game.speed + 1) as 2 | 3) })}
            aria-label="Change speed"
          >
            {game.speed === 0 ? "1×" : `${game.speed}×`}
          </button>
          <button className="btn btn-sm btn-ghost relative hidden lg:inline-flex" onClick={onPhone} title="Phone (P)">
            📱
            {unread > 0 && <span className="absolute -top-1.5 -right-1 min-w-5 h-5 px-1 rounded-full bg-[var(--coral)] text-white text-[11px] grid place-items-center">{unread}</span>}
          </button>
          <button
            className="btn btn-sm btn-ghost hidden sm:inline-flex"
            title="Save & exit to title"
            onClick={() => {
              save();
              setScreen("title");
            }}
          >
            ⏏
          </button>
        </div>
      </div>
      {m < 25 && (
        <div className="text-[11px] mt-1.5 font-semibold text-[var(--coral)]">
          {ml.emoji} You&apos;re struggling — low needs hurt your pay, learning and health.
        </div>
      )}
    </header>
  );
}
