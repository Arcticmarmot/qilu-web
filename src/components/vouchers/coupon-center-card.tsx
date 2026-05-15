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
  {
    href: "/admin/vouchers",
    label: "秒杀管理",
  },
];

export function CouponCenterCard() {
  return (
    <div className="overflow-hidden rounded-md border border-line bg-panel shadow-subtle">
      <div className="p-5">
        <div className="border-b border-line pb-4">
          <p className="text-xs tracking-[0.24em] text-muted">ACTIVITY</p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">活动中心</h2>
        </div>

        <nav className="mt-4 grid gap-3" aria-label="活动中心">
          {activityLinks.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="inline-flex h-11 w-full items-center justify-center rounded-md border border-line bg-soft px-4 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
