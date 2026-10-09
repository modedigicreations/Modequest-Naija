"use client";

import { useState } from "react";
import {
  BUSINESSES,
  BUSINESS_MAX_LEVEL,
  DIVEST_FEE,
  INFLATION_WEEKLY,
  INVESTMENTS,
  LOANS,
  SAVINGS_WEEKLY_RATE,
} from "@/game/data/economy";
import { bankFrozen, debtTotal, investmentsTotal, level, netWorth, price, SKILL_NAMES } from "@/game/helpers";
import { useGame } from "@/game/store";
import { dayOf, formatClock, formatNaira, WEEKDAYS, weekdayOf } from "@/game/util";
import { Empty, SectionTitle } from "../ui";

function AmountInput({ value, onChange, presets }: { value: string; onChange: (v: string) => void; presets: number[] }) {
  return (
    <div>
      <input className="input" inputMode="numeric" placeholder="Amount (₦)" value={value} onChange={(e) => onChange(e.target.value.replace(/[^\d]/g, ""))} />
      <div className="flex gap-1.5 mt-1.5 flex-wrap">
        {presets.map((p) => (
          <button key={p} className="chip" onClick={() => onChange(String(p))}>
            {formatNaira(p)}
          </button>
        ))}
      </div>
    </div>
  );
}

export function BankApp() {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const [amt, setAmt] = useState("");
  const n = Number(amt) || 0;
  const frozen = bankFrozen(game);
  const yearly = ((1 + SAVINGS_WEEKLY_RATE) ** 52 - 1) * 100;
  const infl = ((1 + INFLATION_WEEKLY) ** 52 - 1) * 100;

  return (
    <div className="space-y-3">
      <div className="rounded-3xl p-5 text-white" style={{ background: "linear-gradient(135deg,var(--brand-dark),var(--brand))" }}>
        <div className="text-xs opacity-80">Marina Bank · Savings</div>
        <div className="font-display text-3xl font-extrabold mt-1">{formatNaira(game.bank)}</div>
        <div className="flex justify-between text-xs mt-3 opacity-90">
          <span>💵 Cash: {formatNaira(game.cash)}</span>
          <span>Net worth: {formatNaira(netWorth(game))}</span>
        </div>
        {frozen && <div className="mt-2 text-xs font-bold bg-black/25 rounded-lg px-2 py-1">🔒 Frozen by investigators</div>}
      </div>

      {(game.pension ?? 0) > 0 && (
        <div className="card p-4">
          <SectionTitle right={<span className="chip chip-good">{formatNaira(game.pension ?? 0)}</span>}>🧓 Pension (RSA)</SectionTitle>
          <p className="text-[11px] text-[var(--ink-2)]">
            Locked for retirement. Every payslip, you put in 8% and your employer adds 10%; the fund grows each week. It counts in your net worth.
            {(game.stats.taxPaid ?? 0) > 0 && ` PAYE tax paid so far: ${formatNaira(game.stats.taxPaid ?? 0)} — it funds roads, schools and hospitals.`}
          </p>
        </div>
      )}

      <div className="card p-4">
        <SectionTitle>Move money</SectionTitle>
        <AmountInput value={amt} onChange={setAmt} presets={[...new Set([1000, 5000, 20000, Math.floor(game.cash)])].filter((p) => p > 0)} />
        <div className="grid grid-cols-2 gap-2 mt-3">
          <button className="btn btn-green btn-sm" disabled={!n || frozen} onClick={() => dispatch({ type: "bankTransfer", direction: "deposit", amount: n }) && setAmt("")}>
            Deposit cash
          </button>
          <button className="btn btn-ghost btn-sm" disabled={!n || frozen} onClick={() => dispatch({ type: "bankTransfer", direction: "withdraw", amount: n }) && setAmt("")}>
            Withdraw (₦100 fee)
          </button>
        </div>
        <p className="text-[11px] text-[var(--muted)] mt-2">
          Savings earn ~{yearly.toFixed(0)}%/year. Inflation is ~{infl.toFixed(0)}%/year — money just sitting loses buying power. Cash in your pocket can be stolen.
        </p>
      </div>

      <div className="card p-4">
        <SectionTitle right={debtTotal(game) > 0 ? <span className="chip chip-bad">Owe {formatNaira(debtTotal(game))}</span> : undefined}>💳 Loans</SectionTitle>
        {game.loans.map((l) => (
          <div key={l.id} className="rounded-xl bg-[var(--card-2)] p-3 mb-2 text-sm">
            <div className="flex justify-between font-bold">
              <span>{l.lender}</span>
              <span>{formatNaira(l.remaining)} left</span>
            </div>
            <div className="text-xs text-[var(--ink-2)]">
              {formatNaira(l.weekly)} every Monday{l.missed ? ` · ${l.missed} missed` : ""}
            </div>
            <button className="btn btn-ghost btn-sm mt-2" onClick={() => dispatch({ type: "repayLoan", loanId: l.id })}>
              Pay off now
            </button>
          </div>
        ))}
        <div className="grid gap-2">
          {LOANS.filter((d) => !game.loans.some((l) => l.id === d.id)).map((d) => (
            <div key={d.id} className="rounded-xl border border-[var(--line)] p-3 text-sm">
              <div className="flex justify-between">
                <b>
                  {d.predatory ? "⚠️ " : ""}
                  {d.name}
                </b>
                <span className="font-bold">{formatNaira(d.principal)}</span>
              </div>
              <div className="text-xs text-[var(--ink-2)] mt-0.5">
                {d.lender} · {formatNaira(d.weekly)}/wk × {d.weeks} · {d.blurb}
              </div>
              <button className="btn btn-ghost btn-sm mt-2" onClick={() => confirm(`Borrow ${formatNaira(d.principal)} and repay ${formatNaira(d.weekly * d.weeks)} in total?`) && dispatch({ type: "takeLoan", loanId: d.id })}>
                Borrow
              </button>
            </div>
          ))}
        </div>
      </div>

      <div className="card p-4">
        <SectionTitle>🧾 Recent transactions</SectionTitle>
        {game.transactions.length === 0 && <Empty>No transactions yet.</Empty>}
        <ul className="text-sm divide-y divide-[var(--line)]">
          {[...game.transactions].reverse().slice(0, 25).map((t, i) => (
            <li key={i} className="flex justify-between py-1.5 gap-2">
              <span className="min-w-0">
                <span className="block truncate">{t.label}</span>
                <span className="text-[11px] text-[var(--muted)]">
                  Day {dayOf(t.t)} {WEEKDAYS[weekdayOf(t.t)]} {formatClock(t.t)} · {t.account}
                </span>
              </span>
              <span className={`font-bold shrink-0 ${t.amount >= 0 ? "text-[var(--green)]" : "text-[var(--coral)]"}`}>
                {t.amount >= 0 ? "+" : ""}
                {formatNaira(t.amount)}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

export function InvestApp() {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const [amounts, setAmounts] = useState<Record<string, string>>({});

  return (
    <div className="space-y-3">
      <div className="card p-4">
        <div className="text-xs text-[var(--muted)]">Portfolio value</div>
        <div className="font-display text-3xl font-extrabold">{formatNaira(investmentsTotal(game))}</div>
        <p className="text-[11px] text-[var(--ink-2)] mt-1">Returns are applied every Monday. Invest from your bank balance. Never invest money you need for rent.</p>
      </div>
      {INVESTMENTS.map((inv) => {
        const v = game.investments[inv.id] ?? 0;
        const a = Number(amounts[inv.id]) || 0;
        return (
          <div key={inv.id} className="card p-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="font-bold">
                  {inv.emoji} {inv.name}
                </div>
                <div className="text-xs text-[var(--ink-2)]">{inv.blurb}</div>
              </div>
              <span className={`chip ${inv.risk === "Low" ? "chip-good" : inv.risk === "Medium" ? "chip-info" : "chip-bad"}`}>{inv.risk} risk</span>
            </div>
            {v > 0 && (
              <div className="flex items-center justify-between mt-3 rounded-xl bg-[var(--card-2)] p-2.5">
                <span className="text-sm">
                  You hold <b>{formatNaira(v)}</b>
                </span>
                <button className="btn btn-ghost btn-sm" onClick={() => dispatch({ type: "divest", productId: inv.id })}>
                  Sell ({DIVEST_FEE * 100}% fee)
                </button>
              </div>
            )}
            <div className="flex gap-2 mt-3">
              <input className="input" inputMode="numeric" placeholder={`Min ${formatNaira(inv.min)}`} value={amounts[inv.id] ?? ""} onChange={(e) => setAmounts((p) => ({ ...p, [inv.id]: e.target.value.replace(/[^\d]/g, "") }))} />
              <button className="btn btn-primary btn-sm shrink-0" disabled={a < inv.min} onClick={() => dispatch({ type: "invest", productId: inv.id, amount: a }) && setAmounts((p) => ({ ...p, [inv.id]: "" }))}>
                Invest
              </button>
            </div>
          </div>
        );
      })}
      {game.ponzi && (
        <div className="card p-4 border-[var(--coral)]">
          <div className="font-bold">💰 WealthRise Club</div>
          <div className="text-sm text-[var(--ink-2)]">
            You put in {formatNaira(game.ponzi.invested)}. {game.ponzi.paidOut ? "They paid one 'ROI'... and now ask you to recruit friends." : "They promised 100% in 14 days."}
          </div>
        </div>
      )}
      <p className="text-[11px] text-[var(--muted)] px-1">Diversify: don&apos;t put everything in one basket. And remember — anyone guaranteeing huge returns is running a scam.</p>
    </div>
  );
}

export function BusinessApp() {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const today = dayOf(game.time);

  return (
    <div className="space-y-3">
      <p className="text-xs text-[var(--ink-2)] px-1">Businesses pay profit every Monday. Visit (manage) at least every 2 weeks or profits halve. Your skills drive performance.</p>
      {game.businesses.length > 0 && <SectionTitle>Your businesses</SectionTitle>}
      {game.businesses.map((b) => {
        const def = BUSINESSES.find((x) => x.id === b.id)!;
        const neglected = today - b.lastManagedDay > 14;
        const upCost = price(game, def.price * 0.6 * b.level, false);
        const last = b.weeklyHistory[b.weeklyHistory.length - 1];
        return (
          <div key={b.id} className="card p-4">
            <div className="flex justify-between items-start">
              <div className="font-bold">
                {def.emoji} {def.name} <span className="chip">Lvl {b.level}</span>
              </div>
              {last !== undefined && <span className={`chip ${last >= 0 ? "chip-good" : "chip-bad"}`}>Last wk {formatNaira(last)}</span>}
            </div>
            {b.weeklyHistory.length > 1 && (
              <div className="flex items-end gap-1 h-10 mt-3">
                {b.weeklyHistory.map((p, i) => {
                  const max = Math.max(...b.weeklyHistory.map(Math.abs), 1);
                  return <div key={i} className="flex-1 rounded-t" style={{ height: `${Math.max(6, (Math.abs(p) / max) * 100)}%`, background: p >= 0 ? "var(--green)" : "var(--coral)" }} title={formatNaira(p)} />;
                })}
              </div>
            )}
            <div className={`text-xs mt-2 ${neglected ? "text-[var(--coral)] font-bold" : "text-[var(--ink-2)]"}`}>
              Last managed: day {b.lastManagedDay}
              {neglected ? " — neglected! Profits halved." : ""}
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              <button className="btn btn-green btn-sm" disabled={!!game.activity || !!game.travel} onClick={() => dispatch({ type: "manageBusiness", businessId: b.id })}>
                Manage (2h)
              </button>
              <button className="btn btn-ghost btn-sm" disabled={b.level >= BUSINESS_MAX_LEVEL} onClick={() => dispatch({ type: "upgradeBusiness", businessId: b.id })}>
                {b.level >= BUSINESS_MAX_LEVEL ? "Max level" : `Upgrade ${formatNaira(upCost)}`}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => confirm(`Sell your ${def.name}?`) && dispatch({ type: "sellBusiness", businessId: b.id })}>
                Sell
              </button>
            </div>
          </div>
        );
      })}

      <SectionTitle>Start a business</SectionTitle>
      {BUSINESSES.filter((d) => !game.businesses.some((b) => b.id === d.id)).map((d) => {
        const cost = price(game, d.price, false);
        const locked = d.requires && level(game, d.requires[0]) < d.requires[1];
        return (
          <div key={d.id} className="card p-4">
            <div className="flex justify-between">
              <b>
                {d.emoji} {d.name}
              </b>
              <span className="font-bold">{formatNaira(cost)}</span>
            </div>
            <div className="text-xs text-[var(--ink-2)] mt-1">{d.blurb}</div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              <span className="chip chip-good">~{formatNaira(price(game, d.weekly, false))}/wk</span>
              <span className="chip">Skill: {SKILL_NAMES[d.skill]}</span>
              <span className={`chip ${d.volatility > 0.5 ? "chip-bad" : ""}`}>Risk {d.volatility > 0.5 ? "high" : "moderate"}</span>
              {d.requires && <span className={`chip ${locked ? "chip-bad" : "chip-good"}`}>Needs {SKILL_NAMES[d.requires[0]]} {d.requires[1]}</span>}
            </div>
            <button className="btn btn-primary btn-sm mt-3" disabled={!!locked} onClick={() => confirm(`Start a ${d.name} for ${formatNaira(cost)}?`) && dispatch({ type: "buyBusiness", businessId: d.id })}>
              Start business
            </button>
          </div>
        );
      })}
    </div>
  );
}
