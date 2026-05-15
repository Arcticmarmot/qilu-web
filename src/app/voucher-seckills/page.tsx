"use client";

import { Suspense } from "react";
import { PageLoading } from "@/components/product-shell";
import { VoucherSeckillPageContent } from "@/components/vouchers/activity-center-pages";

export default function VoucherSeckillPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <VoucherSeckillPageContent />
    </Suspense>
  );
}
