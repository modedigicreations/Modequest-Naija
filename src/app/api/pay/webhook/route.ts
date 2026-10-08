import { adminClient } from "@/online/server";
import { fulfil, validWebhookSignature } from "@/shop/server";

/**
 * Paystack webhook (Dashboard → Settings → API Keys & Webhooks):
 *   https://<your-domain>/api/pay/webhook
 * Verified with the x-paystack-signature HMAC; idempotent.
 */
export async function POST(req: Request) {
  const raw = await req.text();
  let valid = false;
  try {
    valid = validWebhookSignature(raw, req.headers.get("x-paystack-signature"));
  } catch {
    return new Response("payments not configured", { status: 503 });
  }
  if (!valid) return new Response("invalid signature", { status: 401 });

  const event = JSON.parse(raw) as { event?: string; data?: { id: number; status: string; reference: string; amount: number; currency: string } };
  const db = adminClient();
  if (db && event.event === "charge.success" && event.data?.reference) {
    const r = await fulfil(db, event.data.reference, event.data);
    if (!r.ok && r.reason !== "unknown order") console.error("paystack webhook:", r.reason, event.data.reference);
  }
  return new Response("ok");
}
