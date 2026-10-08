import { errorResponse } from "@/online/server";
import { reconcile, requireUser } from "@/shop/server";

/** Signed-in player: settle any of their recent orders Paystack says are paid. */
export async function POST(req: Request) {
  try {
    const { db, user } = await requireUser(req);
    return Response.json(await reconcile(db, { userId: user.id }));
  } catch (e) {
    return errorResponse(e);
  }
}
