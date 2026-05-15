"use client";

import Link from "next/link";
import { type ReactNode, useCallback, useEffect, useState } from "react";
import { AppHeader, PageLoading } from "@/components/product-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast, useToastMessage } from "@/components/ui/toast";
import {
  getMyVoucherOrders,
  getSeckillOrderResult,
  getVoucherOrderDetail,
  getVoucherSeckillDetail,
  getVoucherSeckills,
  seckillVoucher,
  type VoucherOrder,
  type VoucherSeckill,
  type VoucherSeckillOrderResult,
} from "@/lib/api";
import { cx } from "@/lib/cx";
import { getErrorMessage, isAuthError } from "@/lib/error";
import { useCurrentUser } from "@/lib/use-current-user";

type Notice = { type: "success" | "error" | "info"; text: string };

const orderStatusLabels: Record<number, string> = {
  1: "待使用",
  2: "已使用",
  3: "已过期",
  4: "已取消",
};

function formatDate(value?: string) {
  if (!value) {
    return "暂无";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const pad = (number: number) => String(number).padStart(2, "0");

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join(" ");
}

function getActivityState(activity: VoucherSeckill, now: number) {
  const startAt = activity.startTime ? new Date(activity.startTime).getTime() : null;
  const endAt = activity.endTime ? new Date(activity.endTime).getTime() : null;

  if (startAt != null && Number.isFinite(startAt) && now < startAt) {
    return "未开始";
  }

  if (endAt != null && Number.isFinite(endAt) && now > endAt) {
    return "已结束";
  }

  return "抢购中";
}

function getActivityStateClass(state: string) {
  if (state === "抢购中") {
    return "border-accent/50 bg-accent/10 text-accent";
  }

  if (state === "未开始") {
    return "border-accent-strong/50 bg-accent-strong/10 text-accent-strong";
  }

  return "border-line bg-soft text-muted";
}

function getOrderStatusLabel(status?: number) {
  if (status == null) {
    return "未知";
  }

  return orderStatusLabels[status] ?? `状态 ${status}`;
}

function getOrderStatusClass(status?: number) {
  if (status === 1) {
    return "border-accent/50 bg-accent/10 text-accent";
  }

  if (status === 2) {
    return "border-accent-strong/50 bg-accent-strong/10 text-accent-strong";
  }

  return "border-line bg-soft text-muted";
}

function getResultNotice(
  result: VoucherSeckillOrderResult,
  afterSubmit: boolean,
): Notice {
  const status = result.status?.toLowerCase();

  if (status === "success") {
    return {
      type: "success",
      text: result.orderNo ? `抢券成功，订单号 ${result.orderNo}` : "抢券成功",
    };
  }

  if (status === "processing") {
    return {
      type: "info",
      text: afterSubmit ? "抢券请求已提交，订单生成中" : "订单生成中",
    };
  }

  return {
    type: "info",
    text: `抢券结果：${result.status || "未知"}`,
  };
}

function NoticeBox({
  notice,
  className,
}: {
  notice: Notice;
  className?: string;
}) {
  return (
    <div
      className={cx(
        "rounded-md border px-3 py-2 text-sm leading-6",
        notice.type === "error"
          ? "border-danger/60 bg-danger/10 text-danger"
          : notice.type === "success"
            ? "border-accent/60 bg-accent/10 text-accent"
            : "border-line bg-soft text-muted",
        className,
      )}
      role={notice.type === "error" ? "alert" : "status"}
    >
      {notice.text}
    </div>
  );
}

function DetailRow({
  label,
  value,
}: {
  label: string;
  value?: string | number | null;
}) {
  return (
    <div className="flex items-start justify-between gap-4 text-sm leading-6">
      <span className="shrink-0 text-muted">{label}</span>
      <span className="min-w-0 break-words text-right text-foreground">
        {value == null || value === "" ? "暂无" : value}
      </span>
    </div>
  );
}

function ActivityPageShell({
  title,
  description,
  userName,
  children,
}: {
  title: string;
  description: string;
  userName?: string;
  children: ReactNode;
}) {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <AppHeader />

      <div className="mx-auto max-w-7xl px-5 pb-6 pt-6 sm:px-8">
        <div className="mb-6 rounded-md border border-line bg-panel p-5 shadow-subtle">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm tracking-[0.24em] text-muted">活动中心</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                {title}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
                {description}
              </p>
            </div>
            <Link
              href="/"
              className="inline-flex h-10 shrink-0 items-center justify-center rounded-md border border-line px-4 text-sm text-foreground transition hover:border-accent hover:text-accent"
            >
              返回首页
            </Link>
          </div>
        </div>

        <section className="min-w-0">
          <div className="rounded-md border border-line bg-panel p-4 shadow-subtle sm:p-5">
            <div className="mb-5 flex flex-col gap-2 border-b border-line pb-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-xs tracking-[0.24em] text-muted">活动中心</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">
                  {title}
                </h2>
              </div>
              <div className="rounded-md border border-line bg-soft px-3 py-2 text-sm text-muted">
                {userName || "当前账号"}
              </div>
            </div>
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}

export function VoucherSeckillPageContent() {
  const { user, error: userError, isLoading: isUserLoading } = useCurrentUser();
  const notify = useToast();
  const [activities, setActivities] = useState<VoucherSeckill[]>([]);
  const [isLoadingActivities, setIsLoadingActivities] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [selectedActivity, setSelectedActivity] =
    useState<VoucherSeckill | null>(null);
  const [detailLoadingId, setDetailLoadingId] = useState<number | null>(null);
  const [orderingId, setOrderingId] = useState<number | null>(null);
  const [resultLoadingId, setResultLoadingId] = useState<number | null>(null);
  const [orderResults, setOrderResults] = useState<
    Record<number, VoucherSeckillOrderResult>
  >({});

  useToastMessage(error || userError, "error");

  const loadActivities = useCallback(async () => {
    setIsLoadingActivities(true);
    setError("");

    try {
      const result = await getVoucherSeckills();
      setActivities(Array.isArray(result) ? result : []);
    } catch (err) {
      if (!isAuthError(err)) {
        setError(getErrorMessage(err, "优惠券活动加载失败"));
      }
    } finally {
      setIsLoadingActivities(false);
    }
  }, []);

  useEffect(() => {
    if (!isUserLoading) {
      void loadActivities();
    }
  }, [isUserLoading, loadActivities]);

  const handleViewActivityDetail = async (activity: VoucherSeckill) => {
    setNotice(null);
    setDetailLoadingId(activity.seckillId);

    try {
      const detail = await getVoucherSeckillDetail(activity.seckillId);
      setSelectedActivity(detail);
    } catch (err) {
      if (!isAuthError(err)) {
        setNotice({
          type: "error",
          text: getErrorMessage(err, "活动详情加载失败"),
        });
      }
    } finally {
      setDetailLoadingId(null);
    }
  };

  const handleCheckResult = useCallback(
    async (seckillId: number, afterSubmit = false) => {
      setResultLoadingId(seckillId);
      if (!afterSubmit) {
        setNotice(null);
      }

      try {
        const result = await getSeckillOrderResult(seckillId);
        setOrderResults((current) => ({ ...current, [seckillId]: result }));

        const nextNotice = getResultNotice(result, afterSubmit);
        setNotice(nextNotice);

        if (result.status?.toLowerCase() === "success") {
          notify(nextNotice.text, "success");
        }
      } catch (err) {
        if (!isAuthError(err)) {
          setNotice({
            type: "error",
            text: getErrorMessage(err, "抢券结果查询失败"),
          });
        }
      } finally {
        setResultLoadingId(null);
      }
    },
    [notify],
  );

  const handleSeckill = async (activity: VoucherSeckill) => {
    if (orderingId != null) {
      return;
    }

    setOrderingId(activity.seckillId);
    setNotice(null);

    try {
      const submitResult = await seckillVoucher(activity.seckillId);
      if (submitResult?.status) {
        setOrderResults((current) => ({
          ...current,
          [activity.seckillId]: submitResult,
        }));
      }

      const message = "抢券请求已提交";
      setNotice({ type: "success", text: message });
      notify(message, "success");
      await handleCheckResult(activity.seckillId, true);
      void loadActivities();
    } catch (err) {
      if (!isAuthError(err)) {
        setNotice({
          type: "error",
          text: getErrorMessage(err, "抢券失败"),
        });
      }
    } finally {
      setOrderingId(null);
    }
  };

  if (isUserLoading) {
    return <PageLoading />;
  }

  const now = Date.now();

  return (
    <ActivityPageShell
      title="秒杀活动"
      description="查看当前可抢的优惠券活动，进入活动详情后可以提交抢券并查询订单生成结果。"
      userName={user?.nickname}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-muted">
          页面加载时会读取可用活动列表，抢券后会自动查询一次生成结果。
        </p>
        <Button
          variant="secondary"
          className="h-10 shrink-0 px-4"
          onClick={() => void loadActivities()}
          disabled={isLoadingActivities}
        >
          {isLoadingActivities ? "刷新中" : "刷新活动"}
        </Button>
      </div>

      {notice ? <NoticeBox notice={notice} className="mb-4" /> : null}

      {selectedActivity ? (
        <div className="mb-4 rounded-md border border-line bg-soft p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="break-words text-lg font-semibold text-foreground">
                {selectedActivity.title || "未命名活动"}
              </p>
              <p className="mt-2 break-words text-sm leading-6 text-muted">
                {selectedActivity.description || "暂无描述"}
              </p>
            </div>
            <button
              type="button"
              className="self-start text-sm text-muted transition hover:text-accent"
              onClick={() => setSelectedActivity(null)}
            >
              收起详情
            </button>
          </div>
          <div className="mt-4 grid gap-3 border-t border-line pt-4 md:grid-cols-2">
            <DetailRow label="活动 ID" value={selectedActivity.seckillId} />
            <DetailRow
              label="库存"
              value={`${selectedActivity.remainingStock ?? 0} / ${
                selectedActivity.totalStock ?? 0
              }`}
            />
            <DetailRow label="开始时间" value={formatDate(selectedActivity.startTime)} />
            <DetailRow label="结束时间" value={formatDate(selectedActivity.endTime)} />
            <DetailRow label="状态" value={getActivityState(selectedActivity, now)} />
          </div>
        </div>
      ) : null}

      {error ? (
        <NoticeBox notice={{ type: "error", text: error }} className="mb-4" />
      ) : null}

      {isLoadingActivities ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-56 animate-pulse rounded-md border border-line bg-soft"
            />
          ))}
        </div>
      ) : activities.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {activities.map((activity) => {
            const state = getActivityState(activity, now);
            const result = orderResults[activity.seckillId];
            const isOrdering = orderingId === activity.seckillId;
            const isChecking = resultLoadingId === activity.seckillId;
            const isDetailLoading = detailLoadingId === activity.seckillId;

            return (
              <article
                key={activity.seckillId}
                className="rounded-md border border-line bg-soft p-4"
              >
                <div className="flex items-start justify-between gap-3">
                  <h3 className="min-w-0 break-words text-lg font-semibold leading-7 text-foreground">
                    {activity.title || "未命名活动"}
                  </h3>
                  <span
                    className={cx(
                      "shrink-0 rounded-md border px-2.5 py-1 text-xs",
                      getActivityStateClass(state),
                    )}
                  >
                    {state}
                  </span>
                </div>
                <p className="mt-2 line-clamp-2 break-words text-sm leading-6 text-muted">
                  {activity.description || "暂无描述"}
                </p>
                <div className="mt-4 grid gap-3 rounded-md border border-line bg-panel/50 p-3">
                  <DetailRow
                    label="库存"
                    value={`${activity.remainingStock ?? 0} / ${
                      activity.totalStock ?? 0
                    }`}
                  />
                  <DetailRow label="开始时间" value={formatDate(activity.startTime)} />
                  <DetailRow label="结束时间" value={formatDate(activity.endTime)} />
                </div>

                {result ? (
                  <NoticeBox
                    className="mt-4"
                    notice={getResultNotice(result, false)}
                  />
                ) : null}

                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    className="h-10 px-4"
                    onClick={() => void handleViewActivityDetail(activity)}
                    disabled={isDetailLoading || isOrdering || isChecking}
                  >
                    {isDetailLoading ? "加载中" : "查看详情"}
                  </Button>
                  <Button
                    variant="secondary"
                    className="h-10 px-4"
                    onClick={() => void handleCheckResult(activity.seckillId)}
                    disabled={isChecking || isOrdering}
                  >
                    {isChecking ? "查询中" : "查看结果"}
                  </Button>
                  <Button
                    className="h-10 px-4"
                    onClick={() => void handleSeckill(activity)}
                    disabled={isOrdering || isChecking}
                  >
                    {isOrdering ? "提交中" : "抢优惠券"}
                  </Button>
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="暂无可抢活动"
          description="当前没有可展示的秒杀活动，可以稍后刷新页面查看。"
        />
      )}
    </ActivityPageShell>
  );
}

export function MyVoucherOrdersPageContent() {
  const { user, error: userError, isLoading: isUserLoading } = useCurrentUser();
  const [orders, setOrders] = useState<VoucherOrder[]>([]);
  const [isLoadingOrders, setIsLoadingOrders] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState<Notice | null>(null);
  const [selectedOrder, setSelectedOrder] = useState<VoucherOrder | null>(null);
  const [orderDetailLoadingNo, setOrderDetailLoadingNo] = useState<string | null>(
    null,
  );

  useToastMessage(error || userError, "error");

  const loadOrders = useCallback(async () => {
    setIsLoadingOrders(true);
    setError("");

    try {
      const result = await getMyVoucherOrders();
      setOrders(Array.isArray(result) ? result : []);
    } catch (err) {
      if (!isAuthError(err)) {
        setError(getErrorMessage(err, "我的优惠券加载失败"));
      }
    } finally {
      setIsLoadingOrders(false);
    }
  }, []);

  useEffect(() => {
    if (!isUserLoading) {
      void loadOrders();
    }
  }, [isUserLoading, loadOrders]);

  const handleViewOrder = async (order: VoucherOrder) => {
    setNotice(null);
    setOrderDetailLoadingNo(order.orderNo);

    try {
      const detail = await getVoucherOrderDetail(order.orderNo);
      setSelectedOrder(detail);
    } catch (err) {
      if (!isAuthError(err)) {
        setNotice({
          type: "error",
          text: getErrorMessage(err, "订单详情加载失败"),
        });
      }
    } finally {
      setOrderDetailLoadingNo(null);
    }
  };

  if (isUserLoading) {
    return <PageLoading />;
  }

  return (
    <ActivityPageShell
      title="我的优惠券"
      description="查看当前账号抢到的优惠券订单，点击订单可以查询兑换码、状态、过期时间和核销时间。"
      userName={user?.nickname}
    >
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm leading-6 text-muted">
          优惠券核销仍由管理端处理，这里只展示当前账号的订单信息。
        </p>
        <Button
          variant="secondary"
          className="h-10 shrink-0 px-4"
          onClick={() => void loadOrders()}
          disabled={isLoadingOrders}
        >
          {isLoadingOrders ? "刷新中" : "刷新优惠券"}
        </Button>
      </div>

      {notice ? <NoticeBox notice={notice} className="mb-4" /> : null}

      {selectedOrder ? (
        <div className="mb-4 rounded-md border border-line bg-soft p-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div className="min-w-0">
              <p className="break-words text-lg font-semibold text-foreground">
                {selectedOrder.title || "优惠券订单"}
              </p>
              <p className="mt-2 break-all font-mono text-sm leading-6 text-accent-strong">
                {selectedOrder.redeemCode || "暂无兑换码"}
              </p>
              <p className="mt-2 break-words text-sm leading-6 text-muted">
                {selectedOrder.description || "暂无描述"}
              </p>
            </div>
            <button
              type="button"
              className="self-start text-sm text-muted transition hover:text-accent"
              onClick={() => setSelectedOrder(null)}
            >
              收起详情
            </button>
          </div>
          <div className="mt-4 grid gap-3 border-t border-line pt-4 md:grid-cols-2">
            <DetailRow label="订单号" value={selectedOrder.orderNo} />
            <DetailRow
              label="状态"
              value={getOrderStatusLabel(selectedOrder.status)}
            />
            <DetailRow label="过期时间" value={formatDate(selectedOrder.expireAt)} />
            <DetailRow label="创建时间" value={formatDate(selectedOrder.createdAt)} />
            <DetailRow label="核销时间" value={formatDate(selectedOrder.usedAt)} />
            <DetailRow label="活动 ID" value={selectedOrder.seckillId} />
          </div>
        </div>
      ) : null}

      {error ? (
        <NoticeBox notice={{ type: "error", text: error }} className="mb-4" />
      ) : null}

      {isLoadingOrders ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-44 animate-pulse rounded-md border border-line bg-soft"
            />
          ))}
        </div>
      ) : orders.length ? (
        <div className="grid gap-4 lg:grid-cols-2">
          {orders.map((order) => {
            const isLoadingDetail = orderDetailLoadingNo === order.orderNo;

            return (
              <button
                key={order.orderNo}
                type="button"
                className="rounded-md border border-line bg-soft p-4 text-left transition hover:border-accent"
                onClick={() => void handleViewOrder(order)}
                disabled={isLoadingDetail}
              >
                <div className="flex items-start justify-between gap-3">
                  <span className="min-w-0 break-words text-lg font-semibold leading-7 text-foreground">
                    {order.title || "优惠券订单"}
                  </span>
                  <span
                    className={cx(
                      "shrink-0 rounded-md border px-2.5 py-1 text-xs",
                      getOrderStatusClass(order.status),
                    )}
                  >
                    {getOrderStatusLabel(order.status)}
                  </span>
                </div>
                <div className="mt-4 grid gap-3 rounded-md border border-line bg-panel/50 p-3">
                  <DetailRow label="兑换码" value={order.redeemCode} />
                  <DetailRow label="过期时间" value={formatDate(order.expireAt)} />
                  <DetailRow label="创建时间" value={formatDate(order.createdAt)} />
                </div>
                {isLoadingDetail ? (
                  <p className="mt-3 text-sm text-muted">详情加载中</p>
                ) : null}
              </button>
            );
          })}
        </div>
      ) : (
        <EmptyState
          title="暂无优惠券"
          description="抢券成功后，优惠券订单会展示在这里。"
        />
      )}
    </ActivityPageShell>
  );
}
