// Live end-to-end test of accounts, classes, chat, gifts, leaderboards and
// presence against the real Supabase project and a running app.
// Usage: npm run dev, then APP_URL=http://localhost:3000 node scripts/live/multiplayer.mjs
// Creates zz_* test users and deletes them afterwards.
import { createRequire } from "node:module";
import fs from "node:fs";
const ROOT = new URL("../../", import.meta.url).pathname;
const require = createRequire(ROOT + "package.json");
const { createClient } = require("@supabase/supabase-js");

const env = Object.fromEntries(fs.readFileSync(ROOT + ".env.local", "utf8").split("\n").filter(Boolean).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const URL_ = env.NEXT_PUBLIC_SUPABASE_URL;
const admin = createClient(URL_, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = () => createClient(URL_, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const APP = process.env.APP_URL ?? "http://localhost:3000";
const stamp = Date.now().toString(36);
const created = [];
let pass = 0, fail = 0;
const ok = (c, label, extra = "") => { c ? pass++ : fail++; console.log(`${c ? "PASS" : "FAIL"}: ${label}${extra ? " — " + extra : ""}`); };
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function mkUser(email, meta) {
  const { data, error } = await admin.auth.admin.createUser({ email, password: "Test-pass-123!", email_confirm: true, user_metadata: meta });
  if (error) throw new Error(email + ": " + error.message);
  created.push(data.user.id);
  const c = anon();
  const { error: e2 } = await c.auth.signInWithPassword({ email, password: "Test-pass-123!" });
  if (e2) throw e2;
  const { data: s } = await c.auth.getSession();
  return { id: data.user.id, c, token: s.session.access_token };
}
const api = (path, method, token, body) => fetch(APP + path, { method, headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify(body) }).then(async (r) => ({ status: r.status, ok: r.ok, json: await r.json().catch(() => ({})) }));

try {
  const teacher = await mkUser(`zz_teacher_${stamp}@example.com`, { role: "teacher", nickname: `zzT${stamp}`, display_name: "Mrs Test", school: "Test School" });
  const p1 = await mkUser(`zz_p1_${stamp}@example.com`, { role: "player", nickname: `zzP1${stamp}` });
  await mkUser(`zz_p2_${stamp}@example.com`, { role: "player", nickname: `zzP2${stamp}` });
  const { data: tp } = await teacher.c.from("profiles").select("role").eq("id", teacher.id).single();
  ok(tp?.role === "teacher", "teacher profile created by trigger");

  const { data: cls, error: ce } = await teacher.c.from("classes").insert({ teacher_id: teacher.id, name: "zz Test Class", school: "Test School" }).select().single();
  ok(!ce && cls?.code?.length === 6, "teacher creates class", ce?.message ?? cls?.code);

  let r = await api("/api/teacher/students", "POST", teacher.token, { classId: cls.id, names: ["Ada Okoro", "Tobi Bello"] });
  ok(r.ok && r.json.created?.length === 2, "API creates 2 student logins", r.ok ? r.json.created.map((s) => `${s.username}/${s.nickname}`).join(", ") : r.json.error);
  for (const s of r.json.created ?? []) created.push(s.studentId);
  const [a, b] = r.json.created;

  r = await api("/api/teacher/students", "POST", p1.token, { classId: cls.id, names: ["Hacker"] });
  ok(r.status === 403, "non-teacher blocked from creating students", String(r.status));

  const studentEmail = (u) => `${u}-${cls.code.toLowerCase()}@students.modequest.com.ng`;
  const sa = anon();
  const sb = anon();
  const la = await sa.auth.signInWithPassword({ email: studentEmail(a.username), password: a.pin });
  const lb = await sb.auth.signInWithPassword({ email: studentEmail(b.username), password: b.pin });
  ok(!la.error && !lb.error, "students sign in with code + username + PIN", la.error?.message ?? lb.error?.message);
  ok(!!(await anon().auth.signInWithPassword({ email: studentEmail(a.username), password: "000000" })).error, "wrong PIN rejected");

  const { data: members } = await sa.from("class_members").select("real_name");
  ok(members?.length === 1, "student sees only own membership row");
  const { data: roster } = await sa.rpc("class_roster", { class: cls.id });
  ok(roster?.length === 2 && !JSON.stringify(roster).includes("Okoro"), "classmates listed by nickname only");

  const up = await sa.from("saves").upsert({ user_id: a.studentId, state: { test: true, version: 2 }, city: "portharcourt", day: 3, net_worth: 50000, earned_worth: 50000, lessons_passed: 4, lesson_scores: { phishing: 100 }, scams_avoided: 2, scams_fallen: 0, shifts: 5, career: "Market Apprentice" });
  ok(!up.error, "student cloud save", up.error?.message);
  ok((await sb.from("saves").select("user_id").eq("user_id", a.studentId)).data?.length === 0, "classmate cannot read another's save");
  ok((await teacher.c.from("saves").select("lessons_passed").eq("user_id", a.studentId)).data?.[0]?.lessons_passed === 4, "teacher reads student progress");

  ok(!(await teacher.c.from("assignments").upsert({ class_id: cls.id, lesson_id: "phishing" }, { onConflict: "class_id,lesson_id" })).error, "teacher assigns lesson");
  ok((await sa.from("assignments").select("lesson_id")).data?.[0]?.lesson_id === "phishing", "student sees assignment");

  let realtimeGot = null;
  const chan = sb.channel(`class:${cls.id}`).on("postgres_changes", { event: "INSERT", schema: "public", table: "class_messages", filter: `class_id=eq.${cls.id}` }, (p) => { realtimeGot = p.new.body; });
  await new Promise((res) => chan.subscribe((st) => st === "SUBSCRIBED" && res()));
  await sleep(1500);
  const msg = await sa.from("class_messages").insert({ class_id: cls.id, author_id: a.studentId, body: "you are stupid, call 08031234567" }).select().single();
  ok(msg.data?.body === "you are ******, call [number hidden]", "chat filter", msg.data?.body ?? msg.error?.message);
  await sleep(3000);
  ok(realtimeGot !== null, "class chat arrives in real time", realtimeGot ?? "no event");
  await sb.removeChannel(chan);
  ok((await p1.c.from("class_messages").select("id")).data?.length === 0, "outsider cannot read class chat");

  ok(!(await sa.rpc("send_gift", { to_nickname: b.nickname, amount: 2000, note: "for transport" })).error, "classmate gift");
  ok(!!(await sa.rpc("send_gift", { to_nickname: `zzP1${stamp}`, amount: 2000 })).error, "student cannot gift adult player");
  ok(!(await p1.c.rpc("send_gift", { to_nickname: `zzP2${stamp}`, amount: 1500 })).error, "players gift each other");
  const claim = await sb.rpc("claim_gifts");
  ok(claim.data?.[0]?.amount === 2000 && claim.data[0].from_nickname === a.nickname, "recipient claims gift");

  const lb1 = await sa.rpc("leaderboard", { metric: "academy", class: cls.id, lim: 10 });
  ok(!lb1.error && lb1.data?.some((x) => x.is_me), "class leaderboard", lb1.error?.message);
  ok(!!(await anon().rpc("leaderboard", { metric: "academy" })).error, "signed-out visitors can't read leaderboards");

  const seen = await new Promise((resolve) => {
    const ch = `city:zztest_${stamp}`;
    const c1 = sa.channel(ch, { config: { presence: { key: a.studentId } } });
    const c2 = sb.channel(ch, { config: { presence: { key: b.studentId } } });
    let done = false;
    c2.on("presence", { event: "sync" }, () => {
      const st = c2.presenceState();
      if (!done && st[a.studentId]) { done = true; resolve(st[a.studentId][0].nickname); sa.removeChannel(c1); sb.removeChannel(c2); }
    });
    c1.subscribe((s) => s === "SUBSCRIBED" && c1.track({ id: a.studentId, nickname: a.nickname, location: "ph_mile1" }));
    c2.subscribe((s) => s === "SUBSCRIBED" && c2.track({ id: b.studentId, nickname: b.nickname, location: "ph_mile1" }));
    setTimeout(() => !done && resolve(null), 10000);
  });
  ok(seen === a.nickname, "players see each other via presence", String(seen));

  ok(!!(await sa.from("profiles").update({ role: "teacher" }).eq("id", a.studentId)).error, "student cannot become teacher");

  r = await api("/api/teacher/students/reset", "POST", teacher.token, { classId: cls.id, studentId: b.studentId });
  ok(r.ok && !(await anon().auth.signInWithPassword({ email: studentEmail(b.username), password: r.json.pin })).error, "PIN reset works");
  r = await api("/api/teacher/students", "DELETE", teacher.token, { classId: cls.id, studentId: b.studentId });
  ok(r.ok, "teacher removes student");

  r = await api("/api/teacher/class", "DELETE", teacher.token, { classId: cls.id });
  const { data: left } = await admin.from("profiles").select("id").eq("id", a.studentId);
  ok(r.ok && left.length === 0, "deleting a class removes its student logins", JSON.stringify(r.json));
} catch (e) {
  fail++;
  console.log("ERROR:", e.stack);
} finally {
  for (const id of created) await admin.auth.admin.deleteUser(id).catch(() => {});
  console.log(`\n${pass} passed, ${fail} failed. Cleaned up test users.`);
  process.exit(fail ? 1 : 0);
}
