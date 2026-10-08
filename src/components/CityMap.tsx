"use client";

import { useEffect, useRef, useState } from "react";
import { atHomeCity, isOpen, placeOf, travelOptions, workplaceFor } from "@/game/engine";
import { getCareer } from "@/game/data/economy";
import { npcsAt } from "@/game/data/people";
import { type MapShape, getCity, getLocation, LOCATIONS } from "@/game/data/world";
import { useGame } from "@/game/store";
import { formatClock, formatDuration, formatHour, formatNaira, hourOf, weekdayOf } from "@/game/util";
import Avatar from "./Avatar";
import NigeriaMap from "./NigeriaMap";
import { usePresence } from "@/online/presence";

const FILL: Record<MapShape["fill"], string> = {
  land: "var(--land)",
  land2: "var(--land-2)",
  lagoon: "var(--lagoon)",
  ocean: "var(--ocean)",
  hill: "color-mix(in oklab, var(--land-2) 70%, #7a5c3a 30%)",
  green: "color-mix(in oklab, var(--land) 55%, #3fae5a 45%)",
};

/** Roads for cities without hand-drawn ones: link each place to its 2 nearest neighbours. */
function autoRoads(points: { x: number; y: number }[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  points.forEach((p, i) => {
    const near = points
      .map((q, j) => ({ j, d: Math.hypot(p.x - q.x, p.y - q.y) }))
      .filter((n) => n.j !== i)
      .sort((a, b) => a.d - b.d)
      .slice(0, 2);
    for (const { j } of near) {
      const key = [i, j].sort((a, b) => a - b).join("-");
      if (seen.has(key)) continue;
      seen.add(key);
      const q = points[j];
      // Slight curve so roads look drawn, not ruled.
      const mx = (p.x + q.x) / 2 + (q.y - p.y) * 0.08;
      const my = (p.y + q.y) / 2 - (q.x - p.x) * 0.08;
      out.push(`M${p.x} ${p.y} Q${mx.toFixed(0)} ${my.toFixed(0)} ${q.x} ${q.y}`);
    }
  });
  return out;
}

function shortName(name: string) {
  if (name.length <= 20) return name;
  let out = "";
  for (const w of name.split(" ")) {
    if ((out + " " + w).trim().length > 18) break;
    out = (out + " " + w).trim();
  }
  return out || name.slice(0, 18);
}

function hoursLabel(open: number, close: number) {
  if (open === close) return "Open 24/7";
  return `${formatHour(open)}–${formatHour(close)}`;
}

export default function CityMap({ onArrivePlan, active }: { onArrivePlan: () => void; active: boolean }) {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const onlinePlayers = usePresence((s) => s.players);
  // Selection is remembered per city, so it clears itself when you change city.
  const [picked, setPicked] = useState<{ city: string; id: string } | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const fn = () => setWide(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const city = getCity(game.city);
  const selected = picked?.city === game.city ? picked.id : null;
  const setSelected = (id: string | null) => setPicked(id ? { city: game.city, id } : null);
  const wd = weekdayOf(game.time);
  const hr = hourOf(game.time);
  const showHome = atHomeCity(game);
  const homeP = placeOf("home", game);
  const intercity = game.travel?.toCity && game.travel.toCity !== game.city ? game.travel : null;
  const travelProgress = game.travel ? Math.min(1, (game.time - game.travel.start) / Math.max(1, game.travel.end - game.travel.start)) : 0;

  // Player marker position (interpolated while travelling inside the city)
  let px: number;
  let py: number;
  if (game.travel && !intercity) {
    const a = placeOf(game.travel.from, game);
    const b = placeOf(game.travel.to, game);
    px = a.x + (b.x - a.x) * travelProgress;
    py = a.y + (b.y - a.y) * travelProgress;
  } else {
    const p = placeOf(game.location, game);
    px = p.x;
    py = p.y;
  }

  const sel = selected ? placeOf(selected, game) : null;
  const selLoc = selected && selected !== "home" ? getLocation(selected) : null;
  const options = selected && selected !== game.location && !game.travel ? travelOptions(game, selected) : [];
  const people = selected ? npcsAt(selected, wd, hr) : [];
  const workId = game.career ? workplaceFor(game, getCareer(game.career.careerId)!.workplace)?.id : undefined;
  const night = hr < 6 || hr >= 19;

  // On phones the map scrolls sideways; start centred on the player.
  useEffect(() => {
    const el = scroller.current;
    if (!el || wide || !active) return;
    const scale = el.scrollHeight / 700;
    el.scrollLeft = px * scale - el.clientWidth / 2;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wide, active, game.location, game.city]);


  if (intercity) {
    return (
      <div className="flex-1 min-h-0 flex flex-col items-center justify-center p-4 gap-3" style={{ background: "var(--lagoon)" }}>
        <NigeriaMap className="w-full max-w-[560px] max-h-[70%]" highlight={game.city} travel={{ from: game.city, to: intercity.toCity!, progress: travelProgress }} />
        <div className="card px-4 py-2 text-sm font-semibold">
          {intercity.mode === "flight" ? "✈️ Flying" : "🚌 On the road"} to {getCity(intercity.toCity!).name} · arriving {formatClock(intercity.end)}
        </div>
      </div>
    );
  }

  const places = LOCATIONS.filter((l) => l.city === city.id);
  const roads = city.map.roads.length ? city.map.roads : autoRoads(showHome ? [...places, homeP] : places);

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      <div ref={scroller} className="flex-1 min-h-0 overflow-auto scroll-thin">
        <svg
          viewBox="0 0 1000 700"
          className={wide ? "w-full h-full select-none" : "h-full w-auto max-w-none aspect-[10/7] min-h-[420px] select-none"}
          preserveAspectRatio={wide ? "xMidYMid slice" : "xMidYMid meet"}
          role="img"
          aria-label={`Map of ${city.name}`}
        >
          <defs>
            <pattern id="waves" width="40" height="20" patternUnits="userSpaceOnUse">
              <path d="M0 10 Q10 4 20 10 T40 10" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
            </pattern>
          </defs>
          <rect width="1000" height="700" fill={city.map.base === "lagoon" ? "var(--lagoon)" : "var(--land)"} />
          {city.map.base === "lagoon" && <rect width="1000" height="700" fill="url(#waves)" />}
          {city.map.shapes.map((sh, i) => (
            <path key={i} d={sh.d} fill={FILL[sh.fill]} stroke={sh.fill === "land" ? "var(--land-2)" : "none"} strokeWidth={sh.fill === "land" ? 6 : 0} />
          ))}
          {city.map.shapes.some((sh) => sh.fill === "lagoon" || sh.fill === "ocean") && city.map.base === "land" && (
            <g>
              {city.map.shapes
                .filter((sh) => sh.fill === "lagoon" || sh.fill === "ocean")
                .map((sh, i) => (
                  <path key={i} d={sh.d} fill="url(#waves)" />
                ))}
            </g>
          )}
          <g fill="none" stroke="var(--road)" strokeWidth="7" strokeLinecap="round" opacity="0.9">
            {roads.map((d, i) => (
              <path key={i} d={d} />
            ))}
          </g>
          {city.map.bridges?.map((d, i) => (
            <g key={i} fill="none" strokeLinecap="round">
              <path d={d} stroke="var(--road)" strokeWidth="9" />
              <path d={d} stroke="var(--ink-2)" strokeWidth="1.5" strokeDasharray="6 8" opacity="0.5" />
            </g>
          ))}
          {city.map.labels.map((l) => (
            <text
              key={l.text}
              x={l.x}
              y={l.y}
              fontSize={l.kind === "water" ? 20 : 13}
              fontWeight="800"
              letterSpacing={l.kind === "water" ? 4 : 2.5}
              fill={l.kind === "water" ? "rgba(255,255,255,0.8)" : "var(--ink)"}
              opacity={l.kind === "area" ? 0.28 : l.kind === "feature" ? 0.5 : 1}
              textAnchor="middle"
              transform={l.rotate ? `rotate(${l.rotate} ${l.x} ${l.y})` : undefined}
            >
              {l.text}
            </text>
          ))}

          {game.travel && (
            <line x1={placeOf(game.travel.from, game).x} y1={placeOf(game.travel.from, game).y} x2={placeOf(game.travel.to, game).x} y2={placeOf(game.travel.to, game).y} stroke="var(--danfo)" strokeWidth="5" strokeDasharray="10 8" strokeLinecap="round" />
          )}

          {showHome && (
            <g className="cursor-pointer" onClick={() => setSelected("home")}>
              <circle cx={homeP.x} cy={homeP.y} r="22" fill="var(--green)" stroke="#fff" strokeWidth="4" />
              <text x={homeP.x} y={homeP.y + 7} fontSize="20" textAnchor="middle">
                🏠
              </text>
            </g>
          )}

          {places.map((l) => {
            const open = isOpen(l, game.time);
            const here = npcsAt(l.id, wd, hr);
            const friends = here.filter((n) => (game.relationships[n.id]?.friendship ?? 0) >= 50).length;
            const isWork = l.id === workId;
            const realHere = onlinePlayers.filter((p) => p.location === l.id).length;
            return (
              <g key={l.id} className="cursor-pointer" onClick={() => setSelected(l.id)} opacity={open ? 1 : 0.55}>
                {selected === l.id && <circle cx={l.x} cy={l.y} r="28" fill="none" stroke="var(--ink)" strokeWidth="3" />}
                <circle cx={l.x} cy={l.y} r="20" fill="var(--card)" stroke={isWork ? "var(--sky)" : "var(--ink)"} strokeWidth={isWork ? 4 : 2} />
                <text x={l.x} y={l.y + 7} fontSize="19" textAnchor="middle">
                  {l.emoji}
                </text>
                {here.length > 0 && (
                  <g>
                    <circle cx={l.x + 16} cy={l.y - 16} r="10" fill={friends ? "var(--green)" : "var(--purple)"} stroke="#fff" strokeWidth="2" />
                    <text x={l.x + 16} y={l.y - 12} fontSize="11" fontWeight="800" textAnchor="middle" fill="#fff">
                      {here.length}
                    </text>
                  </g>
                )}
                {realHere > 0 && (
                  <g>
                    <circle cx={l.x - 16} cy={l.y - 16} r="10" fill="var(--danfo)" stroke="#fff" strokeWidth="2" />
                    <text x={l.x - 16} y={l.y - 12} fontSize="11" fontWeight="800" textAnchor="middle" fill="var(--danfo-ink)">
                      {realHere}
                    </text>
                  </g>
                )}
                <text x={l.x} y={l.y + 36} fontSize="12" fontWeight="700" textAnchor="middle" fill="var(--ink)" stroke="var(--land)" strokeWidth="4" paintOrder="stroke">
                  {shortName(l.name)}
                </text>
              </g>
            );
          })}

          <g transform={`translate(${px - 18} ${py - 58})`} className="pointer-events-none">
            {!game.travel && <circle cx="18" cy="58" r="20" fill="var(--danfo)" className="pulse-ring" />}
            <g className="anim-bob">
              <circle cx="18" cy="20" r="21" fill="var(--danfo)" stroke="#fff" strokeWidth="3" />
              <foreignObject x="0" y="-2" width="36" height="44">
                <Avatar a={game.player.appearance} size={36} />
              </foreignObject>
            </g>
          </g>

          {night && <rect width="1000" height="700" fill="#0b0730" opacity="0.18" pointerEvents="none" />}
        </svg>
      </div>

      <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap pointer-events-none">
        <span className="chip bg-[var(--card)] font-bold">
          {city.emoji} {city.name}
        </span>
        <span className="chip bg-[var(--card)]">Tap a place to travel</span>
        <span className="chip bg-[var(--card)]">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--purple)] inline-block" /> people
        </span>
      </div>

      {selected && sel && (
        <div className="absolute inset-x-2 bottom-2 sm:left-auto sm:right-3 sm:bottom-3 sm:w-[380px] card p-4 anim-up max-h-[75%] overflow-y-auto scroll-thin" style={{ boxShadow: "var(--shadow)" }}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="font-display text-lg font-extrabold">
                {sel.emoji} {sel.name}
              </div>
              {selLoc ? (
                <div className="text-xs text-[var(--ink-2)] mt-0.5">
                  {selLoc.area} · {hoursLabel(selLoc.open, selLoc.close)}
                  {selLoc.days && selLoc.days.length < 7 ? (selLoc.days.length === 5 ? " · Mon–Fri" : " · Closed Sun") : ""} ·{" "}
                  <b className={isOpen(selLoc, game.time) ? "text-[var(--green)]" : "text-[var(--coral)]"}>{isOpen(selLoc, game.time) ? "Open" : "Closed"}</b>
                </div>
              ) : (
                <div className="text-xs text-[var(--ink-2)] mt-0.5">Your home</div>
              )}
            </div>
            <button className="btn btn-ghost btn-sm" onClick={() => setSelected(null)} aria-label="Close">
              ✕
            </button>
          </div>
          {selLoc && <p className="text-sm text-[var(--ink-2)] mt-2">{selLoc.blurb}</p>}
          {people.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {people.map((n) => (
                <span key={n.id} className="chip">
                  {n.emoji} {n.name}
                </span>
              ))}
            </div>
          )}

          {selected === game.location && !game.travel ? (
            <button className="btn btn-primary w-full mt-3" onClick={() => { setSelected(null); onArrivePlan(); }}>
              📍 You&apos;re here — see what to do
            </button>
          ) : game.travel ? (
            <p className="text-sm text-[var(--muted)] mt-3">You&apos;re already on the move.</p>
          ) : (
            <div className="mt-3 grid gap-1.5">
              {options.map((o) => (
                <button
                  key={o.mode}
                  disabled={!o.ok || !!game.activity}
                  title={o.blurb}
                  onClick={() => {
                    if (dispatch({ type: "travel", to: selected, mode: o.mode })) setSelected(null);
                  }}
                  className="btn btn-ghost justify-between w-full py-2"
                >
                  <span>
                    {o.emoji} {o.name}
                  </span>
                  <span className="text-xs font-semibold text-[var(--ink-2)]">{o.ok ? `${formatDuration(o.minutes)} · ${o.fare ? formatNaira(o.fare) : "Free"}` : o.reason}</span>
                </button>
              ))}
              {game.activity && <p className="text-xs text-[var(--coral)]">Finish or stop your current activity first.</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
