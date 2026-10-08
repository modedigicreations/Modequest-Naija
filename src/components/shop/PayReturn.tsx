"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { getProduct } from "@/shop/catalog";
import { verifyPayment } from "@/shop/client";
import { useSession } from "@/online/session";

type State = { kind: "checking" } | { kind: "paid"; productId?: string } | { kind: "pending" } | { kind: "failed"; reason: string };

export default function PayReturn() {
  const params = useSearchParams();
  const reference = params.get("reference") ?? params.get("trxref");
  const init = useSession((s) => s.init);
  const ready = useSession((s) => s.ready);
  const user = useSession((s) => s.user);
  const [state, setState] = useState<State>({ kind: "checking" });

  useEffect(() => {
    void init();
  }, [init]);

  useEffect(() => {
    if (!ready || !reference) return;
    if (!user) {
      Promise.resolve().then(() => setState({ kind: "failed", reason: "Sign in again to finish your purchase." }));
      return;
    }
    let live = true;
    let tries = 0;
    const check = async () => {
      try {
        const r = await verifyPayment(reference);
        if (!live) return;
        if (r.status === "paid") setState({ kind: "paid", productId: r.productId });
        else if (r.status === "pending" || r.status === "ongoing") {
          if (++tries < 6) setTimeout(check, 2500);
          else setState({ kind: "pending" });
        } else setState({ kind: "failed", reason: r.reason ?? `Payment ${r.status}.` });
      } catch (e) {
        if (live) setState({ kind: "failed", reason: (e as Error).message });
      }
    };
    void check();
    return () => {
      live = false;
    };
  }, [ready, user, reference]);

  const product = state.kind === "paid" && state.productId ? getProduct(state.productId) : null;

  return (
    <main className="min-h-dvh grid place-items-center p-4">
      <div className="card p-8 max-w-md w-full text-center anim-pop">
        {!reference ? (
          <p>No payment reference found.</p>
        ) : state.kind === "checking" ? (
          <>
            <div className="text-5xl anim-bob">⏳</div>
            <h1 className="font-display text-2xl font-extrabold mt-3">Confirming your payment…</h1>
          </>
        ) : state.kind === "paid" ? (
          <>
            <div className="text-5xl">🎉</div>
            <h1 className="font-display text-2xl font-extrabold mt-3">Thank you!</h1>
            <p className="text-[var(--ink-2)] mt-2">
              {product ? `${product.emoji} ${product.name} is now on your account.` : "Your purchase is on your account."}
              {product?.kind === "topup" && " The game money lands in your bank when you open the game."}
            </p>
          </>
        ) : state.kind === "pending" ? (
          <>
            <div className="text-5xl">🕐</div>
            <h1 className="font-display text-2xl font-extrabold mt-3">Payment still processing</h1>
            <p className="text-[var(--ink-2)] mt-2">Bank transfers and USSD can take a few minutes. Your items will appear automatically once Paystack confirms.</p>
          </>
        ) : (
          <>
            <div className="text-5xl">⚠️</div>
            <h1 className="font-display text-2xl font-extrabold mt-3">Payment not completed</h1>
            <p className="text-[var(--ink-2)] mt-2">{state.reason}</p>
          </>
        )}
        <p className="text-[11px] text-[var(--muted)] mt-4">Reference: {reference}</p>
        <Link href="/" className="btn btn-primary w-full mt-5">
          Back to the game
        </Link>
      </div>
    </main>
  );
}
