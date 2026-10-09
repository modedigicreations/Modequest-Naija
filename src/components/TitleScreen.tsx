"use client";

import { useState } from "react";
import { importSave } from "@/game/persistence";
import { CITIES, getCity } from "@/game/data/world";
import { sb } from "@/online/client";
import { useSession } from "@/online/session";
import { useGame } from "@/game/store";
import { lifeDay } from "@/game/engine";
import { formatNaira } from "@/game/util";
import Avatar from "./Avatar";
import AccountPanel from "./online/AccountPanel";
import InstallButton from "./InstallApp";
import ShareCard from "./share/ShareCard";
import { Modal } from "./ui";

const FEATURES = [
  ["🗺️", `${CITIES.length} real cities`, "From Lagos to Kaduna, Calabar to Abuja — each with its own map, food, people and go-slow."],
  ["💼", "9 careers", "Tech, food, media, trade, banking, logistics, health, civil service, oil & gas."],
  ["🎣", "Beat the scams", "Phishing DMs, Ponzi schemes, fake alerts — learn to spot them."],
  ["📈", "Grow money", "Save, invest, run businesses — and watch inflation bite."],
  ["🎓", "Mode Academy", "Lessons and coding puzzles that pay real in-game grants."],
  ["🤝🏾", "Make padis", "Locals in every city with their own schedules, advice and drama."],
];

export default function TitleScreen() {
  const { game, hasSave, setScreen, load, dispatch, flushSave } = useGame();
  const [importErr, setImportErr] = useState<string | null>(null);
  const user = useSession((s) => s.user);
  const [moving, setMoving] = useState(false);

  const relocate = async (cityId: string) => {
    const c = getCity(cityId);
    if (!confirm(`Move your life to ${c.name}? Your home moves to a similar home there; your money, job and progress come with you.`)) return;
    if (!dispatch({ type: "relocate", city: cityId })) return;
    setMoving(false);
    await flushSave();
    if (user) await sb()?.from("profiles").update({ city: cityId }).eq("id", user.id);
  };
  const [importOpen, setImportOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [code, setCode] = useState("");

  return (
    <main className="min-h-dvh relative overflow-hidden">
      <div
        className="absolute inset-0 -z-10"
        style={{ background: "radial-gradient(1200px 520px at 50% -12%, var(--brand-soft) 0%, transparent 62%), var(--bg)" }}
      />
      <div className="max-w-5xl mx-auto px-4 pt-10 pb-16">
        <div className="flex items-center gap-2 text-sm font-bold text-[var(--ink-2)]">
          <span className="w-8 h-8 rounded-xl grid place-items-center bg-[var(--brand)] text-white font-display">M</span>
          Mode Digital Creations
        </div>

        <div className="grid lg:grid-cols-2 gap-10 items-center mt-10">
          <div>
            <span className="inline-flex items-center gap-2 mb-4 rounded-full px-4 py-1.5 text-[15px] font-bold bg-[var(--green-soft)] text-[var(--green-ink)] border border-[#0f9d58]/30">🇳🇬 Free · Plays in your browser</span>
            <h1 className="font-display font-extrabold text-[44px] sm:text-[64px] leading-[0.95] tracking-tight">
              ModeQuest:
              <br />
              <span className="inline-block bg-[var(--brand)] text-white px-3 rounded-2xl mt-2 -rotate-1">Naija</span>
            </h1>
            <p className="mt-5 text-lg text-[var(--ink-2)] max-w-md">
              Live your Naija story. Hustle, learn, dodge scams, beat NEPA and build your empire in {CITIES.length} real Nigerian cities.
            </p>
            <div className="mt-3 flex flex-wrap gap-1.5 max-w-md" aria-label="Cities you can play in">
              {CITIES.map((c) => (
                <span key={c.id} className="chip font-bold" title={`${c.name} · ${c.nickname}`}>
                  {c.emoji} {c.name}
                </span>
              ))}
            </div>

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
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              <button className="text-sm font-bold text-[var(--brand)]" onClick={() => setShareOpen(true)}>
                📣 Invite friends
              </button>
              <InstallButton />
              <button className="text-sm font-semibold text-[var(--muted)] underline" onClick={() => setImportOpen(true)}>
                Import a save code
              </button>
            </div>
            <div className="mt-6 max-w-md">
              <AccountPanel />
            </div>
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
                    {getCity(game.city).name} · Day {lifeDay(game)} · {formatNaira(game.cash + game.bank)}
                  </div>
                  <button className="text-xs font-bold underline mt-1" onClick={() => setMoving((m) => !m)}>
                    📍 {moving ? "Cancel" : "Change city"}
                  </button>
                </div>
              </div>
            ) : null}
            {game && moving && (
              <div className="rounded-2xl bg-[var(--bg-2)] p-3 mb-4 anim-up">
                <div className="text-xs font-bold text-[var(--muted)] mb-2">Move this life to:</div>
                <div className="grid grid-cols-2 gap-2">
                  {CITIES.filter((c) => c.id !== game.city).map((c) => (
                    <button key={c.id} className="btn btn-ghost btn-sm justify-start" onClick={() => void relocate(c.id)}>
                      {c.emoji} {c.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
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
          ModeQuest is a learning game. All naira is in-game money and has no real value. Places are inspired by real Nigerian cities; all characters and businesses are fictional.
        </p>
      </div>

      <Modal open={shareOpen} onClose={() => setShareOpen(false)} label="Invite friends">
        <ShareCard />
        <button className="btn btn-ghost w-full mt-3" onClick={() => setShareOpen(false)}>
          Close
        </button>
      </Modal>

      <Modal open={importOpen} onClose={() => setImportOpen(false)} label="Import save">
        <h2 className="font-display text-xl font-bold mb-2">Import save</h2>
        <p className="text-sm text-[var(--ink-2)] mb-3">Paste a save code from Settings → Export on another device.</p>
        <textarea className="input h-32 font-mono text-xs" value={code} onChange={(e) => setCode(e.target.value)} />
        {importErr && <p className="text-sm text-[var(--coral)] mt-2">{importErr}</p>}
        <div className="flex gap-2 mt-3">
          <button className="btn btn-ghost flex-1" onClick={() => setImportOpen(false)}>
            Cancel
          </button>
          <button
            className="btn btn-primary flex-1"
            onClick={() => {
              const s = importSave(code);
              if (!s) return setImportErr("That code doesn't look like a valid save.");
              if (hasSave && !confirm("Replace your current life with this save?")) return;
              setImportErr(null);
              setImportOpen(false);
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
