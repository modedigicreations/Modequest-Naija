"use client";

import { useCallback, useEffect, useState } from "react";
import { getLesson } from "@/game/data/lessons";
import { getCity } from "@/game/data/world";
import { useGame } from "@/game/store";
import { formatNaira } from "@/game/util";
import { type ChatMessage, classRoster, fetchClassMessages, fetchLeaderboard, type LeaderRow, type Metric, postClassMessage, sendGift, subscribeClassChat } from "@/online/social";
import { useSession } from "@/online/session";
import { Empty, SectionTitle } from "../ui";

const NO_LESSONS: Record<string, number> = {};

const METRICS: [Metric, string][] = [
  ["net_worth", "💰 Net worth"],
  ["academy", "🎓 Academy"],
  ["scams", "🛡️ Scams beaten"],
];

function Leaderboard({ classId }: { classId?: string | null }) {
  const [metric, setMetric] = useState<Metric>("academy");
  const [scope, setScope] = useState<"class" | "all">(classId ? "class" : "all");
  const [rows, setRows] = useState<LeaderRow[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    let live = true;
    fetchLeaderboard(metric, scope === "class" ? classId : null)
      .then((r) => live && (setRows(r), setErr(null)))
      .catch((e: Error) => live && setErr(e.message));
    return () => {
      live = false;
    };
  }, [metric, scope, classId]);

  return (
    <div className="card p-4">
      <SectionTitle>🏆 Leaderboard</SectionTitle>
      <div className="flex flex-wrap gap-1.5 mb-2">
        {METRICS.map(([m, label]) => (
          <button key={m} className={`chip ${metric === m ? "chip-info" : ""}`} onClick={() => setMetric(m)}>
            {label}
          </button>
        ))}
        {classId && (
          <button className="chip" onClick={() => setScope(scope === "class" ? "all" : "class")}>
            {scope === "class" ? "🏫 My class" : "🌍 All Nigeria"}
          </button>
        )}
      </div>
      {err && <p className="text-sm text-[var(--coral)]">{err}</p>}
      {!rows ? (
        <Empty>Loading…</Empty>
      ) : rows.length === 0 ? (
        <Empty>No scores yet. Play a bit and check back!</Empty>
      ) : (
        <ol className="text-sm divide-y divide-[var(--line)]">
          {rows.map((r, i) => (
            <li key={r.nickname} className={`flex items-center justify-between py-1.5 ${r.is_me ? "font-extrabold" : ""}`}>
              <span>
                {i < 3 ? ["🥇", "🥈", "🥉"][i] : `${i + 1}.`} {r.nickname}
                {r.supporter && <span title="ModeQuest Supporter"> ⭐</span>}
                {r.city && <span className="text-[11px] text-[var(--muted)]"> · {getCity(r.city).name}</span>}
              </span>
              <span>{metric === "net_worth" ? formatNaira(r.value ?? 0) : r.value ?? 0}</span>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}

function GiftForm() {
  const bank = useGame((s) => s.game?.bank ?? 0);
  const [to, setTo] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const n = Number(amount) || 0;

  return (
    <div className="card p-4">
      <SectionTitle>🎁 Send a gift</SectionTitle>
      <p className="text-[11px] text-[var(--ink-2)] mb-2">From your bank balance ({formatNaira(bank)}). Max ₦50,000 per gift, ₦100,000 a day. Students can only gift classmates.</p>
      <div className="grid gap-2">
        <input className="input" placeholder="Their nickname" value={to} onChange={(e) => setTo(e.target.value.replace(/[^A-Za-z0-9_]/g, ""))} />
        <input className="input" inputMode="numeric" placeholder="Amount (₦)" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, ""))} />
        <input className="input" placeholder="Note (optional)" maxLength={60} value={note} onChange={(e) => setNote(e.target.value)} />
        <button
          className="btn btn-primary btn-sm"
          disabled={busy || !to || n < 100 || n > 50000}
          onClick={async () => {
            setBusy(true);
            const err = await sendGift(to, n, note || undefined);
            setBusy(false);
            setMsg(err ? { ok: false, text: err } : { ok: true, text: `Sent ${formatNaira(n)} to ${to}!` });
            if (!err) {
              setAmount("");
              setNote("");
            }
          }}
        >
          Send gift
        </button>
        {msg && <p className={`text-sm ${msg.ok ? "text-[var(--green)]" : "text-[var(--coral)]"}`}>{msg.text}</p>}
      </div>
    </div>
  );
}

export function OnlineApp() {
  const profile = useSession((s) => s.profile);
  const myClass = useSession((s) => s.myClass);
  if (!profile) return <Empty>Sign in from the title screen to play online.</Empty>;
  return (
    <div className="space-y-3">
      <div className="card p-4">
        <div className="text-xs text-[var(--muted)]">Your public nickname</div>
        <div className="font-display text-xl font-extrabold">{profile.nickname}</div>
        <p className="text-[11px] text-[var(--ink-2)] mt-1">Other players see this name, never your real name. Players in your city appear in &quot;Players here&quot; at each place.</p>
      </div>
      <Leaderboard classId={myClass?.id} />
      <GiftForm />
    </div>
  );
}

export function ClassApp({ onOpenLesson }: { onOpenLesson: () => void }) {
  const profile = useSession((s) => s.profile);
  const myClass = useSession((s) => s.myClass);
  const teacherName = useSession((s) => s.teacherName);
  const assignments = useSession((s) => s.assignments);
  const lessons = useGame((s) => s.game?.lessons ?? NO_LESSONS);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [names, setNames] = useState<Record<string, string>>({});
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState<string | null>(null);

  const classId = myClass?.id;
  const load = useCallback(() => {
    if (classId) void fetchClassMessages(classId).then(setMessages);
  }, [classId]);

  useEffect(() => {
    if (!classId) return;
    fetchClassMessages(classId).then(setMessages);
    classRoster(classId).then((r) => setNames(Object.fromEntries(r.map((x) => [x.student_id, x.nickname]))));
    const unsubscribe = subscribeClassChat(classId, load);
    // Fallback in case a realtime update is missed (flaky mobile networks).
    const poll = setInterval(load, 20000);
    return () => {
      unsubscribe();
      clearInterval(poll);
    };
  }, [classId, load]);

  if (!profile || !myClass) return <Empty>Join a class with the code from your teacher (Student login on the title screen).</Empty>;

  return (
    <div className="space-y-3">
      <div className="rounded-3xl p-5 text-white" style={{ background: "linear-gradient(135deg,var(--brand),#456aec)" }}>
        <div className="text-xs opacity-80">{myClass.school ?? "My class"}</div>
        <div className="font-display text-2xl font-extrabold">{myClass.name}</div>
        {teacherName && <div className="text-sm opacity-90">👩🏾‍🏫 {teacherName}</div>}
      </div>

      <div className="card p-4">
        <SectionTitle right={<span className="chip">{assignments.filter((a) => (lessons[a.lesson_id] ?? 0) >= 60).length}/{assignments.length} done</span>}>📋 Assigned lessons</SectionTitle>
        {assignments.length === 0 ? (
          <Empty>No lessons assigned yet.</Empty>
        ) : (
          <ul className="space-y-1.5">
            {assignments.map((a) => {
              const l = getLesson(a.lesson_id);
              const score = lessons[a.lesson_id];
              const done = (score ?? 0) >= 60;
              return (
                <li key={a.lesson_id} className="flex items-center justify-between gap-2 text-sm">
                  <span>
                    {l?.emoji} {l?.title ?? a.lesson_id}
                    {a.due_date && <span className="text-[11px] text-[var(--muted)]"> · due {a.due_date}</span>}
                  </span>
                  {done ? <span className="chip chip-good">✓ {score}%</span> : <button className="chip chip-info" onClick={onOpenLesson}>Open Academy</button>}
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Leaderboard classId={myClass.id} />

      <div className="card p-4">
        <SectionTitle>💬 Class chat</SectionTitle>
        {!myClass.chat_enabled && <p className="text-xs text-[var(--coral)] mb-2">Your teacher has paused the chat.</p>}
        <div className="max-h-64 overflow-y-auto scroll-thin space-y-1.5 mb-2">
          {messages.length === 0 && <Empty>Say hello to your class 👋</Empty>}
          {messages.map((m) => (
            <div key={m.id} className={`text-sm ${m.author_id === profile.id ? "text-right" : ""}`}>
              <span className={`inline-block rounded-2xl px-3 py-1.5 ${m.author_id === profile.id ? "bg-[var(--green)] text-white" : m.author_id === myClass.teacher_id ? "bg-[var(--sky-soft)]" : "bg-[var(--card-2)]"}`}>
                <b className="text-[11px] block opacity-80">{m.author_id === profile.id ? "You" : m.author_id === myClass.teacher_id ? `👩🏾‍🏫 ${teacherName ?? "Teacher"}` : names[m.author_id] ?? "Classmate"}</b>
                {m.body}
              </span>
            </div>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={async (e) => {
            e.preventDefault();
            const body = draft.trim();
            if (!body) return;
            const error = await postClassMessage(myClass.id, profile.id, body);
            setErr(error);
            if (!error) {
              setDraft("");
              load();
            }
          }}
        >
          <input className="input" placeholder="Be kind. Your teacher can see this." maxLength={280} value={draft} onChange={(e) => setDraft(e.target.value)} disabled={!myClass.chat_enabled} />
          <button className="btn btn-green btn-sm shrink-0" disabled={!myClass.chat_enabled || !draft.trim()}>
            Send
          </button>
        </form>
        {err && <p className="text-xs text-[var(--coral)] mt-1">{err}</p>}
        <p className="text-[10px] text-[var(--muted)] mt-1">Phone numbers, links and rude words are hidden automatically.</p>
      </div>
    </div>
  );
}
