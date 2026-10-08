"use client";

import { useEffect, useMemo, useState } from "react";
import { WORK_STYLES, getCareer } from "@/game/data/economy";
import { LESSONS } from "@/game/data/lessons";
import { useGame } from "@/game/store";
import type { WorkStyle } from "@/game/types";
import { Modal } from "./ui";

export default function ShiftModal({ onClose }: { onClose: () => void }) {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const hold = useGame((s) => s.hold);
  const [style, setStyle] = useState<WorkStyle>("steady");
  const [answer, setAnswer] = useState<number | null>(null);

  useEffect(() => {
    hold("shift", true);
    return () => hold("shift", false);
  }, [hold]);

  // A quick on-the-job task: a question from the Academy for a +15% bonus.
  const task = useMemo(() => {
    const qs = LESSONS.flatMap((l) => l.questions ?? []);
    return qs[(game.time + game.stats.shiftsWorked * 7) % qs.length];
  }, [game.time, game.stats.shiftsWorked]);

  const career = getCareer(game.career!.careerId)!;
  const correct = answer !== null && answer === task.answer;

  return (
    <Modal open onClose={onClose} label="Start shift">
      <h2 className="font-display text-xl font-extrabold">
        {career.emoji} {career.levels[game.career!.level].title}
      </h2>
      <p className="text-sm text-[var(--ink-2)] mb-4">How will you work today?</p>
      <div className="grid grid-cols-2 gap-2">
        {(Object.keys(WORK_STYLES) as WorkStyle[]).map((k) => {
          const w = WORK_STYLES[k];
          return (
            <button key={k} onClick={() => setStyle(k)} className={`rounded-2xl p-3 text-left border-2 ${style === k ? "border-[var(--danfo)] bg-[var(--bg-2)]" : "border-[var(--line)] bg-[var(--card-2)]"}`}>
              <div className="text-xl">{w.emoji}</div>
              <div className="font-bold text-sm mt-1">{w.label}</div>
              <div className="text-[11px] text-[var(--ink-2)] mt-0.5">{w.blurb}</div>
            </button>
          );
        })}
      </div>

      <div className="rounded-2xl bg-[var(--sky-soft)] p-4 mt-4">
        <div className="text-xs font-bold text-[var(--sky)] uppercase tracking-wide">Task bonus (+15% pay)</div>
        <p className="font-semibold text-sm mt-1">{task.q}</p>
        <div className="grid gap-1.5 mt-2">
          {task.options.map((o, i) => {
            const picked = answer === i;
            const show = answer !== null;
            const cls = show ? (i === task.answer ? "border-[var(--green)] bg-[var(--green-soft)]" : picked ? "border-[var(--coral)] bg-[var(--coral-soft)]" : "border-transparent bg-[var(--card)]") : "border-transparent bg-[var(--card)]";
            return (
              <button key={o} disabled={show} onClick={() => setAnswer(i)} className={`text-left text-sm rounded-xl px-3 py-2 border-2 ${cls}`}>
                {o}
              </button>
            );
          })}
        </div>
        {answer !== null && <p className="text-xs mt-2">{correct ? "✅ Nailed it! Bonus unlocked." : `❌ ${task.explain}`}</p>}
      </div>

      <div className="flex gap-2 mt-4">
        <button className="btn btn-ghost flex-1" onClick={onClose}>
          Cancel
        </button>
        <button
          className="btn btn-green flex-1"
          onClick={() => {
            if (dispatch({ type: "startShift", workStyle: style, taskBonus: correct })) onClose();
          }}
        >
          Clock in {correct ? "+15%" : ""}
        </button>
      </div>
    </Modal>
  );
}
