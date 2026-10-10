import { connection } from "next/server";
import { errorResponse, HttpError, requireAdmin } from "@/online/server";

/** Owner dashboard numbers. Only for emails listed in ADMIN_EMAILS. */
export async function GET(req: Request) {
  await connection();
  try {
    const { db } = await requireAdmin(req);
    const { data, error } = await db.rpc("stats_overview");
    if (error) throw new HttpError(503, error.message.includes("stats_overview") ? "Run the site-stats SQL in Supabase first." : error.message);
    return Response.json(data, { headers: { "cache-control": "no-store" } });
  } catch (e) {
    return errorResponse(e);
  }
}
