import { connection } from "next/server";

/**
 * Public client settings, read from the server's environment at request time
 * so the site never depends on variables being present at build time.
 * (The Supabase URL and anon key are public by design; RLS protects data.)
 */
export async function GET() {
  await connection();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? process.env.SUPABASE_URL ?? "";
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? process.env.SUPABASE_ANON_KEY ?? "";
  const ok = !!url && !!anonKey && !url.includes("YOUR-PROJECT");
  return Response.json(ok ? { supabaseUrl: url, supabaseAnonKey: anonKey } : {}, { headers: { "cache-control": "no-store" } });
}
