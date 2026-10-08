import { errorResponse, HttpError, requireTeacherOf } from "@/online/server";

/**
 * Delete a class and its student logins: { classId }. Student accounts only
 * exist inside a class, so leaving them behind would orphan them.
 */
export async function DELETE(req: Request) {
  try {
    const body = (await req.json()) as { classId?: string };
    if (!body.classId) throw new HttpError(400, "classId is required.");
    const { db, cls } = await requireTeacherOf(req, body.classId);
    const { data: members } = await db.from("class_members").select("student_id").eq("class_id", cls.id);
    for (const m of members ?? []) {
      const { error } = await db.auth.admin.deleteUser(m.student_id);
      if (error) throw new HttpError(500, `Could not remove a student login: ${error.message}`);
    }
    const { error } = await db.from("classes").delete().eq("id", cls.id);
    if (error) throw new HttpError(500, error.message);
    return Response.json({ ok: true, removedStudents: members?.length ?? 0 });
  } catch (e) {
    return errorResponse(e);
  }
}
