"use client";

import { useState } from "react";
import { importSave } from "@/game/persistence";
import { useGame } from "@/game/store";
import { dayOf, formatNaira } from "@/game/util";
import Avatar from "./Avatar";
import { Modal } from "./ui";

const FEATURES = [
  ["🗺️", "Real Lagos", "Yaba, Balogun, Lekki, UNILAG and more — with go-slow and NEPA."],
  ["💼", "6 careers", "Tech, food, media, trade, banking, logistics. Shifts and promotions."],
  ["🎣", "Beat the scams", "Phishing DMs, Ponzi schemes, fake alerts — learn to spot them."],
  ["📈", "Grow money", "Save, invest, run businesses — and watch inflation bite."],
  ["🎓", "Mode Academy", "Lessons and coding puzzles that pay real in-game grants."],
  ["🤝🏾", "Make padis", "12 Lagosians with their own schedules, advice and drama."],
];

export default function TitleScreen() {
  const { game, hasSave, setScreen, load, showFlash, flash } = useGame();
  const [importOpen, setImportOpen] = useState(false);
  const [code, setCode] = useState("");

  return (
    <main className="min-h-dvh relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "radial-gradient(1200px 500px at 50% -10%, var(--danfo) 0%, transparent 60%), var(--bg)" }}
      />
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-16">
        <div className="flex items-center gap-2 text-sm font-bold text-[var(--ink-2)]">
          <span className="w-8 h-8 rounded-xl grid place-items-center bg-[var(--ink)] text-[var(--bg)] font-display">M</span>
          Mode Digital Creations
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-center mt-10">
          <div>
            <span className="chip chip-good mb-4">🇳🇬 Free · Plays in your browser</span>
            <h1 className="font-display font-extrabold text-[44px] sm:text-[64px] leading-[0.95] tracking-tight">
              ModeQuest:
              <br />
              <span className="inline-block bg-[var(--ink)] text-[var(--danfo)] px-3 rounded-2xl mt-2 -rotate-1">Lagos</span>
            </h1>
            <p className="mt-5 text-lg text-[var(--ink-2)] max-w-md">
              Live your Lagos story. Hustle, learn, dodge scams, beat NEPA and build your empire — one danfo ride at a time.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row gap-3 max-w-md">
              {hasSave && game && (
                <button className="btn btn-primary text-base py-3.5 flex-1" onClick={() => setScreen("play")}>
                  ▶ Continue
                </button>
              )}
              <button
                className={`btn ${hasSave ? "btn-ghost" : "btn-primary"} text-base py-3.5 flex-1`}
                onClick={() => {
                  if (hasSave && !confirm("Start a new life? Your current save will be replaced.")) return;
                  setScreen("create");
                }}
              >
                ✨ New life
              </button>
            </div>
            <button className="mt-3 text-sm font-semibold text-[var(--muted)] underline" onClick={() => setImportOpen(true)}>
              Import a save code
            </button>
          </div>

          <div className="card p-5 sm:p-6 anim-pop" style={{ boxShadow: "var(--shadow)" }}>
            {game ? (
              <div className="flex items-center gap-4 mb-5">
                <div className="rounded-2xl bg-[var(--bg-2)] p-1">
                  <Avatar a={game.player.appearance} size={72} />
                </div>
                <div>
                  <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wider">Saved life</div>
                  <div className="font-display text-2xl font-extrabold">{game.player.name}</div>
                  <div className="text-sm text-[var(--ink-2)]">
                    Day {dayOf(game.time)} · {formatNaira(game.cash + game.bank)}
                  </div>
                </div>
              </div>
            ) : null}
            <div className="grid sm:grid-cols-2 gap-3">
              {FEATURES.map(([e, t, d]) => (
                <div key={t} className="rounded-2xl bg-[var(--card-2)] p-3">
                  <div className="text-2xl">{e}</div>
                  <div className="font-bold mt-1">{t}</div>
                  <div className="text-xs text-[var(--ink-2)] mt-0.5">{d}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <p className="mt-14 text-xs text-[var(--muted)] max-w-xl">
          ModeQuest is a learning game. All naira is in-game money and has no real value. Places are inspired by real Lagos; all characters and businesses are fictional.
        </p>
      </div>

      <Modal open={importOpen} onClose={() => setImportOpen(false)} label="Import save">
        <h2 className="font-display text-xl font-bold mb-2">Import save</h2>
        <p className="text-sm text-[var(--ink-2)] mb-3">Paste a save code from Settings → Export on another device.</p>
        <textarea className="input h-32 font-mono text-xs" value={code} onChange={(e) => setCode(e.target.value)} />
        {flash && <p className="text-sm text-[var(--coral)] mt-2">{flash.text}</p>}
        <div className="flex gap-2 mt-3">
          <button className="btn btn-ghost flex-1" onClick={() => setImportOpen(false)}>
            Cancel
          </button>
          <button
            className="btn btn-primary flex-1"
            onClick={() => {
              const s = importSave(code);
              if (!s) return showFlash("That code doesn't look like a valid save.");
              load(s);
            }}
          >
            Import
          </button>
        </div>
      </Modal>
    </main>
  );
}
