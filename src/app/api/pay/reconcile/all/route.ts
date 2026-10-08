import { timingSafeEqual } from "node:crypto";
import { adminClient, errorResponse, HttpError } from "@/online/server";
import { reconcile } from "@/shop/server";

/**
 * Scheduled sweep of every pending order (e.g. a Railway cron every 10 min):
 *   curl -X POST https://<domain>/api/pay/reconcile/all -H "Authorization: Bearer $CRON_SECRET"
 */
export async function POST(req: Request) {
  try {
    const secret = process.env.CRON_SECRET;
    if (!secret || secret.length < 16) throw new HttpError(503, "CRON_SECRET is not configured.");
    const given = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
    const a = Buffer.from(given);
    const b = Buffer.from(secret);
    if (a.length !== b.length || !timingSafeEqual(a, b)) throw new HttpError(401, "Unauthorized.");
    const db = adminClient();
    if (!db) throw new HttpError(503, "Online features are not configured.");
    return Response.json(await reconcile(db, { limit: 100 }));
  } catch (e) {
    return errorResponse(e);
  }
}
