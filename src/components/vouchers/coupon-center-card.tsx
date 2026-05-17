"use client";

import Link from "next/link";

const activityLinks = [
  {
    href: "/voucher-seckills",
    label: "秒杀活动",
  },
  {
    href: "/voucher-orders/me",
    label: "我的优惠券",
  },
];

export function CouponCenterCard() {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-panel shadow-subtle">
      <div className="p-4">
        <div className="border-b border-line pb-3">
          <h2 className="text-lg font-semibold text-foreground">活动中心</h2>
        </div>

        <nav className="mt-3 grid gap-2.5" aria-label="活动中心">
          {activityLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex h-10 w-full items-center justify-center rounded-md border border-line bg-soft px-4 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
