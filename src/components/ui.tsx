"use client";

import { useEffect, type ReactNode } from "react";

export function Modal({
  open,
  onClose,
  children,
  wide,
  label,
}: {
  open: boolean;
  onClose?: () => void;
  children: ReactNode;
  wide?: boolean;
  label: string;
}) {
  useEffect(() => {
    if (!open || !onClose) return;
    const fn = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/45 p-0 sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={label}
    >
      <div
        className={`card anim-up w-full ${wide ? "sm:max-w-2xl" : "sm:max-w-md"} max-h-[92dvh] overflow-y-auto scroll-thin rounded-b-none sm:rounded-[20px] p-5`}
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  );
}

export function Meter({
  value,
  color,
  label,
  emoji,
  compact,
}: {
  value: number;
  color?: string;
  label: string;
  emoji?: string;
  compact?: boolean;
}) {
  const v = Math.max(0, Math.min(100, value));
  const c = color ?? (v < 20 ? "var(--coral)" : v < 45 ? "var(--danfo)" : "var(--green)");
  return (
    <div className="min-w-0" title={`${label}: ${Math.round(v)}%`}>
      {!compact && (
        <div className="flex items-center justify-between text-[11px] font-semibold text-[var(--ink-2)] mb-0.5">
          <span className="truncate">
            {emoji} {label}
          </span>
          <span>{Math.round(v)}</span>
        </div>
      )}
      <div className="h-2 rounded-full bg-[var(--card-2)] overflow-hidden" role="meter" aria-valuenow={Math.round(v)} aria-valuemin={0} aria-valuemax={100} aria-label={label}>
        <div className="h-full rounded-full transition-[width] duration-300" style={{ width: `${v}%`, background: c }} />
      </div>
    </div>
  );
}

export function SectionTitle({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="flex items-center justify-between mb-2 mt-1">
      <h3 className="font-display font-bold text-[15px]">{children}</h3>
      {right}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <p className="text-sm text-[var(--muted)] py-3 text-center">{children}</p>;
}
