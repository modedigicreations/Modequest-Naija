"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { LESSONS } from "@/game/data/lessons";
import { getCity } from "@/game/data/world";
import { formatNaira } from "@/game/util";
import { onlineEnabled } from "@/online/client";
import { useSession } from "@/online/session";
import {
  addStudents,
  createClass,
  deleteClass,
  hideMessage,
  listClasses,
  loadAssignments,
  loadMessages,
  loadRoster,
  type NewStudent,
  postAsTeacher,
  removeStudent,
  resetPin,
  type RosterRow,
  rosterCsv,
  setAssignment,
  setChatEnabled,
  type TClass,
  type TMessage,
} from "@/online/teacher";
import { Empty, Modal, SectionTitle } from "../ui";
import { PLANS, PRODUCTS } from "@/shop/catalog";
import { buy, useShop } from "@/shop/client";

type Tab = "students" | "lessons" | "chat";

function timeAgo(iso?: string | null) {
  if (!iso) return "never";
  const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (m < 2) return "just now";
  if (m < 60) return `${m} min ago`;
  if (m < 60 * 24) return `${Math.round(m / 60)} h ago`;
  return `${Math.round(m / 1440)} d ago`;
}

export default function TeacherDashboard() {
  const { ready, user, profile, init, signOut } = useSession();

  useEffect(() => {
    void init();
  }, [init]);

  if (!onlineEnabled) {
    return (
      <Shell>
        <div className="card p-6 max-w-lg">
          <h1 className="font-display text-2xl font-extrabold">Teacher tools need the online server</h1>
          <p className="text-sm text-[var(--ink-2)] mt-2">This copy of ModeQuest is running offline. Ask your administrator to connect Supabase (see README → Online setup).</p>
        </div>
      </Shell>
    );
  }
  if (!ready) return <Shell><Empty>Loading…</Empty></Shell>;
  if (!user || !profile) return <Shell><TeacherAuth /></Shell>;
  if (profile.role !== "teacher") {
    return (
      <Shell>
        <div className="card p-6 max-w-lg">
          <h1 className="font-display text-2xl font-extrabold">This is a {profile.role} account</h1>
          <p className="text-sm text-[var(--ink-2)] mt-2">Teacher tools need a teacher account. Sign out and create one with your school details.</p>
          <button className="btn btn-ghost mt-4" onClick={() => void signOut()}>
            Sign out
          </button>
        </div>
      </Shell>
    );
  }
  return (
    <Shell right={<span className="text-sm font-semibold">{profile.display_name ?? profile.nickname} · <button className="underline" onClick={() => void signOut()}>Sign out</button></span>}>
      <Classes />
    </Shell>
  );
}

function Shell({ children, right }: { children: React.ReactNode; right?: React.ReactNode }) {
  return (
    <div className="min-h-dvh">
      <header className="no-print bg-[var(--card)] border-b border-[var(--line)] px-4 py-3 flex items-center justify-between gap-3">
        <Link href="/" className="flex items-center gap-2 font-display font-extrabold">
          <span className="w-8 h-8 rounded-xl grid place-items-center bg-[var(--danfo)] text-[var(--danfo-ink)]">M</span>
          ModeQuest <span className="chip chip-info">for Teachers</span>
        </Link>
        {right}
      </header>
      <main className="max-w-6xl mx-auto p-4">{children}</main>
    </div>
  );
}

function TeacherAuth() {
  const { signIn, signUpTeacher } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signup");
  const [f, setF] = useState({ email: "", password: "", nickname: "", displayName: "", school: "" });
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  return (
    <div className="grid md:grid-cols-2 gap-6 items-start">
      <div>
        <h1 className="font-display text-4xl font-extrabold leading-tight">Bring ModeQuest to your classroom</h1>
        <ul className="mt-4 space-y-2 text-[var(--ink-2)]">
          <li>🏫 Create classes and get a join code</li>
          <li>🔐 Create student logins in seconds — no student emails or phone numbers</li>
          <li>📋 Assign lessons on money, scams, coding and digital safety</li>
          <li>📊 Track progress: lessons passed, scams avoided, savings, activity</li>
          <li>💬 Moderate a safe class chat (links, numbers and insults are hidden)</li>
        </ul>
      </div>
      <form
        className="card p-5 grid gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setBusy(true);
          const err = mode === "signin" ? await signIn(f.email, f.password) : await signUpTeacher({ email: f.email, password: f.password, nickname: f.nickname, displayName: f.displayName, school: f.school });
          setBusy(false);
          setMsg(err ? { ok: false, text: err } : mode === "signup" ? { ok: true, text: "Account created! Confirm your email, then sign in." } : null);
        }}
      >
        <div className="grid grid-cols-2 gap-1 bg-[var(--card-2)] rounded-xl p-1 mb-1">
          {(["signup", "signin"] as const).map((m) => (
            <button type="button" key={m} className={`rounded-lg py-1.5 text-sm font-bold ${mode === m ? "bg-[var(--card)] shadow-sm" : "text-[var(--ink-2)]"}`} onClick={() => setMode(m)}>
              {m === "signup" ? "Create teacher account" : "Sign in"}
            </button>
          ))}
        </div>
        {mode === "signup" && (
          <>
            <input className="input" placeholder="Your name as students see it (e.g. Mrs. Ibim)" value={f.displayName} onChange={set("displayName")} />
            <input className="input" placeholder="School (e.g. GGSS Rumueme, Port Harcourt)" value={f.school} onChange={set("school")} />
            <input className="input" placeholder="Nickname (letters, numbers, _)" value={f.nickname} onChange={(e) => setF({ ...f, nickname: e.target.value.replace(/[^A-Za-z0-9_]/g, "").slice(0, 20) })} />
          </>
        )}
        <input className="input" type="email" placeholder="School or personal email" value={f.email} onChange={set("email")} autoComplete="email" />
        <input className="input" type="password" placeholder="Password (8+ characters)" value={f.password} onChange={set("password")} autoComplete={mode === "signup" ? "new-password" : "current-password"} />
        <button className="btn btn-primary mt-1" disabled={busy || !f.email || f.password.length < 8 || (mode === "signup" && (!f.displayName || f.nickname.length < 3))}>
          {mode === "signup" ? "Create account" : "Sign in"}
        </button>
        {msg && <p className={`text-sm ${msg.ok ? "text-[var(--green)]" : "text-[var(--coral)]"}`}>{msg.text}</p>}
      </form>
    </div>
  );
}

function Classes() {
  const [classes, setClasses] = useState<TClass[] | null>(null);
  const [active, setActive] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [school, setSchool] = useState(useSession.getState().profile?.school ?? "");
  const [err, setErr] = useState<string | null>(null);

  const reload = useCallback(() => {
    listClasses()
      .then((c) => {
        setClasses(c);
        setActive((a) => a ?? c[0]?.id ?? null);
      })
      .catch((e: Error) => setErr(e.message));
  }, []);

  useEffect(() => {
    reload();
  }, [reload]);

  const cls = classes?.find((c) => c.id === active) ?? null;

  return (
    <div className="grid lg:grid-cols-[260px_1fr] gap-4 items-start">
      <aside className="card p-4 no-print">
        <SectionTitle>Your classes</SectionTitle>
        {!classes ? (
          <Empty>Loading…</Empty>
        ) : classes.length === 0 ? (
          <p className="text-sm text-[var(--muted)]">No classes yet — create your first one below.</p>
        ) : (
          <div className="grid gap-1.5">
            {classes.map((c) => (
              <button key={c.id} onClick={() => setActive(c.id)} className={`text-left rounded-xl px-3 py-2 ${c.id === active ? "bg-[var(--bg-2)] font-bold" : "hover:bg-[var(--card-2)]"}`}>
                {c.name}
                <span className="block text-[11px] text-[var(--muted)]">Code {c.code}</span>
              </button>
            ))}
          </div>
        )}
        <form
          className="grid gap-2 mt-4 pt-4 border-t border-[var(--line)]"
          onSubmit={async (e) => {
            e.preventDefault();
            try {
              const c = await createClass(name.trim(), school.trim());
              setName("");
              setActive(c.id);
              reload();
            } catch (ex) {
              setErr((ex as Error).message);
            }
          }}
        >
          <input className="input" placeholder="New class (e.g. JSS2 Gold)" value={name} onChange={(e) => setName(e.target.value)} />
          <input className="input" placeholder="School" value={school} onChange={(e) => setSchool(e.target.value)} />
          <button className="btn btn-primary btn-sm" disabled={name.trim().length < 2}>
            + Create class
          </button>
        </form>
        {err && <p className="text-xs text-[var(--coral)] mt-2">{err}</p>}
        <PlanCard classCount={classes?.length ?? 0} />
      </aside>
      {cls ? <ClassView key={cls.id} cls={cls} onChanged={reload} onDeleted={() => { setActive(null); reload(); }} /> : <div className="card p-6"><Empty>Create or pick a class to get started.</Empty></div>}
    </div>
  );
}

function ClassView({ cls, onChanged, onDeleted }: { cls: TClass; onChanged: () => void; onDeleted: () => void }) {
  const [tab, setTab] = useState<Tab>("students");
  const [roster, setRoster] = useState<RosterRow[] | null>(null);
  const [assigned, setAssigned] = useState<{ lesson_id: string; due_date: string | null }[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const [active7, setActive7] = useState(0);

  const reload = useCallback(() => {
    loadRoster(cls.id)
      .then((r) => {
        setRoster(r);
        const weekAgo = Date.now() - 7 * 86400000;
        setActive7(r.filter((x) => x.save && new Date(x.save.updated_at).getTime() > weekAgo).length);
      })
      .catch((e: Error) => setErr(e.message));
    loadAssignments(cls.id).then(setAssigned).catch((e: Error) => setErr(e.message));
  }, [cls.id]);

  useEffect(() => {
    reload();
  }, [reload]);

  const assignedIds = useMemo(() => assigned.map((a) => a.lesson_id), [assigned]);
  const avgLessons = roster?.length ? roster.reduce((a, r) => a + (r.save?.lessons_passed ?? 0), 0) / roster.length : 0;
  const scams = roster?.reduce((a, r) => a + (r.save?.scams_avoided ?? 0), 0) ?? 0;

  return (
    <section className="space-y-4">
      <div className="card p-5 no-print">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="text-xs text-[var(--muted)]">{cls.school}</div>
            <h1 className="font-display text-3xl font-extrabold">{cls.name}</h1>
            <p className="text-sm text-[var(--ink-2)] mt-1">Students sign in on the title screen → Student → class code, username and PIN.</p>
          </div>
          <div className="text-center rounded-2xl bg-[var(--ink)] text-[var(--danfo)] px-5 py-3">
            <div className="text-[10px] font-bold tracking-widest opacity-70">CLASS CODE</div>
            <div className="font-display text-3xl font-extrabold tracking-[0.2em]">{cls.code}</div>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          <Stat label="Students" value={roster?.length ?? "…"} />
          <Stat label="Active this week" value={active7} />
          <Stat label="Avg lessons passed" value={avgLessons.toFixed(1)} />
          <Stat label="Scams avoided (total)" value={scams} />
        </div>
        <div className="flex gap-1 mt-4 bg-[var(--card-2)] rounded-xl p-1 w-fit">
          {([
            ["students", "👥 Students"],
            ["lessons", "📋 Assign lessons"],
            ["chat", "💬 Class chat"],
          ] as [Tab, string][]).map(([t, label]) => (
            <button key={t} className={`rounded-lg px-3 py-1.5 text-sm font-bold ${tab === t ? "bg-[var(--card)] shadow-sm" : "text-[var(--ink-2)]"}`} onClick={() => setTab(t)}>
              {label}
            </button>
          ))}
        </div>
      </div>
      {err && <p className="text-sm text-[var(--coral)]">{err}</p>}
      {tab === "students" && <StudentsTab cls={cls} roster={roster} assignedIds={assignedIds} onChanged={reload} />}
      {tab === "lessons" && <LessonsTab cls={cls} assigned={assigned} roster={roster} onChanged={reload} />}
      {tab === "chat" && <ChatTab cls={cls} roster={roster} onChanged={onChanged} />}
      <div className="no-print text-right">
        <button
          className="text-xs text-[var(--coral)] underline"
          onClick={async () => {
            if (!confirm(`Delete ${cls.name}? All its student logins and their progress will be deleted too. This can't be undone.`)) return;
            await deleteClass(cls.id);
            onDeleted();
          }}
        >
          Delete class
        </button>
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="rounded-2xl bg-[var(--card-2)] p-3">
      <div className="text-[11px] text-[var(--muted)] font-semibold">{label}</div>
      <div className="font-display text-2xl font-extrabold">{value}</div>
    </div>
  );
}

function StudentsTab({ cls, roster, assignedIds, onChanged }: { cls: TClass; roster: RosterRow[] | null; assignedIds: string[]; onChanged: () => void }) {
  const [names, setNames] = useState("");
  const [busy, setBusy] = useState(false);
  const [cards, setCards] = useState<NewStudent[] | null>(null);
  const [err, setErr] = useState<string | null>(null);

  return (
    <>
      <div className="card p-5 no-print">
        <SectionTitle>Add students</SectionTitle>
        <p className="text-sm text-[var(--ink-2)] mb-2">One name per line. Each student gets a username and a 6-digit PIN. Real names are only visible to you; other players see a random nickname.</p>
        <textarea className="input h-28" placeholder={"Adaeze Okoro\nTobi Bello\nZainab Musa"} value={names} onChange={(e) => setNames(e.target.value)} />
        <button
          className="btn btn-primary mt-2"
          disabled={busy || !names.trim()}
          onClick={async () => {
            setBusy(true);
            setErr(null);
            try {
              const r = await addStudents(cls.id, names.split("\n").map((n) => n.trim()).filter(Boolean));
              setCards(r.created);
              if (r.failed.length) setErr(`Couldn't add: ${r.failed.map((f) => `${f.realName} (${f.error})`).join(", ")}`);
              setNames("");
              onChanged();
            } catch (e) {
              setErr((e as Error).message);
            }
            setBusy(false);
          }}
        >
          {busy ? "Creating logins…" : "Create student logins"}
        </button>
        {err && <p className="text-sm text-[var(--coral)] mt-2">{err}</p>}
      </div>

      <div className="card p-5 overflow-x-auto no-print">
        <SectionTitle
          right={
            roster?.length ? (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => {
                  const blob = new Blob([rosterCsv(roster, assignedIds)], { type: "text/csv" });
                  const a = document.createElement("a");
                  a.href = URL.createObjectURL(blob);
                  a.download = `${cls.name.replace(/\s+/g, "_")}_progress.csv`;
                  a.click();
                }}
              >
                ⬇ Export CSV
              </button>
            ) : undefined
          }
        >
          Progress
        </SectionTitle>
        {!roster ? (
          <Empty>Loading…</Empty>
        ) : roster.length === 0 ? (
          <Empty>No students yet.</Empty>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-[11px] uppercase tracking-wide text-[var(--muted)]">
                <th className="py-2 pr-3">Student</th>
                <th className="pr-3">Last active</th>
                <th className="pr-3">City · Day</th>
                <th className="pr-3">Lessons</th>
                <th className="pr-3">Assigned</th>
                <th className="pr-3">Scams ✓/✗</th>
                <th className="pr-3">Net worth</th>
                <th className="pr-3">Career</th>
                <th className="pr-3" title="In-game money bought with real money">Bought ₦</th>
                <th />
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--line)]">
              {roster.map((r) => {
                const s = r.save;
                const done = assignedIds.filter((id) => (s?.lesson_scores?.[id] ?? 0) >= 60).length;
                return (
                  <tr key={r.student_id}>
                    <td className="py-2 pr-3">
                      <b>{r.real_name}</b>
                      <div className="text-[11px] text-[var(--muted)]">
                        {r.username} · {r.nickname}
                      </div>
                    </td>
                    <td className="pr-3">{timeAgo(s?.updated_at)}</td>
                    <td className="pr-3">{s ? `${getCity(s.city ?? "lagos").name} · ${s.day}` : "—"}</td>
                    <td className="pr-3">{s?.lessons_passed ?? 0}</td>
                    <td className="pr-3">
                      <span className={`chip ${assignedIds.length && done === assignedIds.length ? "chip-good" : ""}`}>
                        {done}/{assignedIds.length}
                      </span>
                    </td>
                    <td className="pr-3">
                      {s?.scams_avoided ?? 0} / <span className={(s?.scams_fallen ?? 0) > 0 ? "text-[var(--coral)] font-bold" : ""}>{s?.scams_fallen ?? 0}</span>
                    </td>
                    <td className="pr-3">{s?.net_worth != null ? formatNaira(s.net_worth) : "—"}</td>
                    <td className="pr-3 text-xs">{s?.career ?? "—"}</td>
                    <td className="pr-3 text-xs">{s?.topped_up ? <span className="chip chip-bad">{formatNaira(s.topped_up)}</span> : "—"}</td>
                    <td className="text-right whitespace-nowrap">
                      <button
                        className="text-xs underline mr-2"
                        onClick={async () => {
                          try {
                            const p = await resetPin(cls.id, r.student_id);
                            setCards([{ studentId: r.student_id, realName: r.real_name, username: p.username, pin: p.pin, nickname: r.nickname }]);
                          } catch (e) {
                            setErr((e as Error).message);
                          }
                        }}
                      >
                        New PIN
                      </button>
                      <button
                        className="text-xs underline text-[var(--coral)]"
                        onClick={async () => {
                          if (!confirm(`Remove ${r.real_name}? Their login and progress will be deleted.`)) return;
                          try {
                            await removeStudent(cls.id, r.student_id);
                            onChanged();
                          } catch (e) {
                            setErr((e as Error).message);
                          }
                        }}
                      >
                        Remove
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      <Modal open={!!cards} onClose={() => setCards(null)} wide label="Student login cards">
        <div className="no-print flex items-center justify-between mb-3">
          <h2 className="font-display text-xl font-extrabold">Login cards</h2>
          <div className="flex gap-2">
            <button className="btn btn-primary btn-sm" onClick={() => window.print()}>
              🖨 Print
            </button>
            <button className="btn btn-ghost btn-sm" onClick={() => setCards(null)}>
              Close
            </button>
          </div>
        </div>
        <p className="no-print text-xs text-[var(--coral)] mb-3">PINs are shown only now. Print or copy them before closing.</p>
        <div className="print-area grid sm:grid-cols-2 gap-3">
          {cards?.map((c) => (
            <div key={c.studentId} className="rounded-2xl border-2 border-dashed border-[var(--ink-2)] p-4 break-inside-avoid">
              <div className="text-xs font-bold">ModeQuest · {cls.name}</div>
              <div className="font-display text-lg font-extrabold">{c.realName}</div>
              <div className="text-sm mt-2 grid grid-cols-[auto_1fr] gap-x-3">
                <span>Class code</span>
                <b className="tracking-widest">{cls.code}</b>
                <span>Username</span>
                <b>{c.username}</b>
                <span>PIN</span>
                <b className="tracking-widest">{c.pin}</b>
              </div>
              <div className="text-[10px] mt-2">Go to the game → Play online → Student. Keep your PIN secret.</div>
            </div>
          ))}
        </div>
      </Modal>
    </>
  );
}

function LessonsTab({ cls, assigned, roster, onChanged }: { cls: TClass; assigned: { lesson_id: string; due_date: string | null }[]; roster: RosterRow[] | null; onChanged: () => void }) {
  const [err, setErr] = useState<string | null>(null);
  const isOn = (id: string) => assigned.some((a) => a.lesson_id === id);
  return (
    <div className="card p-5 no-print">
      <SectionTitle>Mode Academy lessons</SectionTitle>
      <p className="text-sm text-[var(--ink-2)] mb-3">Assigned lessons show up in students&apos; Academy and My Class apps.</p>
      {err && <p className="text-sm text-[var(--coral)] mb-2">{err}</p>}
      <div className="grid md:grid-cols-2 gap-2">
        {LESSONS.map((l) => {
          const on = isOn(l.id);
          const passed = roster?.filter((r) => (r.save?.lesson_scores?.[l.id] ?? 0) >= 60).length ?? 0;
          return (
            <label key={l.id} className={`flex items-center gap-3 rounded-2xl border-2 p-3 cursor-pointer ${on ? "border-[var(--green)] bg-[var(--green-soft)]" : "border-[var(--line)]"}`}>
              <input
                type="checkbox"
                checked={on}
                onChange={async (e) => {
                  try {
                    await setAssignment(cls.id, l.id, e.target.checked);
                    onChanged();
                  } catch (ex) {
                    setErr((ex as Error).message);
                  }
                }}
              />
              <span className="text-xl">{l.emoji}</span>
              <span className="min-w-0 flex-1">
                <span className="block font-bold text-sm">{l.title}</span>
                <span className="block text-[11px] text-[var(--muted)]">
                  {l.topic} · {passed}/{roster?.length ?? 0} passed
                </span>
              </span>
            </label>
          );
        })}
      </div>
    </div>
  );
}

function ChatTab({ cls, roster, onChanged }: { cls: TClass; roster: RosterRow[] | null; onChanged: () => void }) {
  const [msgs, setMsgs] = useState<TMessage[] | null>(null);
  const [draft, setDraft] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const who = useMemo(() => new Map((roster ?? []).map((r) => [r.student_id, `${r.real_name} (${r.nickname})`])), [roster]);
  const reload = useCallback(() => {
    loadMessages(cls.id).then(setMsgs).catch((e: Error) => setErr(e.message));
  }, [cls.id]);

  useEffect(() => {
    reload();
    const id = setInterval(reload, 15000);
    return () => clearInterval(id);
  }, [reload]);

  return (
    <div className="card p-5 no-print">
      <SectionTitle
        right={
          <label className="flex items-center gap-2 text-sm font-semibold">
            <input
              type="checkbox"
              checked={cls.chat_enabled}
              onChange={async (e) => {
                await setChatEnabled(cls.id, e.target.checked);
                onChanged();
              }}
            />
            Chat on
          </label>
        }
      >
        Class chat
      </SectionTitle>
      <form
        className="flex gap-2 mb-3"
        onSubmit={async (e) => {
          e.preventDefault();
          try {
            await postAsTeacher(cls.id, draft.trim());
            setDraft("");
            reload();
          } catch (ex) {
            setErr((ex as Error).message);
          }
        }}
      >
        <input className="input" placeholder="Post an announcement…" value={draft} maxLength={280} onChange={(e) => setDraft(e.target.value)} />
        <button className="btn btn-green btn-sm shrink-0" disabled={!draft.trim()}>
          Post
        </button>
      </form>
      {err && <p className="text-sm text-[var(--coral)]">{err}</p>}
      {!msgs ? (
        <Empty>Loading…</Empty>
      ) : msgs.length === 0 ? (
        <Empty>No messages yet.</Empty>
      ) : (
        <ul className="divide-y divide-[var(--line)]">
          {msgs.map((m) => (
            <li key={m.id} className={`py-2 flex items-start justify-between gap-3 text-sm ${m.deleted_at ? "opacity-50" : ""}`}>
              <span>
                <b>{who.get(m.author_id) ?? "You"}</b> <span className="text-[11px] text-[var(--muted)]">{timeAgo(m.created_at)}</span>
                <span className="block">{m.body}</span>
              </span>
              {m.deleted_at ? (
                <span className="chip">Hidden</span>
              ) : (
                <button className="text-xs underline text-[var(--coral)] shrink-0" onClick={() => hideMessage(m.id).then(reload)}>
                  Hide
                </button>
              )}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function PlanCard({ classCount }: { classCount: number }) {
  const { plan, refresh, enabled: paymentsEnabled } = useShop();
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    void refresh();
  }, [refresh, classCount]);

  const current = PLANS.find((p) => p.id === (plan?.plan ?? "free")) ?? PLANS[0];
  return (
    <div className="mt-4 pt-4 border-t border-[var(--line)]">
      <div className="text-xs font-bold text-[var(--muted)] uppercase tracking-wide">Your plan</div>
      <div className="font-display text-lg font-extrabold">{current.name}</div>
      <div className="text-xs text-[var(--ink-2)]">
        {classCount}/{current.maxClasses} classes · up to {current.maxStudents} students
        {plan?.expires_at && <span className="block">Renews/ends {new Date(plan.expires_at).toLocaleDateString()}</span>}
      </div>
      {paymentsEnabled && (
        <div className="grid gap-1.5 mt-2">
          {PRODUCTS.filter((p) => p.teacherOnly).map((p) => (
            <button
              key={p.id}
              className="btn btn-ghost btn-sm justify-between"
              disabled={!!busy}
              title={p.blurb}
              onClick={async () => {
                setErr(null);
                setBusy(p.id);
                try {
                  await buy(p.id, true);
                } catch (e) {
                  setErr((e as Error).message);
                  setBusy(null);
                }
              }}
            >
              <span>{p.emoji} {p.name.split(" · ")[0]}</span>
              <span>₦{p.priceNaira.toLocaleString()}</span>
            </button>
          ))}
        </div>
      )}
      {err && <p className="text-xs text-[var(--coral)] mt-1">{err}</p>}
    </div>
  );
}
