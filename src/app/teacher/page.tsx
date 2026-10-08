import type { Metadata } from "next";
import TeacherDashboard from "@/components/teacher/TeacherDashboard";

export const metadata: Metadata = {
  title: "ModeQuest for Teachers",
  description: "Create classes, student logins and assignments, and track progress in ModeQuest: Naija.",
};

export default function TeacherPage() {
  return <TeacherDashboard />;
}
