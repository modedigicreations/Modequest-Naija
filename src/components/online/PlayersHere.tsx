"use client";

import { useEffect, useState } from "react";
import { useGame } from "@/game/store";
import { usePresence } from "@/online/presence";
import { QUICK_CHAT } from "@/online/shared";
import { useSession } from "@/online/session";
import Avatar from "../Avatar";
import { SectionTitle } from "../ui";

/** Real players at the same place + quick-chat (preset phrases only). */
export default function PlayersHere() {
  const location = useGame((s) => s.game?.location);
  const profile = useSession((s) => s.profile);
  const players = usePresence((s) => s.players);
  const bubbles = usePresence((s) => s.bubbles);
  const say = usePresence((s) => s.say);
  const showFlash = useGame((s) => s.showFlash);
  const [open, setOpen] = useState(false);
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(id);
  }, []);

  if (!profile || !location) return null;
  const here = players.filter((p) => p.location === location);
  const recent = bubbles.filter((b) => b.location === location && now - b.at < 3 * 60_000).slice(-6);

  return (
    <div className="card p-4">
      <SectionTitle right={<span className="chip chip-good">● {players.length} online in city</span>}>🌍 Players here</SectionTitle>
      {here.length === 0 ? (
        <p className="text-sm text-[var(--muted)]">No other players here right now.</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {here.map((p) => (
            <div key={p.id} className="flex items-center gap-2 rounded-2xl bg-[var(--card-2)] pr-3">
              <span className="rounded-2xl bg-[var(--bg-2)]">
                <Avatar a={p.appearance} size={34} />
              </span>
              <span className="text-sm font-bold">{p.nickname}</span>
            </div>
          ))}
        </div>
      )}

      {recent.length > 0 && (
        <ul className="mt-3 space-y-1">
          {recent.map((b) => (
            <li key={b.id} className="text-sm">
              <b>{b.from === profile.id ? "You" : b.nickname}:</b> {b.text}
            </li>
          ))}
        </ul>
      )}

      <button className="btn btn-ghost btn-sm mt-3" onClick={() => setOpen((x) => !x)}>
        💬 Quick chat
      </button>
      {open && (
        <div className="flex flex-wrap gap-1.5 mt-2">
          {QUICK_CHAT.map((p, i) => (
            <button
              key={p}
              className="chip hover:bg-[var(--bg-2)]"
              onClick={() => {
                const err = say(location, i);
                if (err) showFlash(err);
              }}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
