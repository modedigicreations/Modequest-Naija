"use client";

import { useEffect, useState } from "react";
import { COSMETICS, getProduct, PLAYER_MONTHLY_CAP_NAIRA, PRODUCTS, type Product } from "@/shop/catalog";
import { buy, paymentsEnabled, reconcilePayments, useShop } from "@/shop/client";
import { useGame } from "@/game/store";
import type { Appearance } from "@/game/types";
import { useSession } from "@/online/session";
import Avatar, { ACCESSORIES, HAIR_COLORS, HAIR_STYLES, OUTFITS, SKIN_TONES } from "../Avatar";
import { Empty, SectionTitle } from "../ui";

const naira = (n: number) => `₦${n.toLocaleString("en-NG")}`;

export function StoreApp() {
  const profile = useSession((s) => s.profile);
  const { cosmetics, supporterUntil, orders, refresh } = useShop();
  const [agreed, setAgreed] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    void reconcilePayments().then(() => refresh());
  }, [refresh]);

  if (!profile) return <Empty>Sign in from the title screen to visit the store.</Empty>;
  if (profile.role === "student") {
    return (
      <div className="card p-5 text-center">
        <div className="text-4xl">🏫</div>
        <p className="font-bold mt-2">Class accounts can&apos;t make purchases.</p>
        <p className="text-sm text-[var(--ink-2)] mt-1">Everything you need to learn and play is free. Have fun!</p>
      </div>
    );
  }
  if (!paymentsEnabled) return <Empty>The store opens soon.</Empty>;

  const owns = (p: Product) => (p.grants.cosmetics ?? []).length > 0 && (p.grants.cosmetics ?? []).every((c) => cosmetics.has(c)) && p.kind !== "supporter";
  const start = async (p: Product) => {
    setErr(null);
    setBusy(p.id);
    try {
      await buy(p.id, agreed);
    } catch (e) {
      setErr((e as Error).message);
      setBusy(null);
    }
  };

  const section = (title: string, kinds: Product["kind"][], note?: string) => (
    <div className="card p-4">
      <SectionTitle>{title}</SectionTitle>
      {note && <p className="text-[11px] text-[var(--ink-2)] mb-2">{note}</p>}
      <div className="grid gap-2">
        {PRODUCTS.filter((p) => kinds.includes(p.kind) && !p.teacherOnly).map((p) => (
          <div key={p.id} className="rounded-2xl bg-[var(--card-2)] p-3 flex items-center gap-3">
            <span className="text-3xl">{p.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-sm">{p.name}</div>
              <div className="text-[11px] text-[var(--ink-2)]">{p.blurb}</div>
            </div>
            {owns(p) ? (
              <span className="chip chip-good">Owned</span>
            ) : (
              <button className="btn btn-primary btn-sm shrink-0" disabled={!agreed || !!busy} onClick={() => start(p)}>
                {busy === p.id ? "…" : naira(p.priceNaira)}
              </button>
            )}
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-3">
      <div className="rounded-3xl p-5 text-white" style={{ background: "linear-gradient(135deg,#7b4dff,#ff5a4e)" }}>
        <div className="font-display text-2xl font-extrabold">ModeQuest Store</div>
        <div className="text-sm opacity-90">Real money, paid securely with Paystack (card, transfer or USSD).</div>
        {supporterUntil && <div className="mt-2 text-xs font-bold bg-black/20 rounded-lg px-2 py-1 w-fit">⭐ Supporter until {new Date(supporterUntil).toLocaleDateString()}</div>}
      </div>

      <label className="card p-3 flex items-start gap-2 text-xs text-[var(--ink-2)]">
        <input type="checkbox" checked={agreed} onChange={(e) => setAgreed(e.target.checked)} className="mt-0.5" />
        <span>
          I&apos;m 13 or older, and if I&apos;m under 18 a parent or guardian has said yes. I understand purchases are final, game money has no real value and can&apos;t be withdrawn, and spending is limited to {naira(PLAYER_MONTHLY_CAP_NAIRA)} every 30 days.
        </span>
      </label>
      {err && <p className="text-sm text-[var(--coral)] px-1">{err}</p>}

      {section("⭐ Support ModeQuest", ["supporter"])}
      {section("👕 Style", ["cosmetic", "bundle"], "Look good. No gameplay advantage. Wear them from the Style app.")}
      {section("💰 Game money", ["topup"], "Bought game money doesn't count on wealth leaderboards — those rank what you earn.")}

      <div className="card p-4">
        <SectionTitle>🧾 Your purchases</SectionTitle>
        {orders.length === 0 ? (
          <Empty>No purchases yet.</Empty>
        ) : (
          <ul className="text-sm divide-y divide-[var(--line)]">
            {orders.map((o) => (
              <li key={o.reference} className="py-1.5 flex justify-between gap-2">
                <span>
                  {getProduct(o.product_id)?.name ?? o.product_id}
                  <span className="block text-[11px] text-[var(--muted)]">{new Date(o.created_at).toLocaleString()}</span>
                </span>
                <span className="text-right">
                  {naira(o.amount_kobo / 100)}
                  <span className={`block text-[11px] ${o.status === "paid" ? "text-[var(--green)]" : "text-[var(--muted)]"}`}>{o.status}</span>
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
      <p className="text-[10px] text-center text-[var(--muted)]">Questions about a payment? Email support with your reference number.</p>
    </div>
  );
}

function Picker<T extends string | number>({ label, items, value, onChange }: { label: string; items: { id: T; label: React.ReactNode; locked?: boolean }[]; value: T | undefined; onChange: (v: T) => void }) {
  return (
    <div>
      <div className="text-xs font-bold text-[var(--muted)] mb-1.5">{label}</div>
      <div className="flex flex-wrap gap-1.5">
        {items.map((it) => (
          <button
            key={String(it.id)}
            disabled={it.locked}
            onClick={() => onChange(it.id)}
            className={`px-2.5 py-1.5 rounded-full text-xs font-semibold border-2 ${value === it.id ? "border-[var(--ink)] bg-[var(--bg-2)]" : "border-transparent bg-[var(--card-2)]"} disabled:opacity-40`}
          >
            {it.label}
            {it.locked ? " 🔒" : ""}
          </button>
        ))}
      </div>
    </div>
  );
}

export function StyleApp() {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const owned = useShop((s) => s.cosmetics);
  const refresh = useShop((s) => s.refresh);
  const [a, setA] = useState<Appearance>(game.player.appearance);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const update = (next: Appearance) => {
    setA(next);
    dispatch({ type: "setAppearance", appearance: next });
  };

  const premium = (slot: "outfit" | "accessory") =>
    COSMETICS.filter((c) => c.slot === slot).map((c) => ({ id: c.id, label: `${c.emoji} ${c.name}`, locked: !owned.has(c.id) }));

  return (
    <div className="space-y-3">
      <div className="card p-4 flex flex-col items-center">
        <div className="rounded-3xl bg-[var(--bg-2)] p-2">
          <Avatar a={a} size={130} />
        </div>
        <p className="text-[11px] text-[var(--muted)] mt-2">Changes save instantly.</p>
      </div>
      <div className="card p-4 space-y-3">
        <Picker label="Skin tone" items={SKIN_TONES.map((c, i) => ({ id: i, label: <span className="inline-block w-4 h-4 rounded-full align-middle" style={{ background: c }} /> }))} value={a.skin} onChange={(v) => update({ ...a, skin: v })} />
        <Picker label="Hair" items={HAIR_STYLES.map((h, i) => ({ id: i, label: h }))} value={a.hair} onChange={(v) => update({ ...a, hair: v })} />
        <Picker label="Hair colour" items={HAIR_COLORS.map((c, i) => ({ id: i, label: <span className="inline-block w-4 h-4 rounded-full align-middle" style={{ background: c }} /> }))} value={a.hairColor} onChange={(v) => update({ ...a, hairColor: v })} />
        <Picker
          label="Outfit"
          items={[...OUTFITS.map((c, i) => ({ id: `basic:${i}`, label: <span className="inline-block w-4 h-4 rounded-full align-middle" style={{ background: c }} /> })), ...premium("outfit")]}
          value={a.premiumOutfit ?? `basic:${a.outfit}`}
          onChange={(v) => (v.startsWith("basic:") ? update({ ...a, outfit: Number(v.slice(6)), premiumOutfit: undefined }) : update({ ...a, premiumOutfit: v }))}
        />
        <Picker
          label="Accessory"
          items={[...ACCESSORIES.map((t, i) => ({ id: `basic:${i}`, label: t })), ...premium("accessory")]}
          value={a.premiumAccessory ?? `basic:${a.accessory}`}
          onChange={(v) => (v.startsWith("basic:") ? update({ ...a, accessory: Number(v.slice(6)), premiumAccessory: undefined }) : update({ ...a, premiumAccessory: v }))}
        />
      </div>
      {owned.size === 0 && <p className="text-[11px] text-center text-[var(--muted)]">🔒 items are in the Store.</p>}
    </div>
  );
}

