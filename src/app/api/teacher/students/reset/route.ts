import { randomInt } from "node:crypto";
import { errorResponse, HttpError, requireTeacherOf } from "@/online/server";

/** Give a student a new 6-digit PIN: { classId, studentId } → { pin }. */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { classId?: string; studentId?: string };
    if (!body.classId || !body.studentId) throw new HttpError(400, "classId and studentId are required.");
    const { db, cls } = await requireTeacherOf(req, body.classId);
    const { data: member } = await db.from("class_members").select("username").eq("class_id", cls.id).eq("student_id", body.studentId).maybeSingle();
    if (!member) throw new HttpError(404, "Student not found in this class.");
    const pin = String(randomInt(0, 1_000_000)).padStart(6, "0");
    const { error } = await db.auth.admin.updateUserById(body.studentId, { password: pin });
    if (error) throw new HttpError(500, error.message);
    return Response.json({ username: member.username, pin });
  } catch (e) {
    return errorResponse(e);
  }
}
