"use client";

import { useEffect, useState } from "react";
import { CITIES } from "@/game/data/world";
import { fetchMyReferral, INVITE_BONUS, INVITE_BONUS_DAY, INVITE_BONUS_MONTHLY_CAP, inviteUrl, type ReferralStats } from "@/online/referral";
import { formatNaira } from "@/game/util";
import { useSession } from "@/online/session";

const MESSAGE =
  `🇳🇬 I'm playing ModeQuest: Naija — a free game where you hustle, dodge scams, beat NEPA and grow your money in ${CITIES.length} real Nigerian cities, from Lagos to Kaduna to Yenagoa. It plays in your browser. Join me:`;

/** Share the game: native share sheet, WhatsApp & co, or copy the link. */
export default function ShareCard() {
  const user = useSession((s) => s.user);
  const role = useSession((s) => s.profile?.role);
  const [ref, setRef] = useState<ReferralStats | null>(null);
  const [withCode, setWithCode] = useState(true);
  const [copied, setCopied] = useState<"link" | "message" | null>(null);
  // Only rendered in the browser (title screen / phone), so this is safe.
  const [canShare] = useState(() => typeof navigator !== "undefined" && typeof navigator.share === "function");

  const canRefer = !!user && role !== undefined && role !== "student";
  useEffect(() => {
    if (!canRefer) return;
    let live = true;
    void fetchMyReferral().then((r) => live && setRef(r));
    return () => {
      live = false;
    };
  }, [canRefer]);

  const code = canRefer && withCode ? ref?.code : null;
  const link = inviteUrl(code);
  const full = `${MESSAGE} ${link}`;
  const enc = encodeURIComponent;

  const copy = async (what: "link" | "message") => {
    try {
      await navigator.clipboard.writeText(what === "link" ? link : full);
      setCopied(what);
      setTimeout(() => setCopied(null), 2000);
    } catch {
      window.prompt("Copy this:", what === "link" ? link : full);
    }
  };

  const channels: [string, string, string][] = [
    ["WhatsApp", "💬", `https://wa.me/?text=${enc(full)}`],
    ["Telegram", "✈️", `https://t.me/share/url?url=${enc(link)}&text=${enc(MESSAGE)}`],
    ["X", "𝕏", `https://twitter.com/intent/tweet?text=${enc(MESSAGE)}&url=${enc(link)}`],
    ["Facebook", "📘", `https://www.facebook.com/sharer/sharer.php?u=${enc(link)}`],
    ["Email", "✉️", `mailto:?subject=${enc("Play ModeQuest: Naija with me")}&body=${enc(full)}`],
  ];

  return (
    <div className="space-y-3">
      <div className="rounded-3xl p-5 text-white" style={{ background: "linear-gradient(135deg,var(--brand-dark),var(--brand))" }}>
        <div className="font-display text-2xl font-extrabold">📣 Invite friends</div>
        <div className="text-sm opacity-90">Share ModeQuest so your friends can sign up and play with you — it&apos;s free.</div>
        {(!user || canRefer) && (
          <div className="mt-3 rounded-2xl bg-white/15 px-3 py-2 text-sm">
            🎁 Earn <b>{formatNaira(INVITE_BONUS)} game money</b> for every friend who signs up with your link and plays to Day {INVITE_BONUS_DAY}.
          </div>
        )}
        {canRefer && ref && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs font-bold">
            <span className="bg-black/20 rounded-lg px-2 py-1">Your code: {ref.code}</span>
            <span className="bg-black/20 rounded-lg px-2 py-1">
              🎉 {ref.invited} {ref.invited === 1 ? "friend" : "friends"} joined
            </span>
            <span className="bg-black/20 rounded-lg px-2 py-1">💰 {formatNaira(ref.earned)} bonus earned</span>
          </div>
        )}
      </div>

      <div className="card p-4">
        <div className="text-xs font-bold text-[var(--muted)] mb-1.5">Your link</div>
        <div className="flex gap-2">
          <input className="input font-mono text-xs" readOnly value={link} onFocus={(e) => e.currentTarget.select()} aria-label="Invite link" />
          <button className="btn btn-primary btn-sm shrink-0" onClick={() => void copy("link")}>
            {copied === "link" ? "Copied ✓" : "Copy"}
          </button>
        </div>
        {canRefer && ref && (
          <label className="flex items-center gap-2 text-xs text-[var(--ink-2)] mt-2">
            <input type="checkbox" checked={withCode} onChange={(e) => setWithCode(e.target.checked)} />
            Include my referral code, so I can see who joined from my link and earn the bonus
          </label>
        )}
        {canRefer && ref && ref.invited > ref.rewarded && (
          <p className="text-[11px] text-[var(--ink-2)] mt-2">
            ⏳ {ref.invited - ref.rewarded} {ref.invited - ref.rewarded === 1 ? "friend hasn't" : "friends haven't"} reached Day {INVITE_BONUS_DAY} yet — your bonus lands in your bank when they do.
          </p>
        )}
        {canRefer && <p className="text-[10px] text-[var(--muted)] mt-1">Up to {INVITE_BONUS_MONTHLY_CAP} bonuses every 30 days. Bonus money is game money only.</p>}
        {!user && <p className="text-[11px] text-[var(--muted)] mt-2">Sign in (or create an account) to get your own referral link and see how many friends joined.</p>}
        {role === "student" && <p className="text-[11px] text-[var(--muted)] mt-2">Class accounts share the plain game link. Your teacher can add classmates.</p>}
      </div>

      <div className="card p-4">
        <div className="text-xs font-bold text-[var(--muted)] mb-2">Share to</div>
        {canShare && (
          <button
            className="btn btn-green w-full mb-2"
            onClick={() => void navigator.share({ title: "ModeQuest: Naija", text: MESSAGE, url: link }).catch(() => {})}
          >
            📤 Share…
          </button>
        )}
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {channels.map(([name, emoji, href]) => (
            <a key={name} href={href} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-sm flex-col gap-0.5 py-2">
              <span className="text-lg leading-none">{emoji}</span>
              <span className="text-[11px]">{name}</span>
            </a>
          ))}
        </div>
        <button className="btn btn-ghost btn-sm w-full mt-2" onClick={() => void copy("message")}>
          {copied === "message" ? "Message copied ✓" : "📋 Copy message + link"}
        </button>
      </div>

      <p className="text-[11px] text-center text-[var(--muted)] px-2">Only share with people you know. Never share your password or PIN.</p>
    </div>
  );
}
