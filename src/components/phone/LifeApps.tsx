"use client";

import { CAREERS, CERTIFICATES, DREAMS, ITEMS } from "@/game/data/economy";
import { NPCS } from "@/game/data/people";
import { HOMES, POWER_BANDS, getCity, getLocation } from "@/game/data/world";
import { kindsHere, promotionBlockers, workplaceFor } from "@/game/engine";
import { ACHIEVEMENTS, dreamProgress } from "@/game/goals";
import { friendshipTier, level, price, SKILL_NAMES, wageMultiplier } from "@/game/helpers";
import { useGame } from "@/game/store";
import { SKILL_KEYS } from "@/game/types";
import { WEEKDAYS, formatNaira, skillProgress } from "@/game/util";
import { Empty, Meter, SectionTitle } from "../ui";

export function JobsApp() {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const cur = game.career ? CAREERS.find((c) => c.id === game.career!.careerId)! : null;

  return (
    <div className="space-y-3">
      {cur && game.career && (
        <div className="card p-4">
          <div className="text-xs text-[var(--muted)]">Current job</div>
          <div className="font-display text-xl font-extrabold">
            {cur.emoji} {cur.levels[game.career.level].title}
          </div>
          <div className="text-sm text-[var(--ink-2)]">
            {formatNaira(cur.levels[game.career.level].pay * wageMultiplier(game))}/shift · {cur.days.map((d) => WEEKDAYS[d]).join(" ")} · {cur.start}:00, {cur.hours}h · {workplaceFor(game, cur.workplace)?.name ?? `no workplace in ${getCity(game.city).name}`}
          </div>
          <div className="mt-3">
            <Meter value={game.career.performance} label="Performance" emoji="📊" />
          </div>
          <div className="mt-3 text-xs">
            <b>Next promotion:</b> {promotionBlockers(game).length ? promotionBlockers(game).join(" · ") : "Ready on your next great shift!"}
          </div>
          {game.career.missedStreak > 0 && <div className="text-xs text-[var(--coral)] mt-1 font-bold">⚠️ {game.career.missedStreak}/3 missed-shift strikes</div>}
          <button className="btn btn-ghost btn-sm mt-3" onClick={() => confirm("Quit your job?") && dispatch({ type: "quitJob" })}>
            Resign
          </button>
        </div>
      )}
      <SectionTitle>Careers in {getCity(game.city).name}</SectionTitle>
      {CAREERS.map((c) => {
        const first = c.levels[0];
        const where = workplaceFor(game, c.workplace);
        const eligible = level(game, c.skill) >= first.skill && !!where;
        const mine = game.career?.careerId === c.id;
        return (
          <div key={c.id} className="card p-4">
            <div className="flex justify-between items-start gap-2">
              <div>
                <div className="font-bold">
                  {c.emoji} {c.name}
                </div>
                <div className="text-xs text-[var(--ink-2)]">{c.blurb}</div>
              </div>
              {mine ? <span className="chip chip-good">Your job</span> : null}
            </div>
            <div className="text-[11px] text-[var(--muted)] mt-2">
              {c.days.map((d) => WEEKDAYS[d]).join(" ")} · {c.start}:00 ({c.hours}h) · {where?.name ?? `Not available in ${getCity(game.city).name}`} · Skill: {SKILL_NAMES[c.skill]}
            </div>
            <ol className="mt-2 text-xs space-y-0.5">
              {c.levels.map((l, i) => (
                <li key={l.title} className={`flex justify-between ${mine && game.career!.level === i ? "font-extrabold" : ""}`}>
                  <span>
                    {i + 1}. {l.title}
                    {l.cert ? " 📜" : ""}
                  </span>
                  <span className="text-[var(--ink-2)]">{formatNaira(l.pay * wageMultiplier(game))}</span>
                </li>
              ))}
            </ol>
            {!mine && (
              <button className="btn btn-primary btn-sm mt-3" disabled={!eligible} onClick={() => (!game.career || confirm("Switch jobs? You'll start from level 1.")) && dispatch({ type: "applyJob", careerId: c.id })}>
                {!where ? `Not in ${getCity(game.city).name}` : eligible ? `Apply as ${first.title}` : `Needs ${SKILL_NAMES[c.skill]} ${first.skill}`}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ShopApp() {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const atVillage = kindsHere(game).includes("gadget_market");
  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--ink-2)] px-1">
        Delivered to your home. {atVillage ? "📍 You're at a gadget market: gadgets 20% off (watch for fakes!)." : "Gadgets are 20% cheaper in person at a gadget market."}
      </p>
      {ITEMS.map((it) => {
        const owned = game.items.includes(it.id);
        const cost = price(game, it.price * (atVillage && it.gadget ? 0.8 : 1));
        return (
          <div key={it.id} className="card p-3 flex items-center gap-3">
            <span className="text-3xl">{it.emoji}</span>
            <div className="min-w-0 flex-1">
              <div className="font-bold text-sm">{it.name}</div>
              <div className="text-[11px] text-[var(--ink-2)]">{it.blurb}</div>
            </div>
            {owned ? (
              <span className="chip chip-good">Owned</span>
            ) : (
              <button className="btn btn-primary btn-sm shrink-0" onClick={() => dispatch({ type: "buyItem", itemId: it.id })}>
                {formatNaira(cost)}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function HomesApp() {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  return (
    <div className="space-y-2">
      <p className="text-xs text-[var(--ink-2)] px-1">Moving costs {4} weeks upfront (2 weeks rent + agency & caution fees). Better areas get more hours of NEPA light.</p>
      <p className="text-xs font-bold px-1">
        {getCity(game.city).emoji} Homes in {getCity(game.city).name}
        {HOMES.find((h) => h.id === game.homeId)?.city !== game.city ? ` · you live in ${getCity(HOMES.find((h) => h.id === game.homeId)!.city).name}` : ""}
      </p>
      {HOMES.filter((h) => h.city === game.city && (!h.hidden || h.id === game.homeId)).map((h) => {
        const mine = h.id === game.homeId;
        const pb = POWER_BANDS[h.band];
        const rent = price(game, h.weeklyRent, false);
        return (
          <div key={h.id} className={`card p-4 ${mine ? "border-[var(--green)]" : ""}`}>
            <div className="flex justify-between gap-2">
              <div>
                <div className="font-bold">{h.name}</div>
                <div className="text-xs text-[var(--muted)]">{h.area}</div>
              </div>
              <div className="text-right">
                <div className="font-bold">{h.weeklyRent ? `${formatNaira(rent)}/wk` : "Free"}</div>
                {mine && <span className="chip chip-good">You live here</span>}
              </div>
            </div>
            <p className="text-xs text-[var(--ink-2)] mt-1">{h.blurb}</p>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="chip">
                ⚡ Band {h.band}: {pb.min}–{pb.max}h light/day
              </span>
              <span className="chip">😴 Sleep ×{h.sleepQuality}</span>
              <span className="chip">{h.kitchen ? "🍳 Kitchen" : "No kitchen"}</span>
              {h.studentOnly && <span className="chip chip-info">Students only</span>}
            </div>
            {!mine && !h.hidden && (
              <button className="btn btn-primary btn-sm mt-3" disabled={!!h.studentOnly && !game.flags.student} onClick={() => confirm(`Move to ${h.name}? You'll pay ${formatNaira(rent * h.moveInWeeks)} now.`) && dispatch({ type: "moveHouse", homeId: h.id })}>
                Move in · {formatNaira(rent * h.moveInWeeks)}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function SkillsApp() {
  const game = useGame((s) => s.game)!;
  return (
    <div className="space-y-3">
      <div className="card p-4 space-y-3">
        {SKILL_KEYS.map((k) => (
          <div key={k}>
            <div className="flex justify-between text-sm font-bold">
              <span>{SKILL_NAMES[k]}</span>
              <span>Lvl {level(game, k)}/10</span>
            </div>
            <Meter compact value={skillProgress(game.skills[k]) * 100} label={SKILL_NAMES[k]} color="var(--sky)" />
          </div>
        ))}
      </div>
      <div className="card p-4">
        <SectionTitle>📜 Certificates</SectionTitle>
        {game.certificates.length === 0 && <Empty>None yet. Take courses at Yaba Tech Hub, UNILAG or the National Theatre.</Empty>}
        {game.certificates.map((c) => (
          <div key={c} className="chip chip-good mr-1.5 mb-1.5">
            🎓 {CERTIFICATES[c]}
          </div>
        ))}
        {Object.entries(game.courseProgress)
          .filter(([id]) => !game.certificates.includes(id))
          .map(([id, n]) => (
            <div key={id} className="text-xs text-[var(--ink-2)] mt-1">
              In progress: {CERTIFICATES[id]} — {n} class(es) done
            </div>
          ))}
      </div>
    </div>
  );
}

export function GoalsApp() {
  const game = useGame((s) => s.game)!;
  const dream = DREAMS.find((d) => d.id === game.player.dream)!;
  const dp = dreamProgress(game);
  return (
    <div className="space-y-3">
      <div className="rounded-3xl p-5" style={{ background: "linear-gradient(135deg,var(--danfo),#d48f00)", color: "#0f172a" }}>
        <div className="text-xs font-bold opacity-75">LIFETIME DREAM</div>
        <div className="font-display text-2xl font-extrabold">
          {dream.emoji} {dream.name}
        </div>
        <div className="text-sm mt-1">{dream.blurb}</div>
        <div className="h-3 rounded-full bg-black/15 mt-3 overflow-hidden">
          <div className="h-full bg-[var(--brand-dark)] rounded-full" style={{ width: `${dp.progress * 100}%` }} />
        </div>
        <div className="text-xs mt-2 font-semibold">{dp.done ? "🌟 ACHIEVED! You're a Naija legend." : dp.detail}</div>
      </div>
      <div className="card p-4">
        <SectionTitle right={<span className="chip">{game.achievements.length}/{ACHIEVEMENTS.length}</span>}>🏅 Achievements</SectionTitle>
        <div className="grid grid-cols-2 gap-2">
          {ACHIEVEMENTS.map((a) => {
            const got = game.achievements.includes(a.id);
            return (
              <div key={a.id} className={`rounded-2xl p-2.5 ${got ? "bg-[var(--green-soft)]" : "bg-[var(--card-2)] opacity-60"}`}>
                <div className="text-xl">{got ? a.emoji : "🔒"}</div>
                <div className="text-xs font-bold mt-0.5">{a.name}</div>
                <div className="text-[10px] text-[var(--ink-2)]">{a.blurb}</div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="card p-4 text-sm grid grid-cols-2 gap-y-1">
        <span>Scams avoided</span>
        <b className="text-right">{game.stats.scamsAvoided}</b>
        <span>Scams fallen for</span>
        <b className="text-right">{game.stats.scamsFallen}</b>
        <span>Shifts worked</span>
        <b className="text-right">{game.stats.shiftsWorked}</b>
        <span>Total earned</span>
        <b className="text-right">{formatNaira(game.stats.totalEarned)}</b>
        <span>Hospital visits</span>
        <b className="text-right">{game.stats.hospitalVisits}</b>
      </div>
    </div>
  );
}

export function ContactsApp() {
  const game = useGame((s) => s.game)!;
  const met = NPCS.filter((n) => game.relationships[n.id]?.met);
  const unmet = NPCS.length - met.length;
  return (
    <div className="space-y-2">
      {met.length === 0 && <Empty>You haven&apos;t met anyone yet. Visit places around town — people keep regular schedules.</Empty>}
      {met.map((n) => {
        const r = game.relationships[n.id];
        const usual = [...new Set(n.schedule.map((s) => getLocation(s.at)?.name))].join(", ");
        return (
          <div key={n.id} className="card p-3">
            <div className="flex items-center gap-3">
              <span className="text-3xl">{n.emoji}</span>
              <div className="min-w-0 flex-1">
                <div className="flex justify-between">
                  <b>{n.name}</b>
                  <span className="text-xs font-semibold text-[var(--ink-2)]">{friendshipTier(r.friendship)}</span>
                </div>
                <div className="text-[11px] text-[var(--muted)]">
                  {n.role} · {getCity(n.city).name} · Usually at {usual}
                </div>
                <div className="mt-1.5">
                  <Meter compact value={r.friendship} label={`Friendship with ${n.name}`} color="var(--purple)" />
                </div>
                {r.owes > 0 && <div className="text-[11px] text-[var(--coral)] mt-1">Owes you {formatNaira(r.owes)}</div>}
              </div>
            </div>
          </div>
        );
      })}
      {unmet > 0 && <p className="text-xs text-[var(--muted)] text-center pt-2">{unmet} more people to meet across Nigeria…</p>}
    </div>
  );
}
