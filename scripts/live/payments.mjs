// Live payment test: real Paystack TEST mode + live Supabase + a running app.
// Usage: npm run dev, then APP_URL=http://localhost:3000 node scripts/live/payments.mjs
// Creates zz_* test users and deletes them afterwards. Never run with live Paystack keys.
import { createRequire } from "node:module";
import { createHmac } from "node:crypto";
import fs from "node:fs";
const ROOT = new URL("../../", import.meta.url).pathname;
const require = createRequire(ROOT + "package.json");
const { createClient } = require("@supabase/supabase-js");

const env = Object.fromEntries(fs.readFileSync(ROOT + ".env.local", "utf8").split("\n").filter(Boolean).map((l) => [l.slice(0, l.indexOf("=")), l.slice(l.indexOf("=") + 1)]));
const SB_URL = env.NEXT_PUBLIC_SUPABASE_URL;
const SK = env.PAYSTACK_SECRET_KEY;
const admin = createClient(SB_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const anon = () => createClient(SB_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, { auth: { persistSession: false } });
const APP = process.env.APP_URL ?? "http://localhost:3000";
const stamp = Date.now().toString(36);
const created = [];
let pass = 0, fail = 0;
const ok = (c, label, extra = "") => { c ? pass++ : fail++; console.log(`${c ? "PASS" : "FAIL"}: ${label}${extra ? " — " + extra : ""}`); };

async function mkUser(email, meta) {
  const { data, error } = await admin.auth.admin.createUser({ email, password: "Test-pass-123!", email_confirm: true, user_metadata: meta });
  if (error) throw new Error(error.message);
  created.push(data.user.id);
  const c = anon();
  await c.auth.signInWithPassword({ email, password: "Test-pass-123!" });
  const { data: s } = await c.auth.getSession();
  return { id: data.user.id, c, token: s.session.access_token };
}
const api = (path, token, body) => fetch(APP + path, { method: "POST", headers: { "content-type": "application/json", authorization: `Bearer ${token}` }, body: JSON.stringify(body) }).then(async (r) => ({ status: r.status, json: await r.json().catch(() => ({})) }));
const ps = (path, body) => fetch("https://api.paystack.co" + path, { method: "POST", headers: { authorization: `Bearer ${SK}`, "content-type": "application/json" }, body: JSON.stringify(body) }).then((r) => r.json());

/** Pay a pending Paystack transaction with Paystack's documented test card. */
async function payWithTestCard(email, amountKobo, reference) {
  let r = await ps("/charge", { email, amount: amountKobo, reference, card: { number: "4084084084084081", cvv: "408", expiry_month: "12", expiry_year: "2030" } });
  for (let i = 0; i < 4 && r.data && r.data.status !== "success"; i++) {
    const st = r.data.status;
    if (st === "send_pin") r = await ps("/charge/submit_pin", { pin: "0000", reference });
    else if (st === "send_otp") r = await ps("/charge/submit_otp", { otp: "123456", reference });
    else break;
  }
  return r;
}

/** Same order row /api/pay/init creates, paid with Paystack's test card. */
async function paidOrder(user, email, productId, amountKobo) {
  const reference = `mq_test_${stamp}_${Math.random().toString(36).slice(2, 8)}`;
  await admin.from("orders").insert({ user_id: user.id, product_id: productId, amount_kobo: amountKobo, reference });
  const charge = await payWithTestCard(email, amountKobo, reference);
  return { reference, charge };
}

if (!SK?.startsWith("sk_test_")) throw new Error("Refusing to run: PAYSTACK_SECRET_KEY is not a test key.");

try {
  const player = await mkUser(`zz_pay_${stamp}@example.com`, { role: "player", nickname: `zzPay${stamp}` });
  const teacher = await mkUser(`zz_payt_${stamp}@example.com`, { role: "teacher", nickname: `zzPayT${stamp}`, display_name: "Pay Teacher" });

  // 1. Guards
  let r = await api("/api/pay/init", player.token, { productId: "c_crown" });
  ok(r.status === 400, "checkout requires age/permission confirmation", r.json.error);
  r = await api("/api/pay/init", player.token, { productId: "p_classroom_term", ageConfirmed: true });
  ok(r.status === 403, "players can't buy school plans", r.json.error);
  r = await api("/api/pay/init", player.token, { productId: "nope", ageConfirmed: true });
  ok(r.status === 404, "unknown product rejected");

  // 2. Real checkout for a bundle
  r = await api("/api/pay/init", player.token, { productId: "b_naija_style", ageConfirmed: true });
  ok(r.status === 200 && r.json.authorizationUrl?.includes("paystack"), "checkout created on Paystack", r.json.authorizationUrl ?? r.json.error);
  const ref1 = r.json.reference;
  const { data: o1 } = await admin.from("orders").select("amount_kobo, status").eq("reference", ref1).single();
  ok(o1?.amount_kobo === 150000 && o1.status === "pending", "order priced from catalog (₦1,500)");

  // Verify before paying → still pending, nothing granted
  r = await api("/api/pay/verify", player.token, { reference: ref1 });
  ok(r.json.status !== "paid", "unpaid checkout is not fulfilled", r.json.status);

  // A paid bundle order, then verify
  const p1 = await paidOrder(player, `zz_pay_${stamp}@example.com`, "b_naija_style", 150000);
  const pref = p1.reference;
  ok(p1.charge.data?.status === "success", "Paystack test card charge", p1.charge.data?.status ?? p1.charge.message);
  r = await api("/api/pay/verify", player.token, { reference: pref });
  ok(r.json.status === "paid", "verify marks order paid", JSON.stringify(r.json));
  const { data: cos } = await player.c.from("entitlements").select("item").eq("kind", "cosmetic");
  ok(cos?.length === 4, "bundle grants 4 cosmetics", cos?.map((x) => x.item).join(","));

  // Webhook replay is idempotent and signature-checked
  const tx = await fetch(`https://api.paystack.co/transaction/verify/${pref}`, { headers: { authorization: `Bearer ${SK}` } }).then((x) => x.json());
  const body = JSON.stringify({ event: "charge.success", data: tx.data });
  const sig = createHmac("sha512", SK).update(body).digest("hex");
  let w = await fetch(APP + "/api/pay/webhook", { method: "POST", headers: { "x-paystack-signature": sig, "content-type": "application/json" }, body });
  ok(w.status === 200, "signed webhook accepted");
  const { data: cos2 } = await player.c.from("entitlements").select("item").eq("kind", "cosmetic");
  ok(cos2?.length === 4, "webhook replay doesn't double-grant");
  w = await fetch(APP + "/api/pay/webhook", { method: "POST", headers: { "x-paystack-signature": "deadbeef", "content-type": "application/json" }, body });
  ok(w.status === 401, "forged webhook rejected");

  // 3. Top-up via webhook path only (no verify call)
  const p2 = await paidOrder(player, `zz_pay_${stamp}@example.com`, "t_small", 30000);
  const ref2 = p2.reference;
  ok(p2.charge.data?.status === "success", "top-up charged");
  const tx2 = await fetch(`https://api.paystack.co/transaction/verify/${ref2}`, { headers: { authorization: `Bearer ${SK}` } }).then((x) => x.json());
  const b2 = JSON.stringify({ event: "charge.success", data: tx2.data });
  await fetch(APP + "/api/pay/webhook", { method: "POST", headers: { "x-paystack-signature": createHmac("sha512", SK).update(b2).digest("hex"), "content-type": "application/json" }, body: b2 });
  const claim = await player.c.rpc("claim_topups");
  ok(claim.data?.[0]?.amount === 30000, "webhook grants game money, claimed once", JSON.stringify(claim.data));
  const claim2 = await player.c.rpc("claim_topups");
  ok((claim2.data ?? []).length === 0, "second claim gets nothing");

  // 3b. Supporter pass: mixed grant kinds (badge + outfit)
  const p5 = await paidOrder(player, `zz_pay_${stamp}@example.com`, "s_supporter_30", 100000);
  r = await api("/api/pay/verify", player.token, { reference: p5.reference });
  const { data: sup } = await player.c.from("entitlements").select("kind, item, expires_at").in("kind", ["supporter", "cosmetic"]);
  ok(r.json.status === "paid" && sup.some((e) => e.kind === "supporter" && e.expires_at) && sup.some((e) => e.item === "outfit_supporter"), "supporter pass grants badge + outfit", JSON.stringify(r.json));

  // 4. Tampered amount is rejected
  r = await api("/api/pay/init", player.token, { productId: "c_shades", ageConfirmed: true });
  const ref3 = r.json.reference;
  const fake = JSON.stringify({ event: "charge.success", data: { id: 1, status: "success", reference: ref3, amount: 100, currency: "NGN" } });
  await fetch(APP + "/api/pay/webhook", { method: "POST", headers: { "x-paystack-signature": createHmac("sha512", SK).update(fake).digest("hex"), "content-type": "application/json" }, body: fake });
  const { data: o3 } = await admin.from("orders").select("status").eq("reference", ref3).single();
  const { data: shades } = await player.c.from("entitlements").select("item").eq("item", "acc_shades").eq("kind", "cosmetic");
  ok(o3.status !== "paid", "underpaid order not fulfilled", o3.status);
  ok(shades.length === 1, "shades only from the bundle, not the underpaid order");

  // 5. Spending cap (₦20,000 / 30 days): fake earlier paid orders near the cap
  await admin.from("orders").insert({ user_id: player.id, product_id: "c_crown", amount_kobo: 1900000, reference: `zz_cap_${stamp}`, status: "paid" });
  r = await api("/api/pay/init", player.token, { productId: "t_large", ageConfirmed: true });
  ok(r.status === 400 && /limit/i.test(r.json.error), "monthly spending cap enforced", r.json.error);

  // 6. Teacher plan upgrade lifts class limit
  const c1 = await teacher.c.from("classes").insert({ teacher_id: teacher.id, name: "zz class 1" });
  const c2 = await teacher.c.from("classes").insert({ teacher_id: teacher.id, name: "zz class 2" });
  ok(!c1.error && !!c2.error, "free plan: one class only", c2.error?.message);
  r = await api("/api/pay/init", teacher.token, { productId: "p_classroom_term", ageConfirmed: true });
  ok(r.status === 200, "teacher can start a plan checkout");
  const p4 = await paidOrder(teacher, `zz_payt_${stamp}@example.com`, "p_classroom_term", 750000);
  const ref4 = p4.reference;
  ok(p4.charge.data?.status === "success", "teacher plan charged (₦7,500)", p4.charge.data?.status ?? p4.charge.message);
  r = await api("/api/pay/verify", teacher.token, { reference: ref4 });
  const { data: plan } = await teacher.c.rpc("my_plan").single();
  ok(plan?.plan === "classroom" && plan.max_classes === 5, "classroom plan active", JSON.stringify(plan));
  const c3 = await teacher.c.from("classes").insert({ teacher_id: teacher.id, name: "zz class 2" });
  ok(!c3.error, "upgraded teacher creates a second class", c3.error?.message);

  // 7. Students can't buy; others can't see your orders
  const { data: cls } = await teacher.c.from("classes").select("id").limit(1).single();
  const st = await api("/api/teacher/students", teacher.token, { classId: cls.id, names: ["Kid Test"] });
  const kid = st.json.created?.[0];
  if (kid) {
    created.push(kid.studentId);
    const { data: c } = await admin.from("classes").select("code").eq("id", cls.id).single();
    const kc = anon();
    await kc.auth.signInWithPassword({ email: `${kid.username}-${c.code.toLowerCase()}@students.modequest.com.ng`, password: kid.pin });
    const { data: ks } = await kc.auth.getSession();
    r = await api("/api/pay/init", ks.session.access_token, { productId: "c_crown", ageConfirmed: true });
    ok(r.status === 403, "students cannot buy", r.json.error);
    const { data: kidOrders } = await kc.from("orders").select("id");
    ok(kidOrders.length === 0, "students can't see other people's orders");
  }
  const forbid = await player.c.from("entitlements").insert({ user_id: player.id, kind: "naira", item: "x", quantity: 999999 });
  ok(!!forbid.error, "players cannot grant themselves items");
} catch (e) {
  fail++;
  console.log("ERROR:", e.stack);
} finally {
  for (const id of created) await admin.auth.admin.deleteUser(id).catch(() => {});
  console.log(`\n${pass} passed, ${fail} failed. Cleaned up ${created.length} test users.`);
}
