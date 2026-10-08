import "server-only";
import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import { adminClient, HttpError } from "@/online/server";
import { getProduct, PLAYER_MONTHLY_CAP_NAIRA, type Product } from "./catalog";

const PAYSTACK = "https://api.paystack.co";

function secretKey() {
  const k = process.env.PAYSTACK_SECRET_KEY;
  if (!k || !k.startsWith("sk_")) throw new HttpError(503, "Payments are not configured yet.");
  return k;
}

export const paymentsEnabled = () => !!process.env.PAYSTACK_SECRET_KEY?.startsWith("sk_");

/** Signed-in user from the request's bearer token, with role. */
export async function requireUser(req: Request) {
  const db = adminClient();
  if (!db) throw new HttpError(503, "Online features are not configured.");
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "Sign in first.");
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "Your session has expired. Sign in again.");
  const { data: profile } = await db.from("profiles").select("role, nickname").eq("id", data.user.id).maybeSingle();
  if (!profile) throw new HttpError(403, "No profile.");
  return { db, user: data.user, role: profile.role as "player" | "student" | "teacher" };
}

export interface OrderRow {
  id: string;
  user_id: string;
  product_id: string;
  amount_kobo: number;
  currency: string;
  reference: string;
  status: string;
}

/** Create an order and a Paystack checkout. Price comes from the catalog only. */
export async function startCheckout(req: Request, productId: string, ageConfirmed: boolean) {
  const { db, user, role } = await requireUser(req);
  const product = getProduct(productId);
  if (!product) throw new HttpError(404, "Unknown product.");
  if (role === "student") throw new HttpError(403, "Class accounts can't make purchases. Ask a parent or guardian.");
  if (product.teacherOnly && role !== "teacher") throw new HttpError(403, "School plans are for teacher accounts.");
  if (!product.teacherOnly && !ageConfirmed) throw new HttpError(400, "Please confirm your age and permission first.");
  if (!user.email) throw new HttpError(400, "Your account needs an email address for receipts.");

  const amountKobo = product.priceNaira * 100;
  const since = new Date(Date.now() - 30 * 86400000).toISOString();
  const { data: recent } = await db.from("orders").select("amount_kobo, product_id, status, created_at").eq("user_id", user.id).gte("created_at", since);
  const rows = (recent ?? []) as { amount_kobo: number; product_id: string; status: string; created_at: string }[];

  if (!product.teacherOnly) {
    const spent = rows.filter((o) => o.status === "paid" && !getProduct(o.product_id)?.teacherOnly).reduce((a, o) => a + o.amount_kobo, 0);
    if (spent + amountKobo > PLAYER_MONTHLY_CAP_NAIRA * 100) {
      throw new HttpError(400, `Spending limit reached: ₦${PLAYER_MONTHLY_CAP_NAIRA.toLocaleString()} every 30 days.`);
    }
  }
  const pendingRecently = rows.filter((o) => o.status === "pending" && Date.parse(o.created_at) > Date.now() - 10 * 60000).length;
  if (pendingRecently >= 5) throw new HttpError(429, "Too many checkouts started. Try again in a few minutes.");

  const reference = `mq_${randomUUID().replace(/-/g, "")}`;
  const { data: order, error } = await db
    .from("orders")
    .insert({ user_id: user.id, product_id: product.id, amount_kobo: amountKobo, reference })
    .select("id")
    .single();
  if (error || !order) throw new HttpError(500, error?.message ?? "Could not create order.");

  const origin = process.env.NEXT_PUBLIC_APP_URL || new URL(req.url).origin;
  const res = await fetch(`${PAYSTACK}/transaction/initialize`, {
    method: "POST",
    headers: { authorization: `Bearer ${secretKey()}`, "content-type": "application/json" },
    body: JSON.stringify({
      email: user.email,
      amount: amountKobo,
      currency: "NGN",
      reference,
      callback_url: `${origin}/pay/return`,
      metadata: { order_id: order.id, product_id: product.id, user_id: user.id },
    }),
  });
  const json = (await res.json().catch(() => ({}))) as { status?: boolean; message?: string; data?: { authorization_url: string } };
  if (!res.ok || !json.status || !json.data) {
    await db.from("orders").update({ status: "failed" }).eq("id", order.id);
    throw new HttpError(502, `Paystack: ${json.message ?? "could not start checkout"}`);
  }
  return { authorizationUrl: json.data.authorization_url, reference };
}

interface PaystackTx {
  id: number;
  status: string;
  reference: string;
  amount: number;
  currency: string;
}

export async function paystackVerify(reference: string): Promise<PaystackTx | null> {
  const res = await fetch(`${PAYSTACK}/transaction/verify/${encodeURIComponent(reference)}`, {
    headers: { authorization: `Bearer ${secretKey()}` },
  });
  const json = (await res.json().catch(() => ({}))) as { status?: boolean; data?: PaystackTx };
  return json.status && json.data ? json.data : null;
}

export function validWebhookSignature(rawBody: string, signature: string | null) {
  if (!signature) return false;
  const expected = createHmac("sha512", secretKey()).update(rawBody).digest("hex");
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  return a.length === b.length && timingSafeEqual(a, b);
}

function entitlementRows(order: OrderRow, product: Product, activeUntil: Record<string, number>) {
  const now = Date.now();
  const extend = (key: string, days: number) => new Date(Math.max(now, activeUntil[key] ?? 0) + days * 86400000).toISOString();
  // Every row sets every column: a bulk insert fills missing keys with NULL,
  // which would break NOT NULL columns when grant kinds are mixed.
  const row = (kind: string, item: string, quantity: number, expiresAt: string | null) => ({
    user_id: order.user_id,
    order_id: order.id,
    kind,
    item,
    quantity,
    expires_at: expiresAt,
  });
  const rows = [];
  for (const c of product.grants.cosmetics ?? []) rows.push(row("cosmetic", c, 1, null));
  if (product.grants.naira) rows.push(row("naira", product.id, product.grants.naira, null));
  if (product.grants.supporterDays) rows.push(row("supporter", "supporter", 1, extend("supporter", product.grants.supporterDays)));
  if (product.grants.plan) rows.push(row("plan", product.grants.plan, 1, extend(`plan:${product.grants.plan}`, product.grants.planDays ?? 120)));
  return rows;
}

/**
 * Mark an order paid and grant its items. Safe to call many times (webhook
 * retries + verify on return): entitlements are unique per order and item.
 */
export async function fulfil(db: SupabaseClient, reference: string, tx: PaystackTx): Promise<{ ok: boolean; reason?: string; order?: OrderRow }> {
  const { data: order } = await db.from("orders").select("*").eq("reference", reference).maybeSingle<OrderRow>();
  if (!order) return { ok: false, reason: "unknown order" };
  if (tx.status !== "success") return { ok: false, reason: `payment ${tx.status}`, order };
  if (tx.amount !== order.amount_kobo || tx.currency !== order.currency) {
    await db.from("orders").update({ status: "failed" }).eq("id", order.id).eq("status", "pending");
    return { ok: false, reason: "amount mismatch", order };
  }
  const product = getProduct(order.product_id);
  if (!product) return { ok: false, reason: "unknown product", order };

  // Existing active time, so renewals extend rather than overlap.
  const { data: active } = await db.from("entitlements").select("kind, item, expires_at").eq("user_id", order.user_id).in("kind", ["supporter", "plan"]);
  const activeUntil: Record<string, number> = {};
  for (const e of active ?? []) {
    const key = e.kind === "plan" ? `plan:${e.item}` : "supporter";
    if (e.expires_at) activeUntil[key] = Math.max(activeUntil[key] ?? 0, Date.parse(e.expires_at));
  }

  const rows = entitlementRows(order, product, activeUntil);
  const { error } = await db.from("entitlements").upsert(rows, { onConflict: "order_id,kind,item", ignoreDuplicates: true });
  if (error) return { ok: false, reason: error.message, order };
  await db.from("orders").update({ status: "paid", paid_at: new Date().toISOString(), provider_id: String(tx.id) }).eq("id", order.id).neq("status", "paid");
  return { ok: true, order: { ...order, status: "paid" } };
}
