"use client";

import { Suspense } from "react";
import { PageLoading } from "@/components/product-shell";
import { MyVoucherOrdersPageContent } from "@/components/vouchers/activity-center-pages";

export default function MyVoucherOrdersPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <MyVoucherOrdersPageContent />
    </Suspense>
  );
}
