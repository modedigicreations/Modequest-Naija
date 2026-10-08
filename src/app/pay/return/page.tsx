import type { Metadata } from "next";
import { Suspense } from "react";
import PayReturn from "@/components/shop/PayReturn";

export const metadata: Metadata = { title: "Payment · ModeQuest" };

export default function PayReturnPage() {
  return (
    <Suspense fallback={null}>
      <PayReturn />
    </Suspense>
  );
}
