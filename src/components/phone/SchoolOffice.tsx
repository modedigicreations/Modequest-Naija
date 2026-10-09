"use client";

import { useState } from "react";
import type { BusinessDef } from "@/game/data/economy";
import { PUPILS_PER_TEACHER, SCHOLARSHIP_PLACES, TEACHER_LEVELS, TERM_WEEKS, demand, marketFee, payRate, schoolCapacity, teacherWeeklyPay } from "@/game/school";
import { useGame } from "@/game/store";
import type { OwnedBusiness } from "@/game/types";
import { formatNaira } from "@/game/util";
import { Meter } from "../ui";

/** Run your school: admissions, fees, teachers, unpaid fees and exams. */
export default function SchoolOffice({ b, def }: { b: OwnedBusiness; def: BusinessDef }) {
  const game = useGame((s) => s.game)!;
  const dispatch = useGame((s) => s.dispatch);
  const sc = b.school;
  const [fee, setFee] = useState(() => String(sc?.fee ?? def.school!.fee));
  if (!sc) return <p className="text-xs text-[var(--muted)] mt-2">Your school opens properly next Monday.</p>;

  const cap = schoolCapacity(def, b.level);
  const market = marketFee(game, def);
  const maxTeachers = Math.ceil(cap / 10);
  const minTeachers = Math.max(1, Math.ceil(sc.pupils / PUPILS_PER_TEACHER));
  const wanted = demand(game, def, b);
  const room = Math.min(cap, sc.teachers * PUPILS_PER_TEACHER);
  const set = (o: { fee?: number; teachers?: number; teacherLevel?: 0 | 1 | 2; scholarships?: boolean }) => dispatch({ type: "schoolSet", businessId: b.id, ...o });
  const weeklyIncome = Math.round(((Math.max(0, sc.pupils - (sc.scholarships ? SCHOLARSHIP_PLACES : 0)) * sc.fee) / TERM_WEEKS) * payRate(sc));
  const weeklyCosts = sc.teachers * teacherWeeklyPay(game, sc.teacherLevel);

  return (
    <div className="mt-3 rounded-2xl bg-[var(--card-2)] p-3 space-y-3 text-sm">
      <div className="flex items-center justify-between">
        <b>🏫 School office</b>
        <span className="chip">
          Term {sc.term} · week {sc.week}/{TERM_WEEKS}
        </span>
      </div>

      <div className="grid grid-cols-3 gap-2 text-center">
        <Stat label="Pupils" value={`${sc.pupils}/${cap}`} />
        <Stat label="Teachers" value={`${sc.teachers}`} />
        <Stat label="Last results" value={sc.lastPassRate === null ? "—" : `${sc.lastPassRate}%`} />
      </div>
      <Meter value={sc.reputation} label="Reputation" emoji="⭐" color="var(--brand)" />
      <p className="text-[11px] text-[var(--ink-2)]">
        Next term about <b>{Math.min(wanted, room)}</b> pupils want in{wanted > room ? ` (${wanted - room} more would come with ${room < cap ? "more teachers" : "a bigger building"})` : ""}. Reputation and fees decide it.
      </p>

      {/* Fees */}
      <div>
        <div className="text-xs font-bold text-[var(--muted)] mb-1">Fees per term (schools like yours charge about {formatNaira(market)})</div>
        <div className="flex gap-2">
          <input className="input" inputMode="numeric" value={fee} onChange={(e) => setFee(e.target.value.replace(/\D/g, ""))} aria-label="Fee per term" />
          <button className="btn btn-primary btn-sm shrink-0" disabled={Number(fee) === sc.fee} onClick={() => set({ fee: Number(fee) })}>
            Set fee
          </button>
        </div>
        <p className="text-[11px] text-[var(--ink-2)] mt-1">
          Higher fees mean more money per pupil but fewer families can afford you. Takes effect for admissions next term.
        </p>
      </div>

      {/* Teachers */}
      <div>
        <div className="text-xs font-bold text-[var(--muted)] mb-1">
          Teachers (max {PUPILS_PER_TEACHER} pupils each) · {formatNaira(teacherWeeklyPay(game, sc.teacherLevel))}/week each
        </div>
        <div className="flex items-center gap-2">
          <button className="btn btn-ghost btn-sm w-9 px-0" disabled={sc.teachers <= minTeachers} onClick={() => set({ teachers: sc.teachers - 1 })} aria-label="Fewer teachers">
            −
          </button>
          <b className="w-6 text-center">{sc.teachers}</b>
          <button className="btn btn-ghost btn-sm w-9 px-0" disabled={sc.teachers >= maxTeachers} onClick={() => set({ teachers: sc.teachers + 1 })} aria-label="More teachers">
            +
          </button>
          <div className="flex gap-1 ml-auto">
            {TEACHER_LEVELS.map((l, i) => (
              <button key={l} className={`chip ${sc.teacherLevel === i ? "chip-info" : ""}`} onClick={() => set({ teacherLevel: i as 0 | 1 | 2 })}>
                {l}
              </button>
            ))}
          </div>
        </div>
        <p className="text-[11px] text-[var(--ink-2)] mt-1">Better-paid teachers and smaller classes raise exam results and reputation.</p>
      </div>

      {/* Unpaid fees */}
      <div>
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-[var(--muted)]">Unpaid fees</span>
          <b className={sc.owed > 0 ? "text-[var(--coral)]" : ""}>{formatNaira(sc.owed)}</b>
        </div>
        <div className="grid grid-cols-2 gap-2 mt-1.5">
          <button className="btn btn-ghost btn-sm" disabled={sc.owed <= 0} onClick={() => dispatch({ type: "schoolChase", businessId: b.id, method: "remind" })}>
            📩 Reminders & payment plans
          </button>
          <button
            className="btn btn-ghost btn-sm"
            disabled={sc.owed <= 0}
            onClick={() => confirm("Send pupils home until their fees are paid? You'll collect more, but children miss lessons and your reputation suffers.") && dispatch({ type: "schoolChase", businessId: b.id, method: "send_home" })}
          >
            🚪 Send pupils home
          </button>
        </div>
        <p className="text-[11px] text-[var(--ink-2)] mt-1">About {Math.round(payRate(sc) * 100)}% of parents pay on time; half of what&apos;s still owed at term end is lost.</p>
      </div>

      {/* Scholarships + exams */}
      <label className="flex items-start gap-2 text-xs">
        <input type="checkbox" checked={sc.scholarships} onChange={(e) => set({ scholarships: e.target.checked })} className="mt-0.5" />
        <span>
          🎓 Offer {SCHOLARSHIP_PLACES} free scholarship places to bright pupils — no fees from them, but +2 reputation every term.
        </span>
      </label>
      <button className="btn btn-green w-full" disabled={sc.examDone || sc.week < TERM_WEEKS - 1} onClick={() => dispatch({ type: "schoolExam", businessId: b.id })}>
        {sc.examDone ? "✅ Exams done this term" : sc.week < TERM_WEEKS - 1 ? `📝 Exams open in week ${TERM_WEEKS - 1}` : "📝 Hold end-of-term exams"}
      </button>

      <p className="text-[11px] text-[var(--muted)]">
        This week: about {formatNaira(weeklyIncome)} in fees, {formatNaira(weeklyCosts)} in teacher salaries, plus books and diesel. Visit (Manage) at least every 2 weeks.
      </p>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl bg-[var(--card)] py-2">
      <div className="font-display font-extrabold">{value}</div>
      <div className="text-[10px] text-[var(--muted)]">{label}</div>
    </div>
  );
}
