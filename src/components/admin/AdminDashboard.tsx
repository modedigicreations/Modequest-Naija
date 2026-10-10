"use client";

import { useCallback, useEffect, useState } from "react";
import { getCity } from "@/game/data/world";
import { sb } from "@/online/client";
import { useSession } from "@/online/session";

interface Stats {
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

const n = (v: number) => Math.round(v).toLocaleString("en-NG");
const naira = (kobo: number) => `₦${n(kobo / 100)}`;
/** "1 visit", "2 visits". */
const count = (v: number, one: string, many: string) => `${n(v)} ${v === 1 ? one : many}`;

/** Owner dashboard: live players, player totals and all-time visits. */
export default function AdminDashboard() {
  const { ready, enabled, user, init, signIn, signOut } = useSession();
  const [stats, setStats] = useState<Stats | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [updated, setUpdated] = useState<Date | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    void init();
  }, [init]);

  const load = useCallback(async () => {
    const client = sb();
    if (!client) return;
    setRefreshing(true);
    const { data } = await client.auth.getSession();
    const res = await fetch("/api/admin/stats", { headers: { authorization: `Bearer ${data.session?.access_token ?? ""}` }, cache: "no-store" });
    const json = await res.json().catch(() => ({}));
    setRefreshing(false);
    if (!res.ok) {
      setErr(json.error ?? `Request failed (${res.status})`);
      return;
    }
    setErr(null);
    setStats(json as Stats);
    setUpdated(new Date());
  }, []);

  useEffect(() => {
    if (!user) return;
    void Promise.resolve().then(load);
    const id = setInterval(() => void load(), 20_000);
    return () => clearInterval(id);
  }, [user, load]);

  if (!ready) return <Shell>Connecting…</Shell>;
  if (!enabled) return <Shell>Online features are not configured.</Shell>;
  if (!user) return <Shell><SignIn signIn={signIn} /></Shell>;

  return (
    <main className="min-h-dvh max-w-6xl mx-auto px-4 py-6 space-y-5">
      <header className="flex flex-wrap items-center gap-3 justify-between">
        <div>
          <h1 className="font-display text-2xl font-extrabold">📊 ModeQuest dashboard</h1>
          <p className="text-xs text-[var(--muted)]">
            {updated ? `Updated ${updated.toLocaleTimeString("en-NG", { hour: "numeric", minute: "2-digit", second: "2-digit" })} · refreshes every 20 seconds` : "Loading…"}
            {stats?.tracking_since && ` · visits tracked since ${new Date(stats.tracking_since).toLocaleDateString("en-NG", { day: "numeric", month: "short", year: "numeric" })}`}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => void load()} disabled={refreshing}>
            ↻ Refresh
          </button>
          <button className="btn btn-ghost btn-sm" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </header>

      {err && <div className="card p-4 text-sm text-[var(--coral)] font-semibold">{err}</div>}

      {stats && (
        <div className={`space-y-5 transition-opacity ${refreshing ? "opacity-70" : ""}`}>
          {/* Headline numbers */}
          <section className="grid sm:grid-cols-3 gap-3">
            <Hero
              label="Playing right now"
              value={n(stats.live_playing)}
              live
              note={`${n(stats.live_signed_in)} signed in · ${count(stats.live_playing - stats.live_signed_in, "guest", "guests")} · ${n(stats.live_browsing)} more on the start screen`}
            />
            <Hero label="Registered players" value={n(stats.players_total + stats.students_total)} note={`${count(stats.players_total, "player", "players")} · ${count(stats.students_total, "student", "students")} · ${count(stats.teachers_total, "teacher", "teachers")}`} />
            <Hero label="All-time visits" value={n(stats.visits_all_time)} note={`${count(stats.visitors_all_time, "unique visitor", "unique visitors")} · ${count(stats.visits_today, "visit", "visits")} today`} />
          </section>

          <section className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Tile label="New sign-ups (7 days)" value={n(stats.signups_7d)} />
            <Tile label="Visitors (7 days)" value={n(stats.visitors_7d)} />
            <Tile label="Games saved to accounts" value={n(stats.cloud_saves)} />
            <Tile label="Paid store orders" value={n(stats.paid_orders)} />
            <Tile label="Store revenue (all time)" value={naira(stats.revenue_kobo)} />
            <Tile label="Store revenue (30 days)" value={naira(stats.revenue_30d_kobo)} />
            <Tile label="Teachers" value={n(stats.teachers_total)} />
            <Tile label="Students" value={n(stats.students_total)} />
          </section>

          <section className="grid lg:grid-cols-[2fr_1fr] gap-3">
            <VisitsChart daily={stats.daily} />
            <LiveByCity byCity={stats.live_by_city} />
          </section>

          <p className="text-[11px] text-[var(--muted)]">
            Live = a game open in the last 2 minutes. A visit = one browser tab session. Visitors are counted with a random ID kept in the browser — no names, emails or IP addresses are stored.
          </p>
        </div>
      )}
    </main>
  );
}

function Shell({ children }: { children: React.ReactNode }) {
  return (
    <main className="min-h-dvh grid place-items-center p-4">
      <div className="card p-6 w-full max-w-sm">
        <h1 className="font-display text-xl font-extrabold mb-3">📊 ModeQuest dashboard</h1>
        {children}
      </div>
    </main>
  );
}

function SignIn({ signIn }: { signIn: (email: string, password: string) => Promise<string | null> }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  return (
    <form
      className="grid gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        setBusy(true);
        setErr(await signIn(email, password));
        setBusy(false);
      }}
    >
      <p className="text-sm text-[var(--ink-2)]">Sign in with an owner account.</p>
      <input className="input" type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
      <input className="input" type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} autoComplete="current-password" />
      <button className="btn btn-primary" disabled={busy || !email || !password}>
        Sign in
      </button>
      {err && <p className="text-sm text-[var(--coral)]">{err}</p>}
    </form>
  );
}

function Hero({ label, value, note, live }: { label: string; value: string; note: string; live?: boolean }) {
  return (
    <div className="card p-5">
      <div className="text-xs font-bold uppercase tracking-wide text-[var(--muted)] flex items-center gap-2">
        {live && <span className="inline-block w-2.5 h-2.5 rounded-full bg-[var(--green)] animate-pulse" aria-hidden />}
        {label}
      </div>
      <div className="font-display text-5xl font-extrabold mt-1 leading-none">{value}</div>
      <div className="text-xs text-[var(--ink-2)] mt-2">{note}</div>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-4">
      <div className="text-[11px] font-bold text-[var(--muted)]">{label}</div>
      <div className="font-display text-2xl font-extrabold mt-0.5">{value}</div>
    </div>
  );
}

/** Daily visits for the last 30 days (Nigerian time), one bar per day. */
function VisitsChart({ daily }: { daily: Stats["daily"] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  // Fill in days with no visits so gaps show as zero.
  const byDay = new Map(daily.map((d) => [d.day, d]));
  const days: { day: string; visits: number; new: number }[] = [];
  const today = new Date(new Date().toLocaleString("en-US", { timeZone: "Africa/Lagos" }));
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    days.push(byDay.get(key) ?? { day: key, visits: 0, new: 0 });
  }
  const max = Math.max(1, ...days.map((d) => d.visits));
  const fmt = (day: string) => new Date(`${day}T12:00:00`).toLocaleDateString("en-NG", { day: "numeric", month: "short" });
  const h = hover !== null ? days[hover] : null;

  return (
    <div className="card p-4">
      <div className="flex items-center justify-between gap-2">
        <h2 className="font-display font-bold">Visits per day · last 30 days</h2>
        <button className="chip" onClick={() => setTable((t) => !t)}>
          {table ? "Show chart" : "Show table"}
        </button>
      </div>
      {table ? (
        <div className="max-h-72 overflow-y-auto scroll-thin mt-3">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[var(--muted)] text-xs">
                <th className="py-1 font-semibold">Day</th>
                <th className="py-1 font-semibold text-right">Visits</th>
                <th className="py-1 font-semibold text-right">New visitors</th>
              </tr>
            </thead>
            <tbody>
              {[...days].reverse().map((d) => (
                <tr key={d.day} className="border-t border-[var(--line)]">
                  <td className="py-1">{fmt(d.day)}</td>
                  <td className="py-1 text-right font-semibold">{n(d.visits)}</td>
                  <td className="py-1 text-right">{n(d.new)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <>
          <div className="h-5 mt-2 text-xs text-[var(--ink-2)]" aria-live="polite">
            {h ? (
              <>
                <b className="text-[var(--ink)] text-sm">{n(h.visits)}</b> visits · {n(h.new)} new · {fmt(h.day)}
              </>
            ) : (
              <span className="text-[var(--muted)]">Hover a bar for details · peak {n(max)}</span>
            )}
          </div>
          <div className="relative h-48 mt-2 flex items-end gap-[2px] border-b border-[var(--line)]" onMouseLeave={() => setHover(null)}>
            {days.map((d, i) => (
              <button
                key={d.day}
                className="relative flex-1 h-full flex items-end focus:outline-none"
                aria-label={`${fmt(d.day)}: ${d.visits} visits, ${d.new} new visitors`}
                onMouseEnter={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
              >
                <span
                  className="block w-full rounded-t-[4px] transition-opacity"
                  style={{ height: `${(d.visits / max) * 100}%`, minHeight: d.visits ? 2 : 0, background: "var(--chart)", opacity: hover === null || hover === i ? 1 : 0.45 }}
                />
              </button>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-[var(--muted)] mt-1">
            <span>{fmt(days[0].day)}</span>
            <span>{fmt(days[15].day)}</span>
            <span>Today</span>
          </div>
        </>
      )}
    </div>
  );
}

/** Players in a game right now, by city. */
function LiveByCity({ byCity }: { byCity: Record<string, number> }) {
  const rows = Object.entries(byCity).sort((a, b) => b[1] - a[1]);
  const max = Math.max(1, ...rows.map((r) => r[1]));
  return (
    <div className="card p-4">
      <h2 className="font-display font-bold">Playing now, by city</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-[var(--muted)] mt-3">Nobody is in a game right now.</p>
      ) : (
        <ul className="mt-3 space-y-2">
          {rows.map(([city, count]) => (
            <li key={city} className="text-sm">
              <div className="flex justify-between">
                <span>
                  {city === "unknown" ? "—" : `${getCity(city).emoji} ${getCity(city).name}`}
                </span>
                <b>{n(count)}</b>
              </div>
              <div className="h-2 rounded-full bg-[var(--card-2)] mt-1 overflow-hidden">
                <div className="h-full rounded-full" style={{ width: `${(count / max) * 100}%`, background: "var(--chart)" }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
