import { connection } from "next/server";
import { requireAdmin } from "@/online/server";

/** Is the signed-in account a site owner? (Shows the Admin app and button.) */
export async function GET(req: Request) {
  await connection();
  try {
    await requireAdmin(req);
    return Response.json({ admin: true }, { headers: { "cache-control": "no-store" } });
  } catch {
    return Response.json({ admin: false }, { headers: { "cache-control": "no-store" } });
  }
}
