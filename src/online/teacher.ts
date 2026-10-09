"use client";

import { sb } from "./client";

export interface TClass {
  id: string;
  name: string;
  school: string | null;
  code: string;
  chat_enabled: boolean;
  created_at: string;
}

export interface RosterRow {
  student_id: string;
  real_name: string;
  username: string;
  joined_at: string;
  nickname: string;
  save: {
    updated_at: string;
    city: string | null;
    day: number | null;
    net_worth: number | null;
    lessons_passed: number | null;
    lesson_scores: Record<string, number> | null;
    scams_avoided: number | null;
    scams_fallen: number | null;
    shifts: number | null;
    career: string | null;
    topped_up: number | null;
    /** From the save itself: lesson id -> question -> times missed. */
    misses?: Record<string, Record<string, number>> | null;
    /** Set by the server's economy checks (kept off leaderboards). */
    flagged?: string | null;
  } | null;
}

export interface NewStudent {
  studentId: string;
  realName: string;
  username: string;
  pin: string;
  nickname: string;
}

const client = () => {
  const c = sb();
  if (!c) throw new Error("Online features are not configured.");
  return c;
};

async function api<T>(path: string, method: string, body: unknown): Promise<T> {
  const { data } = await client().auth.getSession();
  const res = await fetch(path, {
    method,
    headers: { "content-type": "application/json", authorization: `Bearer ${data.session?.access_token ?? ""}` },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(json.error ?? `Request failed (${res.status})`);
  return json as T;
}

export async function listClasses(): Promise<TClass[]> {
  const { data: u } = await client().auth.getUser();
  const { data, error } = await client().from("classes").select("id, name, school, code, chat_enabled, created_at").eq("teacher_id", u.user!.id).order("created_at");
  if (error) throw new Error(error.message);
  return data as TClass[];
}

export async function createClass(name: string, school: string): Promise<TClass> {
  const { data: u } = await client().auth.getUser();
  const { data, error } = await client().from("classes").insert({ teacher_id: u.user!.id, name, school: school || null }).select("id, name, school, code, chat_enabled, created_at").single();
  if (error) throw new Error(error.message);
  return data as TClass;
}

export async function setChatEnabled(classId: string, on: boolean) {
  const { error } = await client().from("classes").update({ chat_enabled: on }).eq("id", classId);
  if (error) throw new Error(error.message);
}

export const deleteClass = (classId: string) => api<{ ok: boolean; removedStudents: number }>("/api/teacher/class", "DELETE", { classId });

export async function loadRoster(classId: string): Promise<RosterRow[]> {
  const c = client();
  const { data: members, error } = await c.from("class_members").select("student_id, real_name, username, joined_at").eq("class_id", classId).order("real_name");
  if (error) throw new Error(error.message);
  const ids = (members ?? []).map((m) => m.student_id);
  if (ids.length === 0) return [];
  const cols = "user_id, updated_at, city, day, net_worth, lessons_passed, lesson_scores, scams_avoided, scams_fallen, shifts, career, topped_up, misses:state->quizMisses";
  const [{ data: profiles }, first] = await Promise.all([
    c.from("profiles").select("id, nickname").in("id", ids),
    c.from("saves").select(`${cols}, flagged`).in("user_id", ids),
  ]);
  // Before the economy-checks migration there's no "flagged" column: load without it.
  const saves = first.error ? (await c.from("saves").select(cols).in("user_id", ids)).data : first.data;
  const nick = new Map((profiles ?? []).map((p) => [p.id, p.nickname as string]));
  const save = new Map((saves ?? []).map((s) => [s.user_id, s]));
  return (members ?? []).map((m) => ({ ...m, nickname: nick.get(m.student_id) ?? "?", save: (save.get(m.student_id) as RosterRow["save"]) ?? null }));
}

export const addStudents = (classId: string, names: string[]) =>
  api<{ classCode: string; created: NewStudent[]; failed: { realName: string; error: string }[] }>("/api/teacher/students", "POST", { classId, names });

export const resetPin = (classId: string, studentId: string) => api<{ username: string; pin: string }>("/api/teacher/students/reset", "POST", { classId, studentId });

export const removeStudent = (classId: string, studentId: string) => api<{ ok: boolean }>("/api/teacher/students", "DELETE", { classId, studentId });

export async function loadAssignments(classId: string): Promise<{ lesson_id: string; due_date: string | null }[]> {
  const { data, error } = await client().from("assignments").select("lesson_id, due_date").eq("class_id", classId);
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function setAssignment(classId: string, lessonId: string, on: boolean, due?: string | null) {
  const c = client();
  const { error } = on
    ? await c.from("assignments").upsert({ class_id: classId, lesson_id: lessonId, due_date: due || null }, { onConflict: "class_id,lesson_id" })
    : await c.from("assignments").delete().eq("class_id", classId).eq("lesson_id", lessonId);
  if (error) throw new Error(error.message);
}

export interface TMessage {
  id: number;
  author_id: string;
  body: string;
  created_at: string;
  deleted_at: string | null;
}

export async function loadMessages(classId: string): Promise<TMessage[]> {
  const { data, error } = await client().from("class_messages").select("id, author_id, body, created_at, deleted_at").eq("class_id", classId).order("created_at", { ascending: false }).limit(100);
  if (error) throw new Error(error.message);
  return (data ?? []) as TMessage[];
}

export async function hideMessage(id: number) {
  const { error } = await client().from("class_messages").update({ deleted_at: new Date().toISOString() }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function postAsTeacher(classId: string, body: string) {
  const { data: u } = await client().auth.getUser();
  const { error } = await client().from("class_messages").insert({ class_id: classId, author_id: u.user!.id, body });
  if (error) throw new Error(error.message);
}

/** The questions most students in the class got wrong in a lesson. */
export function classStruggles(rows: RosterRow[], lessonId: string, top = 3): { question: string; students: number }[] {
  const count: Record<string, number> = {};
  for (const r of rows) for (const q of Object.keys(r.save?.misses?.[lessonId] ?? {})) count[q] = (count[q] ?? 0) + 1;
  return Object.entries(count)
    .map(([question, students]) => ({ question, students }))
    .sort((a, b) => b.students - a.students)
    .slice(0, top);
}

export function rosterCsv(rows: RosterRow[], lessonIds: string[]): string {
  const head = ["Name", "Username", "Nickname", "Last active", "City", "Day", "Net worth", "Lessons passed", "Assigned passed", "Scams avoided", "Scams fallen for", "Shifts", "Career", "Bought game money"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((r) => {
    const s = r.save;
    const assigned = lessonIds.filter((id) => (s?.lesson_scores?.[id] ?? 0) >= 60).length;
    return [r.real_name, r.username, r.nickname, s?.updated_at ?? "never", s?.city, s?.day, s?.net_worth, s?.lessons_passed, `${assigned}/${lessonIds.length}`, s?.scams_avoided, s?.scams_fallen, s?.shifts, s?.career, s?.topped_up ?? 0].map(esc).join(",");
  });
  return [head.map(esc).join(","), ...lines].join("\n");
}
