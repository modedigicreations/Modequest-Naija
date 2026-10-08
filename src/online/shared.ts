// Code shared by the browser and the server (route handlers).

/** Students log in with class code + username + PIN; Supabase needs an email, so we derive one. No mail is ever sent. */
export const STUDENT_EMAIL_DOMAIN = "students.modequest.com.ng";

export function studentEmail(username: string, classCode: string) {
  return `${username.trim().toLowerCase()}-${classCode.trim().toLowerCase()}@${STUDENT_EMAIL_DOMAIN}`;
}

export const NICKNAME_RE = /^[A-Za-z0-9_]{3,20}$/;

const ADJ = ["Swift", "Bright", "Calm", "Bold", "Clever", "Lucky", "Sunny", "Brave", "Smart", "Happy", "Cool", "Wise", "Quick", "Kind", "Royal", "Golden"];
const NOUN = ["Danfo", "Keke", "Suya", "Jollof", "Mango", "Lion", "Eagle", "Coder", "Star", "Drum", "Baobab", "Zobo", "Puff", "Kola", "Chinchin", "Agama"];

/** A random, friendly public nickname that reveals nothing about the child. */
export function randomNickname(rand: () => number = Math.random) {
  const a = ADJ[Math.floor(rand() * ADJ.length)];
  const n = NOUN[Math.floor(rand() * NOUN.length)];
  return `${a}${n}${10 + Math.floor(rand() * 90)}`;
}

/** Login username from a real name: first name, letters only. */
export function usernameFromName(realName: string) {
  const first = realName.trim().split(/\s+/)[0] ?? "";
  const clean = first.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 16);
  return clean.length >= 2 ? clean : "student";
}

/** Preset phrases: the only messages players can send to strangers. */
export const QUICK_CHAT = [
  "Hello! 👋",
  "How far? 😄",
  "Nice one! 👏",
  "Let's study together 📚",
  "Who wan play football? ⚽",
  "Good luck at work! 💼",
  "Watch out for scam DMs ⚠️",
  "Thank you! 🙏",
  "LOL 😂",
  "Wahala! 😅",
  "Let's go! 🚀",
  "Need help? 🤝",
  "See you later 👋",
  "GG! 🏆",
] as const;
