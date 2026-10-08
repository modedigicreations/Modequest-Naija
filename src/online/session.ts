"use client";

import type { User } from "@supabase/supabase-js";
import { create } from "zustand";
import { LocalSaveAdapter } from "@/game/persistence";
import { useGame } from "@/game/store";
import { CloudSaveAdapter } from "./cloud";
import { onlineEnabled, sb } from "./client";
import { NICKNAME_RE, studentEmail } from "./shared";

export interface Profile {
  id: string;
  role: "player" | "student" | "teacher";
  nickname: string;
  display_name: string | null;
  school: string | null;
  city: string;
}

export interface ClassInfo {
  id: string;
  name: string;
  school: string | null;
  code: string;
  chat_enabled: boolean;
  teacher_id: string;
}

interface Session {
  ready: boolean;
  user: User | null;
  profile: Profile | null;
  myClass: ClassInfo | null;
  teacherName: string | null;
  assignments: { lesson_id: string; due_date: string | null }[];

  init(): Promise<void>;
  refresh(): Promise<void>;
  signUpPlayer(o: { email: string; password: string; nickname: string; city: string }): Promise<string | null>;
  signUpTeacher(o: { email: string; password: string; nickname: string; displayName: string; school: string }): Promise<string | null>;
  signIn(email: string, password: string): Promise<string | null>;
  signInStudent(classCode: string, username: string, pin: string): Promise<string | null>;
  signOut(): Promise<void>;
}

let started = false;

async function nicknameTaken(nickname: string) {
  const { count } = await sb()!.from("profiles").select("id", { count: "exact", head: true }).ilike("nickname", nickname);
  return (count ?? 0) > 0;
}

/** Point the game at this user's saves (or the guest save) and reload. */
async function switchSaves(uid: string | null) {
  const game = useGame.getState();
  const adapter = uid ? new CloudSaveAdapter(uid) : new LocalSaveAdapter();
  await game.switchAdapter(adapter);
}

export const useSession = create<Session>((set, get) => ({
  ready: !onlineEnabled,
  user: null,
  profile: null,
  myClass: null,
  teacherName: null,
  assignments: [],

  async init() {
    const client = sb();
    if (!client || started) {
      set({ ready: true });
      return;
    }
    started = true;
    const { data } = await client.auth.getSession();
    set({ user: data.session?.user ?? null });
    await get().refresh();
    if (data.session?.user) await switchSaves(data.session.user.id);
    set({ ready: true });

    client.auth.onAuthStateChange((event, session) => {
      const prev = get().user?.id ?? null;
      const next = session?.user ?? null;
      set({ user: next });
      if ((next?.id ?? null) !== prev) {
        void get().refresh();
        void switchSaves(next?.id ?? null);
      }
      void event;
    });
  },

  async refresh() {
    const client = sb();
    const user = get().user;
    if (!client || !user) {
      set({ profile: null, myClass: null, assignments: [], teacherName: null });
      return;
    }
    const { data: profile } = await client.from("profiles").select("id, role, nickname, display_name, school, city").eq("id", user.id).maybeSingle();
    let myClass: ClassInfo | null = null;
    let teacherName: string | null = null;
    let assignments: Session["assignments"] = [];
    if (profile?.role === "student") {
      const { data: member } = await client.from("class_members").select("class_id").eq("student_id", user.id).maybeSingle();
      if (member) {
        const { data: cls } = await client.from("classes").select("id, name, school, code, chat_enabled, teacher_id").eq("id", member.class_id).maybeSingle();
        myClass = cls;
        if (cls) {
          const { data: t } = await client.from("profiles").select("display_name, nickname").eq("id", cls.teacher_id).maybeSingle();
          teacherName = t?.display_name || t?.nickname || null;
          const { data: a } = await client.from("assignments").select("lesson_id, due_date").eq("class_id", cls.id);
          assignments = a ?? [];
        }
      }
    }
    set({ profile: profile as Profile | null, myClass, teacherName, assignments });
  },

  async signUpPlayer({ email, password, nickname, city }) {
    const client = sb();
    if (!client) return "Online play isn't available yet.";
    if (!NICKNAME_RE.test(nickname)) return "Nickname: 3–20 letters, numbers or _ only.";
    if (await nicknameTaken(nickname)) return "That nickname is taken.";
    const { error } = await client.auth.signUp({ email, password, options: { data: { role: "player", nickname, city } } });
    return error?.message ?? null;
  },

  async signUpTeacher({ email, password, nickname, displayName, school }) {
    const client = sb();
    if (!client) return "Online play isn't available yet.";
    if (!NICKNAME_RE.test(nickname)) return "Nickname: 3–20 letters, numbers or _ only.";
    if (await nicknameTaken(nickname)) return "That nickname is taken.";
    const { error } = await client.auth.signUp({
      email,
      password,
      options: { data: { role: "teacher", nickname, display_name: displayName, school } },
    });
    return error?.message ?? null;
  },

  async signIn(email, password) {
    const client = sb();
    if (!client) return "Online play isn't available yet.";
    const { error } = await client.auth.signInWithPassword({ email, password });
    return error ? "Wrong email or password." : null;
  },

  async signInStudent(classCode, username, pin) {
    const client = sb();
    if (!client) return "Online play isn't available yet.";
    const { error } = await client.auth.signInWithPassword({ email: studentEmail(username, classCode), password: pin.trim() });
    return error ? "Check your class code, username and PIN — or ask your teacher." : null;
  },

  async signOut() {
    const client = sb();
    await useGame.getState().flushSave();
    await client?.auth.signOut();
  },
}));
