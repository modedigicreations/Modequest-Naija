import { connection } from "next/server";
import { paymentsEnabled } from "@/shop/server";

/** Whether the store is open. Evaluated per request (never at build time). */
export async function GET() {
  await connection();
  return Response.json({ enabled: paymentsEnabled() }, { headers: { "cache-control": "no-store" } });
}
