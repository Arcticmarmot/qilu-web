"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { seckillVoucher } from "@/lib/api";
import { cx } from "@/lib/cx";
import { getErrorMessage, isAuthError } from "@/lib/error";

type Notice = { type: "success" | "error"; text: string };

function toPositiveInteger(value: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error("秒杀活动 ID 必须为正数");
  }

  return parsed;
}

export function CouponCenterCard() {
  const notify = useToast();
  const [seckillId, setSeckillId] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);

  const handleSeckill = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let parsedSeckillId: number;

    try {
      parsedSeckillId = toPositiveInteger(seckillId);
    } catch (error) {
      setNotice({ type: "error", text: getErrorMessage(error, "秒杀活动 ID 无效") });
      return;
    }

    setIsSubmitting(true);
    setNotice(null);

    try {
      await seckillVoucher(parsedSeckillId);
      const message = "抢券请求已提交，请到数据库查看订单生成结果";
      setNotice({ type: "success", text: message });
      notify(message, "success");
    } catch (error) {
      if (!isAuthError(error)) {
        setNotice({ type: "error", text: getErrorMessage(error, "抢券失败") });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-md border border-line bg-panel shadow-subtle">
      <div className="p-5">
        <div className="border-b border-line pb-4">
          <p className="text-xs tracking-[0.24em] text-muted">优惠券中心</p>
          <h2 className="mt-1 text-lg font-semibold text-foreground">
            线下兑换资格
          </h2>
        </div>

        <section className="mt-4 rounded-md border border-line bg-soft p-4">
          <p className="text-sm font-semibold text-foreground">限时兑换券</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            抢大龙山登山杖、遮阳帽等线下兑换资格
          </p>
          <form className="mt-4 grid gap-3" onSubmit={handleSeckill}>
            <Input
              label="秒杀活动 ID"
              type="number"
              min="1"
              step="1"
              inputMode="numeric"
              value={seckillId}
              onChange={(event) => setSeckillId(event.target.value)}
              disabled={isSubmitting}
              className="bg-panel"
            />

            {notice ? (
              <div
                className={cx(
                  "rounded-md border px-3 py-2 text-sm leading-6",
                  notice.type === "error"
                    ? "border-danger/60 bg-danger/10 text-danger"
                    : "border-accent/60 bg-accent/10 text-accent",
                )}
                role={notice.type === "error" ? "alert" : "status"}
              >
                {notice.text}
              </div>
            ) : null}

            <Button className="h-10 w-full" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "提交中" : "抢优惠券"}
            </Button>
          </form>
        </section>

        <section className="mt-4 rounded-md border border-line p-4">
          <p className="text-sm font-semibold text-foreground">优惠券管理</p>
          <p className="mt-2 text-sm leading-6 text-muted">
            管理兑换券、秒杀活动和线下核销
          </p>
          <Link
            href="/admin/vouchers"
            className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-md border border-line px-3 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
          >
            进入管理
          </Link>
        </section>
      </div>
    </div>
  );
}
