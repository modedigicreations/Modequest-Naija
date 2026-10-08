// Live invite-bonus test against the real Supabase project.
// Usage: node scripts/live/referrals.mjs   (creates zz_* users, deletes them after)
import { createRequire } from "node:module";
import fs from "node:fs";
const ROOT = new URL("../../", import.meta.url).pathname;
const require = createRequire(ROOT + "package.json");
const { createClient } = require("@supabase/supabase-js");

const env = Object.fromEntries(fs.readFileSync(ROOT + ".env.local", "utf8").split("\n").filter(Boolean).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const SB_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const admin = createClient(SB_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = () => createClient(SB_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const stamp = Date.now().toString(36);
const created = [];
let pass = 0, fail = 0;
const ok = (c, label, extra = "") => { c ? pass++ : fail++; console.log(`${c ? "PASS" : "FAIL"}: ${label}${extra ? " — " + extra : ""}`); };

async function mkUser(tag, meta) {
  const email = `zz_${tag}_${stamp}@example.com`;
  const { data, error } = await admin.auth.admin.createUser({ email, password: "Test-pass-123!", email_confirm: true, user_metadata: meta });
  if (error) throw new Error(error.message);
  created.push(data.user.id);
  const c = anon();
  await c.auth.signInWithPassword({ email, password: "Test-pass-123!" });
  return { id: data.user.id, c, email };
}
const save = (u, day) => u.c.from("saves").upsert({ user_id: u.id, state: { version: 2 }, day, updated_at: new Date().toISOString() });

try {
  const inviter = await mkUser("inv", { role: "player", nickname: `zzInv${stamp}` });
  const { data: stats0 } = await inviter.c.rpc("my_referral_stats").single();
  ok(/^[A-Z0-9]{7}$/.test(stats0?.code ?? ""), "inviter has a referral code", stats0?.code);

  const friend = await mkUser("friend", { role: "player", nickname: `zzPal${stamp}`, ref: stats0.code.toLowerCase() });
  const stranger = await mkUser("stranger", { role: "player", nickname: `zzStr${stamp}`, ref: "NOTACODE1" });
  const { data: stats1 } = await inviter.c.rpc("my_referral_stats").single();
  ok(Number(stats1.invited) === 1, "friend's sign-up counted (bad codes ignored)", `invited=${stats1.invited}`);

  ok(!(await save(friend, 1)).error, "friend saves their game");
  let { data: waiting } = await inviter.c.rpc("referral_rewards");
  ok((waiting ?? []).length === 0, "no bonus before Day 3");

  ok(!(await save(friend, 3)).error, "friend reaches Day 3");
  ({ data: waiting } = await inviter.c.rpc("referral_rewards"));
  ok(waiting?.length === 1 && waiting[0].amount === 20000 && waiting[0].friend === `zzPal${stamp}`, "₦20,000 bonus waiting for the inviter", JSON.stringify(waiting));

  const { data: theirs } = await stranger.c.rpc("claim_referral_rewards", { ids: [friend.id] });
  ok((theirs ?? []).length === 0, "someone else can't claim it");
  const { error: hack } = await friend.c.from("referrals").update({ reward: 999999 }).eq("referred_id", friend.id);
  ok(!!hack, "friend can't edit the referral", hack?.message);

  if (process.env.KEEP_UNCLAIMED) {
    console.log(`INVITER ${inviter.email} Test-pass-123!`);
  } else {
    const { data: claimed } = await inviter.c.rpc("claim_referral_rewards", { ids: [friend.id] });
    ok(claimed?.length === 1, "inviter claims the bonus");
    const { data: again } = await inviter.c.rpc("claim_referral_rewards", { ids: [friend.id] });
    ok((again ?? []).length === 0, "bonus can't be claimed twice");
    const { data: stats2 } = await inviter.c.rpc("my_referral_stats").single();
    ok(Number(stats2.earned) === 20000 && Number(stats2.rewarded) === 1, "stats show ₦20,000 earned", JSON.stringify(stats2));
  }
} catch (e) {
  ok(false, "unexpected error", e.message);
} finally {
  if (!process.env.KEEP_UNCLAIMED) for (const id of created) await admin.auth.admin.deleteUser(id);
  console.log(`\n${pass} passed, ${fail} failed`);
  if (fail) process.exitCode = 1;
}
