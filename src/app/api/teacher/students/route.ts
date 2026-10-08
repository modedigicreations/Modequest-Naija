import { randomInt } from "node:crypto";
import { errorResponse, HttpError, requireTeacherOf } from "@/online/server";
import { randomNickname, studentEmail, usernameFromName } from "@/online/shared";

const MAX_PER_REQUEST = 60;
const MAX_PER_CLASS = 120;

const newPin = () => String(randomInt(0, 1_000_000)).padStart(6, "0");

/** Create student logins: { classId, names: string[] } → usernames + PINs. */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { classId?: string; names?: string[] };
    if (!body.classId || !Array.isArray(body.names)) throw new HttpError(400, "classId and names are required.");
    const names = body.names.map((n) => String(n).trim().slice(0, 80)).filter(Boolean);
    if (names.length === 0) throw new HttpError(400, "Add at least one name.");
    if (names.length > MAX_PER_REQUEST) throw new HttpError(400, `Add at most ${MAX_PER_REQUEST} students at a time.`);

    const { db, cls } = await requireTeacherOf(req, body.classId);
    const { data: existing } = await db.from("class_members").select("username").eq("class_id", cls.id);
    const taken = new Set((existing ?? []).map((m: { username: string }) => m.username));
    if (taken.size + names.length > MAX_PER_CLASS) throw new HttpError(400, `A class can have at most ${MAX_PER_CLASS} students.`);

    const created: { studentId: string; realName: string; username: string; pin: string; nickname: string }[] = [];
    const failed: { realName: string; error: string }[] = [];

    for (const realName of names) {
      let username = usernameFromName(realName);
      for (let i = 2; taken.has(username); i++) username = `${usernameFromName(realName).slice(0, 17)}${i}`;
      taken.add(username);

      let nickname = randomNickname();
      for (let tries = 0; tries < 5; tries++) {
        const { count } = await db.from("profiles").select("id", { count: "exact", head: true }).eq("nickname", nickname);
        if (!count) break;
        nickname = randomNickname();
      }

      const pin = newPin();
      const { data, error } = await db.auth.admin.createUser({
        email: studentEmail(username, cls.code),
        password: pin,
        email_confirm: true,
        user_metadata: { role: "student", nickname },
      });
      if (error || !data.user) {
        failed.push({ realName, error: error?.message ?? "Could not create login." });
        continue;
      }
      const { error: memberError } = await db.from("class_members").insert({ class_id: cls.id, student_id: data.user.id, real_name: realName, username });
      if (memberError) {
        await db.auth.admin.deleteUser(data.user.id);
        failed.push({ realName, error: memberError.message });
        continue;
      }
      created.push({ studentId: data.user.id, realName, username, pin, nickname });
    }

    return Response.json({ classCode: cls.code, created, failed });
  } catch (e) {
    return errorResponse(e);
  }
}

/** Remove a student from the class and delete their login: { classId, studentId }. */
export async function DELETE(req: Request) {
  try {
    const body = (await req.json()) as { classId?: string; studentId?: string };
    if (!body.classId || !body.studentId) throw new HttpError(400, "classId and studentId are required.");
    const { db, cls } = await requireTeacherOf(req, body.classId);
    const { data: member } = await db.from("class_members").select("student_id").eq("class_id", cls.id).eq("student_id", body.studentId).maybeSingle();
    if (!member) throw new HttpError(404, "Student not found in this class.");
    const { error } = await db.auth.admin.deleteUser(body.studentId);
    if (error) throw new HttpError(500, error.message);
    return Response.json({ ok: true });
  } catch (e) {
    return errorResponse(e);
  }
}
