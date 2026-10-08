"use client";

import Link from "next/link";
import { useState } from "react";
import { CITIES } from "@/game/data/world";
import { cleanRef, storedReferral } from "@/online/referral";
import { useSession } from "@/online/session";

type Tab = "signin" | "signup" | "student";

export default function AccountPanel() {
  const { ready, enabled, user, profile, myClass, teacherName, signIn, signUpPlayer, signInStudent, signOut } = useSession();
  // Arrived from a friend's invite link? Start on sign-up with their code filled in.
  const [ref, setRef] = useState(() => storedReferral());
  const [tab, setTab] = useState<Tab>(() => (storedReferral() ? "signup" : "student"));
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [city, setCity] = useState("lagos");
  const [over13, setOver13] = useState(false);
  const [code, setCode] = useState("");
  const [username, setUsername] = useState("");
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  if (!ready) return <div className="card p-4 text-sm text-[var(--muted)]">Connecting…</div>;
  if (!enabled) return null;

  if (user && profile) {
    return (
      <div className="card p-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wide">Online as</div>
            <div className="font-display text-lg font-extrabold">{profile.nickname}</div>
            <div className="text-xs text-[var(--ink-2)]">
              {profile.role === "student" && myClass ? `🏫 ${myClass.name}${teacherName ? ` · ${teacherName}` : ""}` : profile.role === "teacher" ? "👩🏾‍🏫 Teacher account" : "🌍 Independent player"}
            </div>
          </div>
          <div className="flex flex-col gap-1.5">
            {profile.role === "teacher" && (
              <Link href="/teacher" className="btn btn-primary btn-sm">
                Teacher dashboard
              </Link>
            )}
            <button className="btn btn-ghost btn-sm" onClick={() => void signOut()}>
              Sign out
            </button>
          </div>
        </div>
        <p className="text-[11px] text-[var(--muted)] mt-2">Your game saves to the cloud — continue on any device.</p>
      </div>
    );
  }

  const run = async (fn: () => Promise<string | null>, success?: string) => {
    setBusy(true);
    setMsg(null);
    const err = await fn();
    setBusy(false);
    setMsg(err ? { ok: false, text: err } : success ? { ok: true, text: success } : null);
  };

  return (
    <div className="card p-4">
      <div className="font-display font-bold mb-2">🌍 Play online</div>
      {ref && tab === "signup" && <p className="text-xs rounded-xl bg-[var(--green-soft)] text-[var(--green-ink)] font-semibold px-3 py-2 mb-2">🎉 A friend invited you! Create your free account below.</p>}
      <div className="grid grid-cols-3 gap-1 mb-3 bg-[var(--card-2)] rounded-xl p-1">
        {([
          ["student", "Student"],
          ["signin", "Sign in"],
          ["signup", "Sign up"],
        ] as [Tab, string][]).map(([t, label]) => (
          <button key={t} className={`rounded-lg py-1.5 text-sm font-bold ${tab === t ? "bg-[var(--card)] shadow-sm" : "text-[var(--ink-2)]"}`} onClick={() => { setTab(t); setMsg(null); }}>
            {label}
          </button>
        ))}
      </div>

      {tab === "student" && (
        <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); void run(() => signInStudent(code, username, pin)); }}>
          <input className="input uppercase" placeholder="Class code (e.g. K7P2QX)" value={code} onChange={(e) => setCode(e.target.value.toUpperCase().slice(0, 6))} autoComplete="off" />
          <input className="input" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value.toLowerCase())} autoComplete="username" />
          <input className="input" placeholder="6-digit PIN" inputMode="numeric" type="password" value={pin} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} autoComplete="current-password" />
          <button className="btn btn-primary" disabled={busy || code.length < 6 || !username || pin.length < 6}>
            Join my class
          </button>
          <p className="text-[11px] text-[var(--muted)]">Your teacher gives you these. No email or phone number needed.</p>
        </form>
      )}

      {tab === "signin" && (
        <form className="grid gap-2" onSubmit={(e) => { e.preventDefault(); void run(() => signIn(email, password)); }}>
          <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
          <button className="btn btn-primary" disabled={busy || !email || !password}>
            Sign in
          </button>
        </form>
      )}

      {tab === "signup" && (
        <form
          className="grid gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            void run(() => signUpPlayer({ email, password, nickname, city, ref }), "Account created! Check your email to confirm, then sign in.");
          }}
        >
          <input className="input" placeholder="Public nickname (no real names)" value={nickname} onChange={(e) => setNickname(e.target.value.replace(/[^A-Za-z0-9_]/g, "").slice(0, 20))} />
          <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
          <input className="input" type="password" placeholder="Password (8+ characters)" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
          <select className="input" value={city} onChange={(e) => setCity(e.target.value)}>
            {CITIES.map((c) => (
              <option key={c.id} value={c.id}>
                Home city: {c.name}
              </option>
            ))}
          </select>
          <input className="input uppercase" placeholder="Referral code (optional)" value={ref} onChange={(e) => setRef(cleanRef(e.target.value))} autoComplete="off" aria-label="Referral code (optional)" />
          <label className="flex items-start gap-2 text-xs text-[var(--ink-2)]">
            <input type="checkbox" checked={over13} onChange={(e) => setOver13(e.target.checked)} className="mt-0.5" />
            I am 13 or older. (Younger players: ask your teacher for a class login.)
          </label>
          <button className="btn btn-primary" disabled={busy || !over13 || nickname.length < 3 || !email || password.length < 8}>
            Create account
          </button>
        </form>
      )}

      {msg && <p className={`text-sm mt-2 ${msg.ok ? "text-[var(--green)]" : "text-[var(--coral)]"}`}>{msg.text}</p>}
      <p className="text-xs mt-3">
        Teacher?{" "}
        <Link href="/teacher" className="font-bold underline">
          Set up your class →
        </Link>
      </p>
    </div>
  );
}
