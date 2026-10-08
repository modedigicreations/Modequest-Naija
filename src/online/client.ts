"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/** Online features switch on only when Supabase is configured. */
export const onlineEnabled = !!url && !!anonKey && !url.includes("YOUR-PROJECT");

let client: SupabaseClient | null = null;

export function sb(): SupabaseClient | null {
  if (!onlineEnabled) return null;
  client ??= createClient(url!, anonKey!, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: "modequest:auth" },
    realtime: { params: { eventsPerSecond: 5 } },
  });
  return client;
}
