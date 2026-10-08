"use client";

import { pendingEventView } from "@/game/engine";
import { useGame } from "@/game/store";
import { Modal } from "./ui";

export default function EventModal() {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const ev = pendingEventView(game);
  if (!ev) return null;

  return (
    <Modal open label={ev.title}>
      <div className="text-center">
        <div className="text-5xl anim-pop">{ev.emoji}</div>
        <h2 className="font-display text-2xl font-extrabold mt-2">{ev.title}</h2>
        {ev.text && <p className="text-[var(--ink-2)] mt-2">{ev.text}</p>}
      </div>
      {ev.outcome ? (
        <>
          <div className="rounded-2xl bg-[var(--card-2)] p-4 mt-4 text-sm leading-relaxed">{ev.outcome}</div>
          <button className="btn btn-primary w-full mt-4" onClick={() => dispatch({ type: "resolveEvent", choiceId: "__dismiss" })}>
            Continue
          </button>
        </>
      ) : (
        <div className="flex flex-col gap-2 mt-5">
          {ev.choices.map((c, i) => (
            <button key={c.id} className={`btn ${i === 0 ? "btn-primary" : "btn-ghost"} w-full`} onClick={() => dispatch({ type: "resolveEvent", choiceId: c.id })}>
              {c.label}
            </button>
          ))}
        </div>
      )}
    </Modal>
  );
}
