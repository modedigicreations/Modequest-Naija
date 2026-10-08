"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Supabase settings come from the build if present, otherwise from the
// server at runtime (/api/config), so a host's variables always work.
let url = process.env.NEXT_PUBLIC_SUPABASE_URL;
let anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const valid = () => !!url && !!anonKey && !url.includes("YOUR-PROJECT");

let loading: Promise<boolean> | null = null;

/** Resolve the Supabase settings once. Returns whether online play is available. */
export function loadOnlineConfig(): Promise<boolean> {
  if (valid()) return Promise.resolve(true);
  loading ??= fetch("/api/config")
    .then((r) => (r.ok ? r.json() : {}))
    .then((c: { supabaseUrl?: string; supabaseAnonKey?: string }) => {
      if (c.supabaseUrl && c.supabaseAnonKey) {
        url = c.supabaseUrl;
        anonKey = c.supabaseAnonKey;
      }
      return valid();
    })
    .catch(() => false);
  return loading;
}

/** Whether online features are configured (after loadOnlineConfig resolved). */
export const isOnlineEnabled = () => valid();

let client: SupabaseClient | null = null;

export function sb(): SupabaseClient | null {
  if (!valid()) return null;
  client ??= createClient(url!, anonKey!, {
    auth: { persistSession: true, autoRefreshToken: true, storageKey: "modequest:auth" },
    realtime: { params: { eventsPerSecond: 5 } },
  });
  return client;
}
