"use client";

import { useState } from "react";
import { BACKGROUNDS, DREAMS, TRAITS } from "@/game/data/economy";
import { CITIES, cityHome, getCity } from "@/game/data/world";
import { useGame } from "@/game/store";
import { useSession } from "@/online/session";
import type { Appearance, Player } from "@/game/types";
import { formatNaira } from "@/game/util";
import Avatar, { ACCESSORIES, HAIR_COLORS, HAIR_STYLES, OUTFITS, SKIN_TONES } from "./Avatar";
import NigeriaMap from "./NigeriaMap";

const STEPS = ["City", "You", "Start", "Traits", "Dream"] as const;

function Swatches({ colors, value, onChange, label }: { colors: string[]; value: number; onChange: (i: number) => void; label: string }) {
  return (
    <div>
      <div className="text-xs font-bold text-[var(--muted)] mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-2">
        {colors.map((c, i) => (
          <button
            key={c}
            aria-label={`${label} ${i + 1}`}
            onClick={() => onChange(i)}
            className="w-9 h-9 rounded-full border-2 transition-transform"
            style={{ background: c, borderColor: value === i ? "var(--ink)" : "transparent", transform: value === i ? "scale(1.1)" : "none" }}
          />
        ))}
      </div>
    </div>
  );
}

function Pills({ items, value, onChange, label }: { items: string[]; value: number; onChange: (i: number) => void; label: string }) {
  return (
    <div>
      <div className="text-xs font-bold text-[var(--muted)] mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((t, i) => (
          <button
            key={t}
            onClick={() => onChange(i)}
            className={`px-3 py-1.5 rounded-full text-sm font-semibold border-2 ${value === i ? "bg-[var(--ink)] text-[var(--bg)] border-[var(--ink)]" : "bg-[var(--card-2)] border-transparent"}`}
          >
            {t}
          </button>
        ))}
      </div>
    </div>
  );
}

export default function CharacterCreator() {
  const { startNew, setScreen } = useGame();
  const [step, setStep] = useState(0);
  const homeCity = useSession((s) => s.profile?.city);
  const [city, setCity] = useState(() => (homeCity && CITIES.some((c) => c.id === homeCity) ? homeCity : "lagos"));
  const [name, setName] = useState("");
  const [pronoun, setPronoun] = useState<Player["pronoun"]>("they");
  const [a, setA] = useState<Appearance>({ skin: 1, hair: 1, hairColor: 0, outfit: 0, accessory: 0 });
  const [background, setBackground] = useState("hustler");
  const [traits, setTraits] = useState<string[]>([]);
  const [dream, setDream] = useState("smart_money");

  const set = (k: keyof Appearance) => (v: number) => setA((p) => ({ ...p, [k]: v }));
  const canNext = step === 1 ? name.trim().length >= 2 : step === 3 ? traits.length === 2 : true;

  const randomize = () =>
    setA({
      skin: Math.floor(Math.random() * SKIN_TONES.length),
      hair: Math.floor(Math.random() * HAIR_STYLES.length),
      hairColor: Math.floor(Math.random() * HAIR_COLORS.length),
      outfit: Math.floor(Math.random() * OUTFITS.length),
      accessory: Math.floor(Math.random() * ACCESSORIES.length),
    });

  return (
    <main className="min-h-dvh max-w-3xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-5">
        <button className="btn btn-ghost btn-sm" onClick={() => (step === 0 ? setScreen("title") : setStep(step - 1))}>
          ← Back
        </button>
        <div className="flex gap-1.5">
          {STEPS.map((s, i) => (
            <div key={s} className={`h-2 rounded-full transition-all ${i <= step ? "bg-[var(--danfo)] w-8" : "bg-[var(--card-2)] w-4"}`} />
          ))}
        </div>
        <div className="w-16" />
      </div>

      {step === 0 && (
        <section className="anim-up">
          <h1 className="font-display text-3xl font-extrabold">Where does your story start?</h1>
          <p className="text-[var(--ink-2)] mt-1 mb-4">Pick a home city. You can travel or move to another city later.</p>
          <div className="grid md:grid-cols-[1fr_1.1fr] gap-4 items-start">
            <div className="card p-3" style={{ background: "var(--lagoon)" }}>
              <NigeriaMap className="w-full" selected={city} onSelect={setCity} />
            </div>
            <div className="grid gap-2">
              {CITIES.map((c) => (
                <button key={c.id} onClick={() => setCity(c.id)} className={`card p-4 text-left border-2 ${city === c.id ? "border-[var(--danfo)] bg-[var(--bg-2)]" : ""}`}>
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{c.emoji}</span>
                    <div>
                      <div className="font-display font-bold text-lg leading-tight">
                        {c.name} <span className="text-xs font-semibold text-[var(--muted)]">· {c.nickname}</span>
                      </div>
                      <div className="text-sm text-[var(--ink-2)]">{c.blurb}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {step === 1 && (
        <section className="grid sm:grid-cols-[200px_1fr] gap-6 anim-up">
          <div className="card p-4 flex flex-col items-center gap-3 sm:sticky sm:top-4 h-fit">
            <div className="rounded-3xl bg-[var(--bg-2)] p-2">
              <Avatar a={a} size={150} />
            </div>
            <button className="btn btn-ghost btn-sm" onClick={randomize}>
              🎲 Randomise
            </button>
          </div>
          <div className="space-y-4">
            <h1 className="font-display text-3xl font-extrabold">Who are you?</h1>
            <div>
              <div className="text-xs font-bold text-[var(--muted)] mb-1.5">Name</div>
              <input className="input" value={name} maxLength={18} placeholder="e.g. Tobi" onChange={(e) => setName(e.target.value)} autoFocus />
            </div>
            <Pills label="Pronouns" items={["he/him", "she/her", "they/them"]} value={["he", "she", "they"].indexOf(pronoun)} onChange={(i) => setPronoun((["he", "she", "they"] as const)[i])} />
            <Swatches label="Skin tone" colors={SKIN_TONES} value={a.skin} onChange={set("skin")} />
            <Pills label="Hair" items={HAIR_STYLES} value={a.hair} onChange={set("hair")} />
            <Swatches label="Hair colour" colors={HAIR_COLORS} value={a.hairColor} onChange={set("hairColor")} />
            <Swatches label="Outfit" colors={OUTFITS} value={a.outfit} onChange={set("outfit")} />
            <Pills label="Accessory" items={ACCESSORIES} value={a.accessory} onChange={set("accessory")} />
          </div>
        </section>
      )}

      {step === 2 && (
        <section className="anim-up">
          <h1 className="font-display text-3xl font-extrabold">How does your {getCity(city).name} story start?</h1>
          <p className="text-[var(--ink-2)] mt-1 mb-4">Everyone starts somewhere. Each start has its own advantages and challenges.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {BACKGROUNDS.map((b) => {
              const h = cityHome(city, b.homeTier);
              const active = background === b.id;
              return (
                <button
                  key={b.id}
                  onClick={() => setBackground(b.id)}
                  className={`card p-4 text-left border-2 transition ${active ? "border-[var(--danfo)]" : ""}`}
                  style={active ? { boxShadow: "var(--shadow)" } : undefined}
                >
                  <div className="text-3xl">{b.emoji}</div>
                  <div className="font-display font-bold text-lg mt-1">{b.name}</div>
                  <p className="text-sm text-[var(--ink-2)] mt-1">{b.blurb}</p>
                  <div className="flex flex-wrap gap-1.5 mt-3">
                    <span className="chip chip-good">💵 {formatNaira(b.cash + b.bank)}</span>
                    <span className="chip chip-info">🏠 {h.name}</span>
                    {b.loan && <span className="chip chip-bad">💳 Owes ₦72k</span>}
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {step === 3 && (
        <section className="anim-up">
          <h1 className="font-display text-3xl font-extrabold">Pick 2 traits</h1>
          <p className="text-[var(--ink-2)] mt-1 mb-4">Traits shape how you play. Choose {2 - traits.length} more.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {TRAITS.map((t) => {
              const on = traits.includes(t.id);
              return (
                <button
                  key={t.id}
                  onClick={() => setTraits((p) => (on ? p.filter((x) => x !== t.id) : p.length < 2 ? [...p, t.id] : [p[1], t.id]))}
                  className={`card p-3 text-left border-2 ${on ? "border-[var(--danfo)] bg-[var(--bg-2)]" : ""}`}
                >
                  <div className="text-2xl">{t.emoji}</div>
                  <div className="font-bold mt-1">{t.name}</div>
                  <div className="text-xs text-[var(--ink-2)] mt-0.5">{t.blurb}</div>
                </button>
              );
            })}
          </div>
        </section>
      )}

      {step === 4 && (
        <section className="anim-up">
          <h1 className="font-display text-3xl font-extrabold">What&apos;s your big dream?</h1>
          <p className="text-[var(--ink-2)] mt-1 mb-4">Your lifetime goal. You can win in many ways, but this is yours.</p>
          <div className="grid sm:grid-cols-2 gap-3">
            {DREAMS.map((d) => (
              <button key={d.id} onClick={() => setDream(d.id)} className={`card p-4 text-left border-2 ${dream === d.id ? "border-[var(--danfo)] bg-[var(--bg-2)]" : ""}`}>
                <div className="text-3xl">{d.emoji}</div>
                <div className="font-display font-bold text-lg mt-1">{d.name}</div>
                <div className="text-sm text-[var(--ink-2)]">{d.blurb}</div>
              </button>
            ))}
          </div>
        </section>
      )}

      <div className="sticky bottom-0 pt-6 pb-4 bg-gradient-to-t from-[var(--bg)] via-[var(--bg)] to-transparent mt-6">
        {step < 4 ? (
          <button className="btn btn-primary w-full py-3.5 text-base" disabled={!canNext} onClick={() => setStep(step + 1)}>
            Next →
          </button>
        ) : (
          <button className="btn btn-green w-full py-3.5 text-base" onClick={() => startNew({ city, name, pronoun, appearance: a, background, traits, dream })}>
            🚌 Enter {getCity(city).name}
          </button>
        )}
      </div>
    </main>
  );
}
