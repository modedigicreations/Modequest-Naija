"use client";

import { intercityQuote } from "@/game/engine";
import { CITIES, getCity } from "@/game/data/world";
import { useGame } from "@/game/store";
import { formatDuration, formatNaira } from "@/game/util";
import NigeriaMap from "../NigeriaMap";
import { SectionTitle } from "../ui";

/** Book a bus or flight to another city from anywhere. */
export default function TravelApp({ onBooked }: { onBooked: () => void }) {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const here = getCity(game.city);
  const busy = !!game.activity || !!game.travel;

  return (
    <div className="space-y-3">
      <div className="card p-3" style={{ background: "var(--lagoon)" }}>
        <NigeriaMap className="w-full" highlight={game.city} />
      </div>
      <p className="text-xs text-[var(--ink-2)] px-1">
        You&apos;re in <b>{here.name}</b>. Booking from away from the motor park or airport adds the ride there. Your home and job stay where they are — to live somewhere else, rent a home there from the Homes app.
      </p>
      {busy && <p className="text-xs text-[var(--coral)] px-1">Finish what you&apos;re doing first.</p>}
      {CITIES.filter((c) => c.id !== game.city).map((c) => (
        <div key={c.id} className="card p-4">
          <SectionTitle>
            {c.emoji} {c.name} <span className="text-xs font-semibold text-[var(--muted)]">· {c.nickname}</span>
          </SectionTitle>
          <div className="grid gap-2">
            {(["coach", "flight"] as const).map((mode) => {
              const q = intercityQuote(game, c.id, mode);
              if (!q) return null;
              return (
                <button
                  key={mode}
                  disabled={busy}
                  className="btn btn-ghost justify-between w-full py-2"
                  onClick={() => {
                    if (!confirm(`${mode === "coach" ? "Bus" : "Fly"} to ${c.name} for ${formatNaira(q.fare)}? It takes about ${formatDuration(q.minutes)}.`)) return;
                    if (dispatch({ type: "intercity", to: c.id, mode })) onBooked();
                  }}
                >
                  <span>{mode === "coach" ? "🚌 Luxury bus" : "✈️ Flight"}</span>
                  <span className="text-xs font-semibold text-[var(--ink-2)]">
                    {formatDuration(q.minutes)} · {formatNaira(q.fare)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
