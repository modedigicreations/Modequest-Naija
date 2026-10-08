"use client";

import { useState } from "react";
import { useGame } from "@/game/store";
import { WEEKDAYS, formatClock, weekdayOf } from "@/game/util";
import { Empty } from "../ui";

const KIND_LABEL = { scam: null, friend: "Friend", system: "System", opportunity: "Opportunity" } as const;

export default function MessagesApp() {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const [open, setOpen] = useState<string | null>(null);

  const msg = open ? game.messages.find((m) => m.id === open) : null;

  if (msg) {
    return (
      <div className="anim-up">
        <button className="btn btn-ghost btn-sm mb-3" onClick={() => setOpen(null)}>
          ← Inbox
        </button>
        <div className="font-bold">{msg.fromName}</div>
        <div className="text-[11px] text-[var(--muted)] mb-3">
          {WEEKDAYS[weekdayOf(msg.t)]} {formatClock(msg.t)}
        </div>
        <div className="rounded-2xl rounded-tl-sm bg-[var(--card)] border border-[var(--line)] p-3 text-sm leading-relaxed">{msg.text}</div>
        {msg.choices && !msg.resolved && (
          <div className="grid gap-2 mt-4">
            <div className="text-xs font-bold text-[var(--muted)]">How do you respond?</div>
            {msg.choices.map((c) => (
              <button key={c.id} className="btn btn-ghost w-full text-left justify-start" onClick={() => dispatch({ type: "replyMessage", messageId: msg.id, choiceId: c.id })}>
                {c.label}
              </button>
            ))}
          </div>
        )}
        {msg.resolved && (
          <>
            <div className="ml-auto mt-3 max-w-[85%] rounded-2xl rounded-tr-sm bg-[var(--green)] text-white p-3 text-sm">{msg.choices?.find((c) => c.id === msg.resolved)?.label}</div>
            {msg.outcome && <div className="rounded-2xl bg-[var(--card-2)] p-3 mt-3 text-sm leading-relaxed">{msg.outcome}</div>}
          </>
        )}
        {msg.kind === "scam" && !msg.resolved && msg.choices && (
          <p className="text-[11px] text-[var(--muted)] mt-4">Tip: look for urgency, strange links, requests for OTP/PIN/fees, and offers too good to be true.</p>
        )}
      </div>
    );
  }

  if (!game.messages.length) return <Empty>No messages yet.</Empty>;

  return (
    <ul className="divide-y divide-[var(--line)]">
      {game.messages.map((m) => {
        const needsReply = m.choices && !m.resolved;
        const tag = KIND_LABEL[m.kind];
        return (
          <li key={m.id}>
            <button className="w-full text-left py-3 flex gap-3" onClick={() => setOpen(m.id)}>
              <span className="w-10 h-10 rounded-full bg-[var(--card-2)] grid place-items-center shrink-0 font-bold">{m.fromName.slice(0, 1)}</span>
              <span className="min-w-0 flex-1">
                <span className="flex items-center justify-between gap-2">
                  <span className={`truncate text-sm ${needsReply ? "font-extrabold" : "font-semibold"}`}>{m.fromName}</span>
                  <span className="text-[11px] text-[var(--muted)] shrink-0">{formatClock(m.t)}</span>
                </span>
                <span className="block text-xs text-[var(--ink-2)] truncate">{m.text}</span>
                <span className="flex gap-1 mt-1">
                  {needsReply && <span className="chip chip-bad">Reply needed</span>}
                  {tag && <span className="chip">{tag}</span>}
                  {m.resolved && m.kind === "scam" && <span className="chip">Handled</span>}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
