"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getCity } from "@/game/data/world";
import { fetchSiteStats, type SiteStats } from "@/online/admin";

const n = (v: number) => Math.round(v).toLocaleString("en-NG");

/** Owner's quick view inside the phone, with a link to the full dashboard. */
export default function AdminApp() {
  const [stats, setStats] = useState<SiteStats | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    const load = () =>
      fetchSiteStats()
        .then((s) => live && (setStats(s), setErr(null)))
        .catch((e: Error) => live && setErr(e.message));
    void load();
    const id = setInterval(load, 20_000);
    return () => {
      live = false;
      clearInterval(id);
    };
  }, []);

  return (
    <div className="space-y-3">
      <div className="rounded-3xl p-5 text-white" style={{ background: "linear-gradient(135deg,var(--brand-dark),var(--brand))" }}>
        <div className="text-xs opacity-80 font-bold uppercase tracking-wide flex items-center gap-2">
          <span className="inline-block w-2.5 h-2.5 rounded-full bg-[#4ade80] animate-pulse" aria-hidden />
          Playing right now
        </div>
        <div className="font-display text-5xl font-extrabold leading-none mt-1">{stats ? n(stats.live_playing) : "…"}</div>
        {stats && (
          <div className="text-xs opacity-90 mt-2">
            {n(stats.live_signed_in)} signed in · {n(stats.live_playing - stats.live_signed_in)} guest{stats.live_playing - stats.live_signed_in === 1 ? "" : "s"} · {n(stats.live_browsing)} on the start screen
          </div>
        )}
      </div>

      {err && <p className="text-sm text-[var(--coral)] px-1">{err}</p>}

      {stats && (
        <>
          <div className="grid grid-cols-2 gap-2">
            <Tile label="Registered players" value={n(stats.players_total + stats.students_total)} />
            <Tile label="All-time visits" value={n(stats.visits_all_time)} />
            <Tile label="Visits today" value={n(stats.visits_today)} />
            <Tile label="New sign-ups (7d)" value={n(stats.signups_7d)} />
            <Tile label="Paid orders" value={n(stats.paid_orders)} />
            <Tile label="Revenue (30d)" value={`₦${n(stats.revenue_30d_kobo / 100)}`} />
          </div>
          {Object.keys(stats.live_by_city).length > 0 && (
            <div className="card p-3">
              <div className="text-xs font-bold text-[var(--muted)] mb-1.5">Playing now, by city</div>
              <ul className="text-sm space-y-1">
                {Object.entries(stats.live_by_city)
                  .sort((a, b) => b[1] - a[1])
                  .map(([city, count]) => (
                    <li key={city} className="flex justify-between">
                      <span>{city === "unknown" ? "—" : `${getCity(city).emoji} ${getCity(city).name}`}</span>
                      <b>{n(count)}</b>
                    </li>
                  ))}
              </ul>
            </div>
          )}
        </>
      )}

      <Link href="/admin" className="btn btn-primary w-full">
        📊 Open full dashboard
      </Link>
      <p className="text-[10px] text-center text-[var(--muted)]">Refreshes every 20 seconds. Only owner accounts can see this app.</p>
    </div>
  );
}

function Tile({ label, value }: { label: string; value: string }) {
  return (
    <div className="card p-3">
      <div className="text-[10px] font-bold text-[var(--muted)]">{label}</div>
      <div className="font-display text-xl font-extrabold">{value}</div>
    </div>
  );
}
