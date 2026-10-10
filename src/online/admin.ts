"use client";

import { sb } from "./client";

export interface SiteStats {
  live_playing: number;
  live_browsing: number;
  live_signed_in: number;
  live_by_city: Record<string, number>;
  players_total: number;
  students_total: number;
  teachers_total: number;
  signups_7d: number;
  cloud_saves: number;
  visits_all_time: number;
  visitors_all_time: number;
  visits_today: number;
  visitors_7d: number;
  daily: { day: string; visits: number; new: number }[];
  paid_orders: number;
  revenue_kobo: number;
  revenue_30d_kobo: number;
  tracking_since: string | null;
}

async function authed(path: string) {
  const client = sb();
  if (!client) throw new Error("Online features are not configured.");
  const { data } = await client.auth.getSession();
  return fetch(path, { headers: { authorization: `Bearer ${data.session?.access_token ?? ""}` }, cache: "no-store" });
}

/** Whether the signed-in account is a site owner. */
export async function checkAdmin(): Promise<boolean> {
  try {
    const res = await authed("/api/admin/me");
    return !!(await res.json()).admin;
  } catch {
    return false;
  }
}

/** The dashboard numbers (owners only). Throws with the server's message. */
export async function fetchSiteStats(): Promise<SiteStats> {
  const res = await authed("/api/admin/stats");
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json as SiteStats;
}
