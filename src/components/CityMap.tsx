"use client";

import { useEffect, useRef, useState } from "react";
import { isOpen, placeOf, travelOptions } from "@/game/engine";
import { getCareer } from "@/game/data/economy";
import { npcsAt } from "@/game/data/people";
import { LOCATIONS, getLocation } from "@/game/data/world";
import { useGame } from "@/game/store";
import { formatDuration, formatHour, formatNaira, hourOf, weekdayOf } from "@/game/util";
import Avatar from "./Avatar";

const AREA_LABELS: [string, number, number][] = [
  ["IKEJA", 330, 70],
  ["MUSHIN", 190, 250],
  ["YABA", 540, 372],
  ["SURULERE", 290, 470],
  ["AKOKA", 560, 290],
  ["LAGOS ISLAND", 520, 596],
  ["IKOYI", 628, 446],
  ["VICTORIA ISLAND", 742, 622],
  ["LEKKI", 900, 580],
];

function hoursLabel(open: number, close: number) {
  if (open === close) return "Open 24/7";
  return `${formatHour(open)}–${formatHour(close)}`;
}

export default function CityMap({ onArrivePlan, active }: { onArrivePlan: () => void; active: boolean }) {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const [selected, setSelected] = useState<string | null>(null);
  const scroller = useRef<HTMLDivElement>(null);
  const [wide, setWide] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const fn = () => setWide(mq.matches);
    fn();
    mq.addEventListener("change", fn);
    return () => mq.removeEventListener("change", fn);
  }, []);

  const wd = weekdayOf(game.time);
  const hr = hourOf(game.time);
  const homeP = placeOf("home", game);

  // Player marker position (interpolated while travelling)
  let px: number;
  let py: number;
  if (game.travel) {
    const a = placeOf(game.travel.from, game);
    const b = placeOf(game.travel.to, game);
    const f = Math.min(1, (game.time - game.travel.start) / Math.max(1, game.travel.end - game.travel.start));
    px = a.x + (b.x - a.x) * f;
    py = a.y + (b.y - a.y) * f;
  } else {
    const p = placeOf(game.location, game);
    px = p.x;
    py = p.y;
  }

  const sel = selected ? placeOf(selected, game) : null;
  const selLoc = selected && selected !== "home" ? getLocation(selected) : null;
  const options = selected && selected !== game.location && !game.travel ? travelOptions(game, selected) : [];
  const people = selected ? npcsAt(selected, wd, hr) : [];

  const night = hr < 6 || hr >= 19;

  // On phones the map scrolls sideways; start centred on the player.
  useEffect(() => {
    const el = scroller.current;
    if (!el || wide || !active) return;
    const scale = el.scrollHeight / 700;
    el.scrollLeft = px * scale - el.clientWidth / 2;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wide, active, game.location]);

  return (
    <div className="relative flex-1 min-h-0 flex flex-col">
      <div ref={scroller} className="flex-1 min-h-0 overflow-auto scroll-thin">
        <svg
          viewBox="0 0 1000 700"
          className={wide ? "w-full h-full select-none" : "h-full w-auto max-w-none aspect-[10/7] min-h-[420px] select-none"}
          preserveAspectRatio={wide ? "xMidYMid slice" : "xMidYMid meet"}
          role="img"
          aria-label="Map of Lagos"
        >
          <defs>
            <pattern id="waves" width="40" height="20" patternUnits="userSpaceOnUse">
              <path d="M0 10 Q10 4 20 10 T40 10" fill="none" stroke="rgba(255,255,255,0.35)" strokeWidth="1.5" />
            </pattern>
          </defs>
          {/* Water */}
          <rect width="1000" height="700" fill="var(--lagoon)" />
          <rect y="560" width="1000" height="140" fill="var(--ocean)" />
          <rect width="1000" height="700" fill="url(#waves)" />
          {/* Mainland */}
          <path
            d="M0 0 H600 C592 110 612 200 602 262 C592 330 566 380 532 418 C505 448 480 500 440 520 C380 548 300 562 200 572 C120 578 60 585 0 590 Z"
            fill="var(--land)"
            stroke="var(--land-2)"
            strokeWidth="6"
          />
          {/* Island strip: Lagos Island, Ikoyi, VI, Lekki */}
          <path
            d="M478 522 C520 486 598 470 640 440 C690 402 760 420 800 470 C850 500 920 492 1000 482 V652 C900 644 800 642 700 627 C620 614 560 604 502 592 C468 572 468 540 478 522 Z"
            fill="var(--land)"
            stroke="var(--land-2)"
            strokeWidth="6"
          />
          {/* Banana Island */}
          <ellipse cx="724" cy="392" rx="34" ry="20" fill="var(--land)" stroke="var(--land-2)" strokeWidth="5" />
          {/* Roads */}
          <g fill="none" stroke="var(--road)" strokeWidth="7" strokeLinecap="round" opacity="0.9">
            <path d="M300 128 C320 200 280 260 250 282 C300 330 330 360 330 392" />
            <path d="M378 102 C420 180 450 240 482 290 C480 330 470 400 452 478" />
            <path d="M250 282 C330 300 400 300 482 290 C500 285 525 260 545 238" />
            <path d="M330 392 C360 410 380 425 392 430 C420 450 440 470 452 478" />
            <path d="M526 540 C590 515 620 490 692 452 C700 500 740 540 770 552 C810 560 850 540 880 528" />
            <path d="M612 500 C610 530 630 550 652 566" />
            <path d="M770 552 C800 580 820 600 836 612" />
          </g>
          {/* Bridges */}
          <g fill="none" strokeLinecap="round">
            <path d="M598 168 C650 260 620 400 562 492" stroke="var(--road)" strokeWidth="9" />
            <path d="M598 168 C650 260 620 400 562 492" stroke="var(--ink-2)" strokeWidth="1.5" strokeDasharray="6 8" opacity="0.5" />
            <path d="M452 478 C470 495 490 505 520 520" stroke="var(--road)" strokeWidth="9" />
            <path d="M692 452 C700 430 712 410 720 398" stroke="var(--road)" strokeWidth="7" />
          </g>
          <text x="640" y="300" fontSize="13" fontWeight="700" fill="var(--ink-2)" opacity="0.5" transform="rotate(-68 640 300)">
            THIRD MAINLAND BRIDGE
          </text>
          <text x="690" y="250" fontSize="20" fontWeight="800" fill="rgba(255,255,255,0.75)" letterSpacing="4">
            LAGOS LAGOON
          </text>
          <text x="640" y="684" fontSize="18" fontWeight="800" fill="rgba(255,255,255,0.75)" letterSpacing="4">
            ATLANTIC OCEAN
          </text>
          {AREA_LABELS.map(([t, x, y]) => (
            <text key={t} x={x} y={y} fontSize="13" fontWeight="800" letterSpacing="2.5" fill="var(--ink)" opacity="0.28" textAnchor="middle">
              {t}
            </text>
          ))}

          {/* Travel route */}
          {game.travel && (
            <line
              x1={placeOf(game.travel.from, game).x}
              y1={placeOf(game.travel.from, game).y}
              x2={placeOf(game.travel.to, game).x}
              y2={placeOf(game.travel.to, game).y}
              stroke="var(--danfo)"
              strokeWidth="5"
              strokeDasharray="10 8"
              strokeLinecap="round"
            />
          )}

          {/* Home */}
          <g className="cursor-pointer" onClick={() => setSelected("home")}>
            <circle cx={homeP.x} cy={homeP.y} r="22" fill="var(--green)" stroke="#fff" strokeWidth="4" />
            <text x={homeP.x} y={homeP.y + 7} fontSize="20" textAnchor="middle">
              🏠
            </text>
          </g>

          {/* Places */}
          {LOCATIONS.map((l) => {
            const open = isOpen(l, game.time);
            const here = npcsAt(l.id, wd, hr);
            const friends = here.filter((n) => (game.relationships[n.id]?.friendship ?? 0) >= 50).length;
            const isWork = !!game.career && getCareer(game.career.careerId)?.workplace === l.id;
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
                <text x={l.x} y={l.y + 36} fontSize="12" fontWeight="700" textAnchor="middle" fill="var(--ink)" stroke="var(--land)" strokeWidth="4" paintOrder="stroke">
                  {l.name.length > 18 ? l.name.split(" ").slice(0, 2).join(" ") : l.name}
                </text>
              </g>
            );
          })}

          {/* Player */}
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

      {/* Legend */}
      <div className="absolute top-2 left-2 flex gap-1.5 flex-wrap pointer-events-none">
        <span className="chip bg-[var(--card)]">Tap a place to travel</span>
        <span className="chip bg-[var(--card)]">
          <span className="w-2.5 h-2.5 rounded-full bg-[var(--purple)] inline-block" /> people
        </span>
      </div>

      {/* Selection sheet */}
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
                  <span className="text-xs font-semibold text-[var(--ink-2)]">
                    {o.ok ? `${formatDuration(o.minutes)} · ${o.fare ? formatNaira(o.fare) : "Free"}` : o.reason}
                  </span>
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
