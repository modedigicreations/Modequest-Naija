"use client";

import { sb } from "./client";

// Invite links: modequest.stream/invite/CODE → /?ref=CODE. The code is kept in
// this browser until the visitor signs up, then sent with the sign-up.

const REF_KEY = "modequest:ref";
export const REF_RE = /^[A-Z0-9]{4,12}$/;

export const cleanRef = (v: string) => v.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 12);

/** Save a ?ref= code from the address bar, then tidy the URL. */
export function captureReferral() {
  try {
    const url = new URL(window.location.href);
    const raw = url.searchParams.get("ref");
    if (raw === null) return;
    const code = cleanRef(raw);
    if (REF_RE.test(code)) localStorage.setItem(REF_KEY, code);
    url.searchParams.delete("ref");
    window.history.replaceState(null, "", url.pathname + url.search + url.hash);
  } catch {
    // storage blocked: invites still work, just without the code
  }
}

export function storedReferral(): string {
  try {
    return localStorage.getItem(REF_KEY) ?? "";
  } catch {
    return "";
  }
}

export function forgetReferral() {
  try {
    localStorage.removeItem(REF_KEY);
  } catch {
    // ignore
  }
}

/** The link to share: personal invite link when there's a code. */
export function inviteUrl(code?: string | null) {
  const origin = typeof window === "undefined" ? "https://modequest.stream" : window.location.origin;
  return code ? `${origin}/invite/${code}` : `${origin}/`;
}

/** This player's code and how many friends joined with it (null = none/unavailable). */
export async function fetchMyReferral(): Promise<{ code: string; invited: number } | null> {
  const client = sb();
  if (!client) return null;
  const { data, error } = await client.rpc("my_referral_stats").maybeSingle<{ code: string; invited: number }>();
  if (error || !data) return null;
  return { code: data.code, invited: Number(data.invited) };
}
