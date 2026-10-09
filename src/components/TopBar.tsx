"use client";

import { WEATHER_INFO, getCity, getHome } from "@/game/data/world";
import { careerTitle } from "@/game/goals";
import { gridPowerOn, homePower, mood, moodLabel } from "@/game/helpers";
import { useGame } from "@/game/store";
import { NEED_KEYS, type NeedKey } from "@/game/types";
import { lifeDay } from "@/game/engine";
import { WEEKDAYS, formatClock, formatNaira, weekdayOf } from "@/game/util";
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
  const setScreen = useGame((s) => s.setScreen);
  const save = useGame((s) => s.save);

  const w = WEATHER_INFO[game.world.weather];
  const grid = gridPowerOn(game);
  const backup = homePower(game);
  const m = mood(game);
  const ml = moodLabel(m);

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
            <span className="chip font-bold">
              {getCity(game.city).emoji} {getCity(game.city).name}
            </span>
            <span className="chip" title="Days since you started this life">Day {lifeDay(game)}</span>
            <span className="chip" title={`Weather: ${w.label}`}>
              {w.emoji} <span className="hidden sm:inline">{w.label}</span>
            </span>
            {getHome(game.homeId).city === game.city && (
              <span
                className={`chip ${grid ? "chip-good" : backup !== "none" ? "chip-info" : "chip-bad"}`}
                title="Electricity at your home (NEPA)"
              >
                {grid ? "⚡ Light" : backup === "solar" ? "🔆 Solar" : backup === "generator" ? "⛽ Gen" : "🕯️ No light"}
              </span>
            )}
          </div>
          <div className="text-[12px] text-[var(--ink-2)] truncate mt-1">
            <b>{game.player.name}</b> · {careerTitle(game)} · {ml.emoji} {ml.label}
          </div>
        </div>
        <div className="text-right shrink-0">
          <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--muted)] leading-none">Total money</div>
          <div className="font-display font-extrabold text-[18px] leading-tight text-[var(--green)]" title="Cash in hand + bank balance">
            {formatNaira(game.cash + game.bank)}
          </div>
          <div className="text-[11px] font-semibold text-[var(--ink-2)] whitespace-nowrap">
            <span title="Cash in hand — can be pickpocketed">💵 Cash {formatNaira(game.cash)}</span>
            <span className="text-[var(--muted)]"> · </span>
            <span title="Bank balance — safe, earns interest">🏦 Bank {formatNaira(game.bank)}</span>
          </div>
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

        <div className="flex items-center gap-1 shrink-0">
          <span className="chip chip-good hidden sm:inline-flex" title="Game time is real Nigerian time (WAT). Actions are quick: an 8-hour shift takes 8 minutes.">
            ● Live · WAT
          </span>
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
