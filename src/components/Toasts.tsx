"use client";

import { useEffect, useRef, useState } from "react";
import { useGame } from "@/game/store";
import type { LogEntry } from "@/game/types";

const KIND_STYLE: Record<LogEntry["kind"], string> = {
  info: "bg-[var(--card)]",
  good: "bg-[var(--green-soft)]",
  bad: "bg-[var(--coral-soft)]",
  money: "bg-[var(--bg-2)]",
  learn: "bg-[var(--sky-soft)]",
};

interface Toast {
  id: number;
  kind: LogEntry["kind"] | "error";
  text: string;
}

export default function Toasts() {
  const log = useGame((s) => s.game?.log);
  const flash = useGame((s) => s.flash);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const lastSeen = useRef<number | null>(null);
  const lastFlash = useRef<number>(flash?.id ?? 0);

  useEffect(() => {
    if (!log) return;
    const lastId = log.length ? log[log.length - 1].id : 0;
    if (lastSeen.current === null) {
      lastSeen.current = lastId; // don't replay old history on load
      return;
    }
    const fresh = log.filter((e) => e.id > lastSeen.current!);
    lastSeen.current = lastId;
    if (!fresh.length) return;
    // Plain "arrived" chatter is shown in the place panel instead.
    const show = fresh.filter((e) => !(e.kind === "info" && e.text.startsWith("Arrived at")));
    if (!show.length) return;
    setToasts((t) => [...t, ...show.map((e) => ({ id: e.id, kind: e.kind, text: e.text }))].slice(-4));
  }, [log]);

  useEffect(() => {
    if (!flash || flash.id === lastFlash.current) return;
    lastFlash.current = flash.id;
    setToasts((t) => [...t, { id: -flash.id, kind: "error" as const, text: flash.text }].slice(-4));
  }, [flash]);

  useEffect(() => {
    if (!toasts.length) return;
    const id = window.setTimeout(() => setToasts((t) => t.slice(1)), toasts[0].text.length > 90 ? 7000 : 4200);
    return () => window.clearTimeout(id);
  }, [toasts]);

  return (
    <div className="fixed z-40 left-1/2 -translate-x-1/2 top-[max(118px,calc(env(safe-area-inset-top)+110px))] w-[min(92vw,420px)] flex flex-col gap-2 pointer-events-none" aria-live="polite">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`anim-pop pointer-events-auto rounded-2xl border border-[var(--line)] px-4 py-2.5 text-sm font-semibold ${t.kind === "error" ? "bg-[var(--coral)] text-white" : KIND_STYLE[t.kind]}`}
          style={{ boxShadow: "var(--shadow)" }}
          onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
        >
          {t.text}
        </div>
      ))}
    </div>
  );
}
