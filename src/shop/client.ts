"use client";

import { create } from "zustand";
import { useGame } from "@/game/store";
import { sb } from "@/online/client";


export interface PlanInfo {
  plan: "free" | "classroom" | "school";
  max_classes: number;
  max_students: number;
  expires_at: string | null;
}

export interface OrderInfo {
  reference: string;
  product_id: string;
  amount_kobo: number;
  status: string;
  created_at: string;
}

interface ShopState {
  /** Store open? Asked from the server at runtime (null = not known yet). */
  enabled: boolean | null;
  loadStatus(): Promise<void>;
  cosmetics: Set<string>;
  supporterUntil: number | null;
  plan: PlanInfo | null;
  orders: OrderInfo[];
  refresh(): Promise<void>;
}

export const useShop = create<ShopState>((set, get) => ({
  enabled: null,
  async loadStatus() {
    if (get().enabled !== null) return;
    try {
      const r = await fetch("/api/pay/status");
      set({ enabled: r.ok ? !!(await r.json()).enabled : false });
    } catch {
      set({ enabled: false });
    }
  },
  cosmetics: new Set(),
  supporterUntil: null,
  plan: null,
  orders: [],
  async refresh() {
    const client = sb();
    if (!client) return;
    void get().loadStatus();
    const { data: u } = await client.auth.getUser();
    if (!u.user) {
      set({ cosmetics: new Set(), supporterUntil: null, plan: null, orders: [] });
      return;
    }
    const [{ data: ents }, { data: plan }, { data: orders }] = await Promise.all([
      client.from("entitlements").select("kind, item, expires_at"),
      client.rpc("my_plan").maybeSingle<PlanInfo>(),
      client.from("orders").select("reference, product_id, amount_kobo, status, created_at").order("created_at", { ascending: false }).limit(20),
    ]);
    const now = Date.now();
    const cosmetics = new Set<string>();
    let supporterUntil: number | null = null;
    for (const e of ents ?? []) {
      if (e.kind === "cosmetic") cosmetics.add(e.item);
      if (e.kind === "supporter" && e.expires_at && Date.parse(e.expires_at) > now) supporterUntil = Math.max(supporterUntil ?? 0, Date.parse(e.expires_at));
    }
    set({ cosmetics, supporterUntil, plan: plan ?? null, orders: (orders ?? []) as OrderInfo[] });
  },
}));

async function authed(path: string, body: unknown) {
  const client = sb();
  if (!client) throw new Error("You're offline.");
  const { data } = await client.auth.getSession();
  const res = await fetch(path, {
    method: "POST",
    headers: { "content-type": "application/json", authorization: `Bearer ${data.session?.access_token ?? ""}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json;
}

/** Start checkout: saves the game, then sends the browser to Paystack. */
export async function buy(productId: string, ageConfirmed: boolean) {
  await useGame.getState().flushSave();
  const { authorizationUrl } = (await authed("/api/pay/init", { productId, ageConfirmed })) as { authorizationUrl: string };
  window.location.href = authorizationUrl;
}

/** Ask the server to settle any of my orders Paystack says are paid. */
export async function reconcilePayments(): Promise<number> {
  try {
    const r = (await authed("/api/pay/reconcile", {})) as { paid: number };
    return r.paid ?? 0;
  } catch {
    return 0;
  }
}

export async function verifyPayment(reference: string): Promise<{ status: string; productId?: string; reason?: string }> {
  return authed("/api/pay/verify", { reference });
}

/**
 * Add purchased game money to the current save, safely:
 * 1. read unclaimed top-ups, 2. credit them (the save remembers each one),
 * 3. save to the cloud, 4. only then mark exactly those as claimed.
 */
export async function claimTopups(): Promise<number> {
  const client = sb();
  const store = useGame.getState();
  if (!client || !store.game) return 0;
  const { data, error } = await client.from("entitlements").select("id, quantity").eq("kind", "naira").is("claimed_at", null);
  if (error || !data?.length) return 0;
  const credited: number[] = [];
  for (const t of data as { id: number; quantity: number }[]) {
    const already = !!store.game.flags[`topup_${t.id}`];
    if (already || useGame.getState().dispatch({ type: "topUp", amount: Number(t.quantity), ref: String(t.id) })) credited.push(t.id);
  }
  if (!credited.length) return 0;
  await useGame.getState().flushSave();
  // Only mark them claimed once the credited game is safely in the cloud.
  const adapter = useGame.getState().adapter as { unsynced?: boolean };
  if (adapter.unsynced) return 0;
  await client.rpc("claim_topups_by_id", { ids: credited });
  return credited.length;
}
