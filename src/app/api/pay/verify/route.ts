import { errorResponse, HttpError } from "@/online/server";
import { fulfil, paystackVerify, requireUser } from "@/shop/server";

/** After Paystack redirects back: confirm the payment and grant items. */
export async function POST(req: Request) {
  try {
    const { db, user } = await requireUser(req);
    const { reference } = (await req.json()) as { reference?: string };
    if (!reference) throw new HttpError(400, "reference is required.");
    const { data: order } = await db.from("orders").select("user_id, status, product_id").eq("reference", reference).maybeSingle();
    if (!order || order.user_id !== user.id) throw new HttpError(404, "Order not found.");
    if (order.status === "paid") return Response.json({ status: "paid", productId: order.product_id });
    const tx = await paystackVerify(reference);
    if (!tx) return Response.json({ status: "pending", productId: order.product_id });
    const r = await fulfil(db, reference, tx);
    return Response.json({ status: r.ok ? "paid" : tx.status === "success" ? "error" : tx.status, reason: r.reason, productId: order.product_id });
  } catch (e) {
    return errorResponse(e);
  }
}
