import { errorResponse, HttpError } from "@/online/server";
import { startCheckout } from "@/shop/server";

/** Start a Paystack checkout: { productId, ageConfirmed } → { authorizationUrl }. */
export async function POST(req: Request) {
  try {
    const body = (await req.json()) as { productId?: string; ageConfirmed?: boolean };
    if (!body.productId) throw new HttpError(400, "productId is required.");
    return Response.json(await startCheckout(req, body.productId, !!body.ageConfirmed));
  } catch (e) {
    return errorResponse(e);
  }
}
