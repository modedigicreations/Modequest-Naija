import "server-only";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Server-side Supabase with the service role key. Only import from route
// handlers — never from client components.

let admin: SupabaseClient | null = null;

export function adminClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key || url.includes("YOUR-PROJECT")) return null;
  admin ??= createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
  return admin;
}

export class HttpError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

/** Verify the caller's access token and that they teach this class. */
export async function requireTeacherOf(req: Request, classId: string) {
  const db = adminClient();
  if (!db) throw new HttpError(503, "Online features are not configured.");
  const token = req.headers.get("authorization")?.replace(/^Bearer\s+/i, "");
  if (!token) throw new HttpError(401, "Sign in first.");
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) throw new HttpError(401, "Your session has expired. Sign in again.");
  const { data: cls } = await db.from("classes").select("id, code, teacher_id").eq("id", classId).maybeSingle();
  if (!cls || cls.teacher_id !== data.user.id) throw new HttpError(403, "That isn't your class.");
  return { db, teacherId: data.user.id, cls: cls as { id: string; code: string; teacher_id: string } };
}

export function errorResponse(e: unknown) {
  if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status });
  console.error(e);
  return Response.json({ error: "Something went wrong." }, { status: 500 });
}
