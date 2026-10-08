"use client";

import { useEffect, useState } from "react";
import { exportSave } from "@/game/persistence";
import { useGame } from "@/game/store";
import { useSession } from "@/online/session";
import { SectionTitle } from "../ui";

type Theme = "system" | "light" | "dark";

function applyTheme(t: Theme) {
  const el = document.documentElement;
  if (t === "system") el.removeAttribute("data-theme");
  else el.setAttribute("data-theme", t);
  try {
    localStorage.setItem("modequest:theme", t);
  } catch {
    // ignore
  }
}

export function useStoredTheme() {
  useEffect(() => {
    try {
      const t = localStorage.getItem("modequest:theme") as Theme | null;
      if (t) applyTheme(t);
    } catch {
      // ignore
    }
  }, []);
}

const HOW_TO = [
  "Keep your 5 needs up: eat, sleep, bathe, have fun, socialise. Low needs hurt your pay, learning and health.",
  "Get a job in the Jobs app and show up for shifts on time. Great shifts + skills + certificates = promotions.",
  "Rent is charged every Saturday at 8am. Miss two and you're evicted to a relative's couch.",
  "NEPA cuts light at random. Laptops and TVs at home need power — a generator or solar helps.",
  "Scam DMs arrive on your phone. Read carefully. Never share OTPs, never pay to receive money.",
  "Mode Academy lessons pay grants and boost skills. Savings, investments and businesses pay out every Monday.",
];

export default function SettingsApp({ onClose }: { onClose: () => void }) {
  const game = useGame((s) => s.game)!;
  const { save, flushSave, setScreen, wipe } = useGame();
  const online = useSession((s) => !!s.user);
  const [saved, setSaved] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [theme, setTheme] = useState<Theme>(() => {
    try {
      return (localStorage.getItem("modequest:theme") as Theme) || "system";
    } catch {
      return "system";
    }
  });
  const [copied, setCopied] = useState(false);

  return (
    <div className="space-y-3">
      <div className="card p-4">
        <SectionTitle>💾 Save</SectionTitle>
        <p className="text-xs text-[var(--ink-2)]">
          {online ? "Your game saves automatically to your account, so you can continue on any device." : "Your game saves automatically in this browser every few seconds."}
        </p>
        <div className="flex flex-wrap gap-2 mt-3">
          <button
            className="btn btn-green btn-sm"
            onClick={async () => {
              await flushSave();
              setSaved(true);
            }}
          >
            {saved ? "Saved ✓" : "Save now"}
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => setCode(exportSave(game))}>
            Export save code
          </button>
        </div>
        {code && (
          <div className="mt-3">
            <textarea readOnly className="input h-24 font-mono text-[10px]" value={code} onFocus={(e) => e.currentTarget.select()} />
            <button
              className="btn btn-ghost btn-sm mt-2"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(code);
                  setCopied(true);
                } catch {
                  setCopied(false);
                }
              }}
            >
              {copied ? "Copied ✓" : "Copy code"}
            </button>
            <p className="text-[11px] text-[var(--muted)] mt-1">Import it from the title screen on any device.</p>
          </div>
        )}
      </div>

      <div className="card p-4">
        <SectionTitle>🎨 Theme</SectionTitle>
        <div className="flex gap-2">
          {(["system", "light", "dark"] as Theme[]).map((t) => (
            <button
              key={t}
              className={`btn btn-sm flex-1 ${theme === t ? "btn-primary" : "btn-ghost"}`}
              onClick={() => {
                setTheme(t);
                applyTheme(t);
              }}
            >
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <SectionTitle>📖 How to play</SectionTitle>
        <ul className="text-xs text-[var(--ink-2)] space-y-1.5 list-disc pl-4">
          {HOW_TO.map((h) => (
            <li key={h}>{h}</li>
          ))}
        </ul>
        <div className="text-xs mt-3">
          <b>Keyboard:</b> M map · P phone · Space pause · 1/2/3 speed
        </div>
      </div>

      <div className="card p-4 flex flex-col gap-2">
        <button
          className="btn btn-ghost"
          onClick={() => {
            save();
            onClose();
            setScreen("title");
          }}
        >
          ⏏ Save & exit to title
        </button>
        <button className="btn btn-coral" onClick={() => confirm("Delete this life forever? This cannot be undone.") && void wipe()}>
          🗑 Delete save
        </button>
      </div>

      <p className="text-[11px] text-center text-[var(--muted)] pb-2">
        ModeQuest: Naija · Made in Nigeria by Mode Digital Creations
        <br />
        Learn · Build · Earn
      </p>
    </div>
  );
}
