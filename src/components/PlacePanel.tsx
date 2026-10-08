"use client";

import { useState } from "react";
import { activitiesHere, intercityQuote, isOpen, kindsHere, placeOf, shiftStatus, workplaceFor } from "@/game/engine";
import { getCareer } from "@/game/data/economy";
import { localActivity } from "@/game/data/activities";
import { INTERACTIONS, type InteractionId, npcsAt } from "@/game/data/people";
import { CITIES, getCity, getLocation, transportIn } from "@/game/data/world";
import { friendshipTier, groceryCapacity, home, price } from "@/game/helpers";
import { useGame } from "@/game/store";
import type { NeedKey } from "@/game/types";
import { WEEKDAYS_LONG, formatClock, formatDuration, formatHour, formatNaira, hourOf, weekOf, weekdayOf } from "@/game/util";
import type { AppId } from "./Phone";
import ShiftModal from "./ShiftModal";
import PlayersHere from "./online/PlayersHere";
import { NEED_INFO } from "./TopBar";
import { Meter, SectionTitle } from "./ui";

const LOG_ICON = { info: "•", good: "✅", bad: "⚠️", money: "💸", learn: "💡" } as const;

export default function PlacePanel({ onOpenMap, onOpenPhone }: { onOpenMap: () => void; onOpenPhone: (app: AppId) => void }) {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const [shiftOpen, setShiftOpen] = useState(false);

  if (game.travel) {
    const t = transportIn(game.city, game.travel.mode);
    const dest = game.travel.toCity && game.travel.toCity !== game.city ? getCity(game.travel.toCity).name : placeOf(game.travel.to, game).name;
    return (
      <div className="flex-1 overflow-y-auto scroll-thin p-4">
        <div className="card p-5 text-center">
          <div className="text-5xl anim-bob">{t.emoji}</div>
          <h2 className="font-display text-xl font-extrabold mt-2">On the road</h2>
          <p className="text-sm text-[var(--ink-2)] mt-1">
            {t.name} to <b>{dest}</b>. Arriving {formatClock(game.travel.end)}.
          </p>
          <p className="text-xs text-[var(--muted)] mt-3">{t.blurb}</p>
          <button className="btn btn-ghost btn-sm mt-4" onClick={onOpenMap}>
            🗺️ Watch on map
          </button>
        </div>
        <Feed />
      </div>
    );
  }

  const isHome = game.location === "home";
  const loc = getLocation(game.location);
  const place = placeOf(game.location, game);
  const open = isHome || (loc ? isOpen(loc, game.time) : true);
  const acts = activitiesHere(game);
  const people = isHome ? [] : npcsAt(game.location, weekdayOf(game.time), hourOf(game.time));
  const career = game.career ? getCareer(game.career.careerId) : null;
  const shift = shiftStatus(game);
  const groceryUnit = loc?.groceryPrice;
  const kinds = kindsHere(game);
  const workplace = career ? workplaceFor(game, career.workplace) : undefined;
  const h = home(game);
  const rentDue = h.weeklyRent > 0 && (game.flags.rentPaidThroughWeek ?? 0) < weekOf(game.time);

  return (
    <div className="flex-1 overflow-y-auto scroll-thin p-3 sm:p-4 space-y-3">
      {/* Header */}
      <div className="card p-4">
        <div className="flex items-start gap-3">
          <div className="w-14 h-14 rounded-2xl bg-[var(--bg-2)] grid place-items-center text-3xl shrink-0">{place.emoji}</div>
          <div className="min-w-0 flex-1">
            <h2 className="font-display text-xl font-extrabold leading-tight">{isHome ? h.name : place.name}</h2>
            <div className="text-xs text-[var(--ink-2)] mt-0.5">
              {isHome ? `${h.area} · Band ${h.band} power · ${h.weeklyRent ? formatNaira(price(game, h.weeklyRent, false)) + "/week" : "rent-free"}` : `${loc?.area} · ${loc && loc.open === loc.close ? "Open 24/7" : `${formatHour(loc!.open)}–${formatHour(loc!.close)}`}`}
              {!open && <b className="text-[var(--coral)]"> · Closed now</b>}
            </div>
          </div>
          <button className="btn btn-ghost btn-sm lg:hidden" onClick={onOpenMap}>
            🗺️ Go
          </button>
        </div>
        {loc && <p className="text-sm text-[var(--ink-2)] mt-3">{loc.blurb}</p>}
        {isHome && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            <span className="chip">🥫 Foodstuff {game.groceries}/{groceryCapacity(game)}</span>
            <span className={`chip ${rentDue ? "chip-bad" : "chip-good"}`}>
              {h.weeklyRent === 0 ? "No rent" : rentDue ? `Rent due Saturday` : `Rent paid to wk ${game.flags.rentPaidThroughWeek}`}
            </span>
            {game.items.map((i) => (
              <span key={i} className="chip chip-info">
                {i.replace("_", " ")}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Work */}
      {career && (
        <div className="card p-4">
          <SectionTitle right={<span className="chip">{career.emoji} {career.name}</span>}>💼 Work</SectionTitle>
          <div className="text-sm">
            <b>{career.levels[game.career!.level].title}</b> · {career.days.map((d) => WEEKDAYS_LONG[d].slice(0, 3)).join(", ")} · {career.start}:00 for {career.hours}h at{" "}
            {workplace?.name ?? `(no workplace in ${getCity(game.city).name})`}
          </div>
          <div className="mt-2">
            <Meter value={game.career!.performance} label="Performance" emoji="📊" />
          </div>
          <div className="flex items-center justify-between gap-3 mt-3">
            <span className={`text-sm font-semibold ${shift.canStart ? (shift.late ? "text-[var(--coral)]" : "text-[var(--green)]") : "text-[var(--muted)]"}`}>{shift.reason}</span>
            {shift.canStart ? (
              <button className="btn btn-green" onClick={() => setShiftOpen(true)}>
                Start shift
              </button>
            ) : game.location !== career.workplace && shift.workday && !shift.reason.includes("Already") && !shift.reason.includes("missed") ? (
              <button className="btn btn-ghost btn-sm" onClick={onOpenMap}>
                Go to work
              </button>
            ) : null}
          </div>
        </div>
      )}

      {/* Market */}
      {groceryUnit && (
        <div className="card p-4">
          <SectionTitle right={<span className="chip">Pantry {game.groceries}/{groceryCapacity(game)}</span>}>🥫 Foodstuff</SectionTitle>
          <p className="text-xs text-[var(--ink-2)] mb-3">
            {formatNaira(price(game, groceryUnit))} per pack. Cook at home (or eat bread & tea) — far cheaper than eating out every day.
          </p>
          <div className="flex gap-2">
            {[1, 3].map((n) => (
              <button key={n} className="btn btn-primary btn-sm flex-1" disabled={!open} onClick={() => dispatch({ type: "buyGroceries", packs: n })}>
                Buy {n} · {formatNaira(price(game, groceryUnit) * n)}
              </button>
            ))}
          </div>
        </div>
      )}
      {(kinds.includes("motor_park") || kinds.includes("airport")) && <IntercityCard mode={kinds.includes("airport") ? "flight" : "coach"} open={open} />}
      {kinds.includes("gadget_market") && (
        <button className="card p-4 w-full text-left" onClick={() => onOpenPhone("shop")}>
          <div className="font-bold">📱 Gadgets are 20% cheaper here</div>
          <div className="text-xs text-[var(--ink-2)] mt-1">Open the Shop app while you&apos;re here. But beware fakes — your Business skill helps you spot them.</div>
        </button>
      )}
      {kinds.includes("bank") && (
        <button className="card p-4 w-full text-left" onClick={() => onOpenPhone("bank")}>
          <div className="font-bold">🏦 Banking hall</div>
          <div className="text-xs text-[var(--ink-2)] mt-1">Manage savings and loans in your Bank app — available anywhere.</div>
        </button>
      )}

      {/* Activities */}
      <div className="card p-4">
        <SectionTitle>{isHome ? "🏠 At home" : "✨ Things to do"}</SectionTitle>
        {acts.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">Nothing to do here.</p>
        ) : (
          <div className="grid gap-2">
            {acts.map(({ def, cost, ok, reason, progress }) => {
              const lc = localActivity(def, game.city);
              return (
              <button
                key={def.id}
                disabled={!ok}
                onClick={() => dispatch({ type: "startActivity", activityId: def.id })}
                className="text-left rounded-2xl border-[1.5px] border-[var(--line)] bg-[var(--card-2)] p-3 disabled:opacity-55 hover:border-[var(--danfo)] transition-colors"
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl">{lc.emoji}</span>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm">{lc.name}</span>
                      <span className="text-xs font-semibold text-[var(--ink-2)] shrink-0">
                        {formatDuration(def.duration)}
                        {cost ? ` · ${formatNaira(cost)}` : ""}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {Object.entries(def.needs ?? {}).map(([k, v]) => (
                        <span key={k} className={`chip ${v! > 0 ? "chip-good" : "chip-bad"}`}>
                          {NEED_INFO[k as NeedKey].emoji} {v! > 0 ? "+" : ""}
                          {v}
                        </span>
                      ))}
                      {Object.keys(def.skills ?? {}).map((k) => (
                        <span key={k} className="chip chip-info">
                          📘 {k}
                        </span>
                      ))}
                      {def.cashGain && <span className="chip chip-good">💵 earn</span>}
                      {progress && <span className="chip">🎓 {progress}</span>}
                      {!ok && reason && <span className="chip chip-bad">{reason}</span>}
                    </div>
                  </div>
                </div>
              </button>
              );
            })}
          </div>
        )}
      </div>

      {/* People */}
      {!isHome && (
        <div className="card p-4">
          <SectionTitle>👥 People here</SectionTitle>
          {people.length === 0 ? (
            <p className="text-sm text-[var(--muted)]">Nobody you know is around right now. People keep schedules — check back at other times.</p>
          ) : (
            <div className="grid gap-2">
              {people.map((n) => {
                const r = game.relationships[n.id];
                const f = r?.friendship ?? 0;
                return (
                  <div key={n.id} className="rounded-2xl bg-[var(--card-2)] p-3">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{n.emoji}</span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-bold">{n.name}</span>
                          <span className="text-[11px] font-semibold text-[var(--ink-2)]">{r?.met ? friendshipTier(f) : "New face"}</span>
                        </div>
                        <div className="text-xs text-[var(--muted)]">{n.role}</div>
                        <div className="mt-1.5">
                          <Meter compact value={f} label={`Friendship with ${n.name}`} color="var(--purple)" />
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-2.5">
                      {(Object.keys(INTERACTIONS) as InteractionId[]).map((id) => {
                        const it = INTERACTIONS[id];
                        const adviceUsed = id === "advice" && r?.adviceDay === Math.floor(game.time / 1440) + 1;
                        return (
                          <button
                            key={id}
                            title={it.blurb}
                            disabled={!!game.activity || adviceUsed}
                            className="btn btn-ghost btn-sm"
                            onClick={() => dispatch({ type: "talk", npcId: n.id, interaction: id })}
                          >
                            {it.emoji} {it.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      <PlayersHere />
      <Feed />
      {shiftOpen && <ShiftModal onClose={() => setShiftOpen(false)} />}
    </div>
  );
}

function Feed() {
  const log = useGame((s) => s.game!.log);
  const recent = log.slice(-8).reverse();
  return (
    <div className="card p-4">
      <SectionTitle>📰 Your feed</SectionTitle>
      <ul className="space-y-1.5">
        {recent.map((e) => (
          <li key={e.id} className="text-[13px] flex gap-2">
            <span className="text-[var(--muted)] text-[11px] w-14 shrink-0 pt-0.5">{formatClock(e.t)}</span>
            <span>
              {LOG_ICON[e.kind]} {e.text}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function IntercityCard({ mode, open }: { mode: "coach" | "flight"; open: boolean }) {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const others = CITIES.filter((c) => c.id !== game.city);
  return (
    <div className="card p-4">
      <SectionTitle>{mode === "coach" ? "🚌 Travel by road" : "✈️ Book a flight"}</SectionTitle>
      <p className="text-xs text-[var(--ink-2)] mb-3">
        {mode === "coach" ? "Cheap but long. You arrive tired at the other city's motor park." : "Fast but expensive. Arrive at the other city's airport."} Your home and job stay where they are.
      </p>
      <div className="grid gap-2">
        {others.map((c) => {
          const r = intercityQuote(game, c.id, mode);
          if (!r) return null;
          const fare = r.fare;
          return (
            <button
              key={c.id}
              disabled={!open || !!game.activity}
              className="btn btn-ghost justify-between w-full py-2"
              onClick={() => confirm(`Travel to ${c.name} for ${formatNaira(fare)}? It takes about ${formatDuration(r.minutes)}.`) && dispatch({ type: "intercity", to: c.id, mode })}
            >
              <span>
                {c.emoji} {c.name}
              </span>
              <span className="text-xs font-semibold text-[var(--ink-2)]">
                {formatDuration(r.minutes)} · {formatNaira(fare)}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
