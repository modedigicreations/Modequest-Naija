"use client";

import { dispatch as engineDispatch } from "@/game/engine";
import { useGame } from "@/game/store";
import { sb } from "./client";

export type Metric = "net_worth" | "academy" | "scams";

export interface LeaderRow {
  nickname: string;
  city: string | null;
  value: number;
  is_me: boolean;
  supporter?: boolean;
}

export async function fetchLeaderboard(metric: Metric, classId?: string | null): Promise<LeaderRow[]> {
  const client = sb();
  if (!client) return [];
  const { data, error } = await client.rpc("leaderboard", { metric, class: classId ?? null, lim: 50 });
  if (error) throw new Error(error.message);
  return (data ?? []) as LeaderRow[];
}

/** Validate locally, record on the server, then deduct in the game. */
export async function sendGift(nickname: string, amount: number, note?: string): Promise<string | null> {
  const client = sb();
  const game = useGame.getState();
  if (!client || !game.game) return "You're offline.";
  // Dry run in the engine first (bank balance, frozen account), so the server
  // never records a gift the game would then refuse to deduct.
  const check = engineDispatch(game.game, { type: "sendGift", to: nickname, amount });
  if (check.error) return check.error;
  const { error } = await client.rpc("send_gift", { to_nickname: nickname, amount, note: note ?? null });
  if (error) return error.message;
  if (!useGame.getState().dispatch({ type: "sendGift", to: nickname, amount })) return "Gift sent, but your balance changed — check your bank.";
  await useGame.getState().flushSave();
  return null;
}

/** Credit any gifts waiting for this player. */
export async function claimGifts(): Promise<number> {
  const client = sb();
  const game = useGame.getState();
  if (!client || !game.game) return 0;
  const { data, error } = await client.rpc("claim_gifts");
  if (error || !data) return 0;
  for (const g of data as { amount: number; from_nickname: string; note: string | null }[]) {
    useGame.getState().dispatch({ type: "receiveGift", from: g.from_nickname, amount: g.amount, note: g.note ?? undefined });
  }
  if (data.length) await useGame.getState().flushSave();
  return data.length;
}

export interface ChatMessage {
  id: number;
  author_id: string;
  body: string;
  created_at: string;
  deleted_at: string | null;
}

export async function fetchClassMessages(classId: string): Promise<ChatMessage[]> {
  const client = sb();
  if (!client) return [];
  const { data } = await client
    .from("class_messages")
    .select("id, author_id, body, created_at, deleted_at")
    .eq("class_id", classId)
    .order("created_at", { ascending: false })
    .limit(60);
  return ((data ?? []) as ChatMessage[]).reverse();
}

export async function postClassMessage(classId: string, authorId: string, body: string): Promise<string | null> {
  const client = sb();
  if (!client) return "You're offline.";
  const { error } = await client.from("class_messages").insert({ class_id: classId, author_id: authorId, body: body.slice(0, 280) });
  return error ? error.message : null;
}

/** Live updates for a class chat. Returns an unsubscribe function. */
export function subscribeClassChat(classId: string, onChange: () => void) {
  const client = sb();
  if (!client) return () => {};
  const ch = client
    .channel(`class:${classId}`)
    .on("postgres_changes", { event: "*", schema: "public", table: "class_messages", filter: `class_id=eq.${classId}` }, onChange)
    .subscribe();
  return () => void client.removeChannel(ch);
}

export async function classRoster(classId: string): Promise<{ student_id: string; nickname: string }[]> {
  const client = sb();
  if (!client) return [];
  const { data } = await client.rpc("class_roster", { class: classId });
  return (data ?? []) as { student_id: string; nickname: string }[];
}
