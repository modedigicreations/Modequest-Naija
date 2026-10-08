"use client";

import { useGame } from "@/game/store";
import { sb } from "./client";

/** Invite bonus rules (the server enforces these; shown in the UI). */
export const INVITE_BONUS = 20000;
export const INVITE_BONUS_DAY = 3;
export const INVITE_BONUS_MONTHLY_CAP = 10;

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

export interface ReferralStats {
  code: string;
  invited: number;
  rewarded: number;
  earned: number;
}

/** This player's code, friends who joined, and bonuses earned (null = none/unavailable). */
export async function fetchMyReferral(): Promise<ReferralStats | null> {
  const client = sb();
  if (!client) return null;
  const { data, error } = await client.rpc("my_referral_stats").maybeSingle<ReferralStats>();
  if (error || !data) return null;
  return { code: data.code, invited: Number(data.invited), rewarded: Number(data.rewarded ?? 0), earned: Number(data.earned ?? 0) };
}

/**
 * Add earned invite bonuses to the current game, safely (like top-ups):
 * credit (the save remembers each one), save to the cloud, then mark claimed.
 */
export async function claimReferralRewards(): Promise<number> {
  const client = sb();
  if (!client || !useGame.getState().game) return 0;
  const { data, error } = await client.rpc("referral_rewards");
  if (error || !data?.length) return 0;
  const credited: string[] = [];
  for (const r of data as { id: string; amount: number; friend: string }[]) {
    const g = useGame.getState().game!;
    const already = !!g.flags[`refbonus_${r.id}`];
    if (already || useGame.getState().dispatch({ type: "referralBonus", amount: Number(r.amount), ref: r.id, friend: r.friend })) credited.push(r.id);
  }
  if (!credited.length) return 0;
  await useGame.getState().flushSave();
  if ((useGame.getState().adapter as { unsynced?: boolean }).unsynced) return 0;
  await client.rpc("claim_referral_rewards", { ids: credited });
  return credited.length;
}
