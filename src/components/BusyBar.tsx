"use client";

import { placeOf, runEffects } from "@/game/engine";
import { getCity, transportIn } from "@/game/data/world";
import { useGame } from "@/game/store";
import { formatClock, formatDuration } from "@/game/util";

export default function BusyBar() {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const run = game.activity;
  const tr = game.travel;
  if (!run && !tr) return null;

  const start = run ? run.start : tr!.start;
  const end = run ? run.end : tr!.end;
  const progress = Math.min(1, (game.time - start) / Math.max(1, end - start));
  const title = run
    ? `${runEffects(game, run).emoji} ${runEffects(game, run).name}`
    : `${transportIn(game.city, tr!.mode).emoji} ${transportIn(game.city, tr!.mode).name} to ${tr!.toCity && tr!.toCity !== game.city ? getCity(tr!.toCity).name : placeOf(tr!.to, game).name}`;

  return (
    <div className="border-t border-[var(--line)] bg-[var(--card)] px-3 sm:px-4 py-2.5 anim-up">
      <div className="flex items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between text-sm font-bold">
            <span className="truncate">{title}</span>
            <span className="text-[var(--muted)] text-xs shrink-0 ml-2">
              {formatDuration(end - game.time)} left · done {formatClock(end)}
            </span>
          </div>
          <div className="h-2.5 rounded-full bg-[var(--card-2)] overflow-hidden mt-1.5">
            <div
              className="h-full rounded-full transition-[width] duration-200"
              style={{ width: `${progress * 100}%`, background: run ? "var(--green)" : "var(--danfo)" }}
            />
          </div>
        </div>
        {run && (
          <button className="btn btn-sm btn-ghost" onClick={() => dispatch({ type: "cancelActivity" })}>
            Stop
          </button>
        )}
      </div>
    </div>
  );
}
