"use client";

import { CITIES } from "@/game/data/world";

// Cities in the crowded south-east get labels beside or below their dot.
const LABEL_AT: Record<string, { dx: number; dy: number; anchor: "start" | "middle" | "end" }> = {
  portharcourt: { dx: 0, dy: 6.8, anchor: "middle" },
  aba: { dx: 0, dy: 6.8, anchor: "middle" },
  asaba: { dx: -3.6, dy: 1.2, anchor: "end" },
  owerri: { dx: -3.6, dy: 1.2, anchor: "end" },
  yenagoa: { dx: -3.6, dy: 1.2, anchor: "end" },
  calabar: { dx: 3.6, dy: 1.2, anchor: "start" },
};

// Simplified Nigeria outline (0-100 × 0-90). Stylised, not survey-accurate.
const OUTLINE =
  "M3 62 L4 48 L7 38 L6 28 L12 20 L22 14 L32 10 L44 12 L54 6 L66 8 L78 5 L88 10 L94 18 L92 28 L86 36 L84 46 L80 54 L74 58 L72 66 L71 74 L69 82 L63 87 L56 87 L48 88 L42 86 L36 80 L28 80 L20 78 L12 78 L6 72 Z";
const NIGER = "M12 20 C20 30 28 40 36 48 C42 54 46 56 48 58 C46 66 44 74 42 86";
const BENUE = "M90 40 C80 44 70 48 62 52 C56 55 52 57 48 58";

export default function NigeriaMap({
  highlight,
  selected,
  onSelect,
  travel,
  className,
}: {
  highlight?: string; // current city
  selected?: string | null;
  onSelect?: (cityId: string) => void;
  travel?: { from: string; to: string; progress: number };
  className?: string;
}) {
  const from = travel ? CITIES.find((c) => c.id === travel.from) : null;
  const to = travel ? CITIES.find((c) => c.id === travel.to) : null;
  return (
    <svg viewBox="-2 0 100 92" className={className} role="img" aria-label="Map of Nigeria">
      <path d={OUTLINE} fill="var(--land)" stroke="var(--land-2)" strokeWidth="1.2" strokeLinejoin="round" />
      <path d={NIGER} fill="none" stroke="var(--lagoon)" strokeWidth="1.4" strokeLinecap="round" />
      <path d={BENUE} fill="none" stroke="var(--lagoon)" strokeWidth="1.4" strokeLinecap="round" />
      <text x="4" y="89" fontSize="3" fill="var(--sky)" opacity="0.7" fontWeight="700">
        GULF OF GUINEA
      </text>
      {from && to && (
        <>
          <line x1={from.nx} y1={from.ny} x2={to.nx} y2={to.ny} stroke="var(--danfo)" strokeWidth="1" strokeDasharray="2 1.5" />
          <circle cx={from.nx + (to.nx - from.nx) * travel!.progress} cy={from.ny + (to.ny - from.ny) * travel!.progress} r="2.4" fill="var(--danfo)" stroke="#fff" strokeWidth="0.6" />
        </>
      )}
      {CITIES.map((c) => {
        const on = selected === c.id;
        const here = highlight === c.id;
        return (
          <g key={c.id} className={onSelect ? "cursor-pointer" : undefined} onClick={() => onSelect?.(c.id)}>
            {here && <circle cx={c.nx} cy={c.ny} r="4" fill="var(--danfo)" className="pulse-ring" />}
            <circle cx={c.nx} cy={c.ny} r={on ? 3.2 : 2.4} fill={on ? "var(--ink)" : here ? "var(--danfo)" : "var(--card)"} stroke="var(--ink)" strokeWidth="0.7" />
            <text x={c.nx + (LABEL_AT[c.id]?.dx ?? 0)} y={c.ny + (LABEL_AT[c.id]?.dy ?? -4.5)} fontSize="3.6" fontWeight="800" textAnchor={LABEL_AT[c.id]?.anchor ?? "middle"} fill="var(--ink)" stroke="var(--land)" strokeWidth="0.9" paintOrder="stroke">
              {c.name}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
