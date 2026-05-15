"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { AppHeader, PageLoading } from "@/components/product-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast, useToastMessage } from "@/components/ui/toast";
import {
  createVoucher,
  createVoucherSeckill,
  preheatVoucherSeckill,
  redeemVoucherOrder,
} from "@/lib/api";
import { cx } from "@/lib/cx";
import { getErrorMessage, isAuthError } from "@/lib/error";
import { useCurrentUser } from "@/lib/use-current-user";

type AdminAction = "voucher" | "seckill" | "preheat" | "redeem";
type Notice = { type: "success" | "error"; text: string };

const VOUCHER_TITLE_MAX_LENGTH = 128;
const VOUCHER_DESCRIPTION_MAX_LENGTH = 512;
const REDEEM_CODE_MAX_LENGTH = 64;

const actionItems: Array<{ key: AdminAction; label: string; summary: string }> = [
  { key: "voucher", label: "创建优惠券", summary: "POST /admin/vouchers" },
  { key: "seckill", label: "创建秒杀活动", summary: "POST /admin/voucher-seckills" },
  {
    key: "preheat",
    label: "预热秒杀活动",
    summary: "POST /admin/voucher-seckills/{seckillId}/preheat",
  },
  { key: "redeem", label: "核销兑换码", summary: "PATCH /admin/voucher-orders/redeem" },
];

function toPositiveInteger(value: string, label: string) {
  const parsed = Number(value);

  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${label}必须为正数`);
  }

  return parsed;
}

function toLocalDateTime(value: string) {
  return value.length === 16 ? `${value}:00` : value;
}

function validateSeckillTime(
  startTime: string,
  endTime: string,
  redeemDeadline: string,
) {
  if (!startTime || !endTime || !redeemDeadline) {
    throw new Error("开始时间、结束时间、兑换截止时间不能为空");
  }

  const startAt = new Date(startTime).getTime();
  const endAt = new Date(endTime).getTime();
  const deadlineAt = new Date(redeemDeadline).getTime();

  if (![startAt, endAt, deadlineAt].every(Number.isFinite)) {
    throw new Error("时间格式无效");
  }

  if (!(startAt < endAt && endAt < deadlineAt)) {
    throw new Error("时间必须满足：开始时间 < 结束时间 < 兑换截止时间");
  }
}

function FieldArea({
  id,
  label,
  value,
  onChange,
  placeholder,
  disabled,
  maxLength,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
}) {
  return (
    <label className="block" htmlFor={id}>
      <span className="mb-2 block text-sm font-medium text-foreground">{label}</span>
      <textarea
        id={id}
        className="min-h-32 w-full resize-y rounded-md border border-line bg-soft px-3 py-3 text-sm leading-7 text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:bg-panel disabled:cursor-not-allowed disabled:opacity-60"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        maxLength={maxLength}
      />
    </label>
  );
}

function VoucherAdminPageContent() {
  const { user, error: userError, isLoading } = useCurrentUser();
  const notify = useToast();
  const [activeAction, setActiveAction] = useState<AdminAction>("voucher");
  const [pendingAction, setPendingAction] = useState<AdminAction | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [voucherForm, setVoucherForm] = useState({
    title: "",
    description: "",
  });
  const [seckillForm, setSeckillForm] = useState({
    voucherId: "",
    totalStock: "",
    startTime: "",
    endTime: "",
    redeemDeadline: "",
  });
  const [preheatForm, setPreheatForm] = useState({ seckillId: "" });
  const [redeemForm, setRedeemForm] = useState({ redeemCode: "" });

  useToastMessage(userError, "error");

  const isSubmitting = pendingAction != null;
  const currentAction = actionItems.find((item) => item.key === activeAction);

  const setValidationError = (message: string) => {
    setNotice({ type: "error", text: message });
  };

  const runAction = async (
    action: AdminAction,
    submit: () => Promise<void>,
    successMessage: string,
    fallbackMessage: string,
  ) => {
    if (pendingAction) {
      return;
    }

    setPendingAction(action);
    setNotice(null);

    try {
      await submit();
      setNotice({ type: "success", text: successMessage });
      notify(successMessage, "success");
    } catch (error) {
      if (!isAuthError(error)) {
        setNotice({
          type: "error",
          text: getErrorMessage(error, fallbackMessage),
        });
      }
    } finally {
      setPendingAction(null);
    }
  };

  const handleCreateVoucher = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const title = voucherForm.title.trim();
    const description = voucherForm.description.trim();

    if (!title || !description) {
      setValidationError("标题、描述不能为空");
      return;
    }

    if (title.length > VOUCHER_TITLE_MAX_LENGTH) {
      setValidationError(`标题不能超过 ${VOUCHER_TITLE_MAX_LENGTH} 个字符`);
      return;
    }

    if (description.length > VOUCHER_DESCRIPTION_MAX_LENGTH) {
      setValidationError(
        `描述不能超过 ${VOUCHER_DESCRIPTION_MAX_LENGTH} 个字符`,
      );
      return;
    }

    await runAction(
      "voucher",
      async () => {
        await createVoucher({ title, description });
        setVoucherForm({ title: "", description: "" });
      },
      "优惠券创建成功",
      "优惠券创建失败",
    );
  };

  const handleCreateSeckill = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let voucherId: number;
    let totalStock: number;

    try {
      voucherId = toPositiveInteger(seckillForm.voucherId, "优惠券 ID");
      totalStock = toPositiveInteger(seckillForm.totalStock, "活动库存");
      validateSeckillTime(
        seckillForm.startTime,
        seckillForm.endTime,
        seckillForm.redeemDeadline,
      );
    } catch (error) {
      setValidationError(getErrorMessage(error, "秒杀活动参数无效"));
      return;
    }

    await runAction(
      "seckill",
      async () => {
        await createVoucherSeckill({
          voucherId,
          totalStock,
          startTime: toLocalDateTime(seckillForm.startTime),
          endTime: toLocalDateTime(seckillForm.endTime),
          redeemDeadline: toLocalDateTime(seckillForm.redeemDeadline),
        });
        setSeckillForm((current) => ({
          ...current,
          totalStock: "",
          startTime: "",
          endTime: "",
          redeemDeadline: "",
        }));
      },
      "秒杀活动创建成功",
      "秒杀活动创建失败",
    );
  };

  const handlePreheat = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    let seckillId: number;

    try {
      seckillId = toPositiveInteger(preheatForm.seckillId, "秒杀活动 ID");
    } catch (error) {
      setValidationError(getErrorMessage(error, "秒杀活动 ID 无效"));
      return;
    }

    await runAction(
      "preheat",
      async () => {
        await preheatVoucherSeckill(seckillId);
      },
      "秒杀活动预热成功",
      "秒杀活动预热失败",
    );
  };

  const handleRedeem = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const redeemCode = redeemForm.redeemCode.trim();

    if (!redeemCode) {
      setValidationError("兑换码不能为空");
      return;
    }

    if (redeemCode.length > REDEEM_CODE_MAX_LENGTH) {
      setValidationError(`兑换码不能超过 ${REDEEM_CODE_MAX_LENGTH} 个字符`);
      return;
    }

    await runAction(
      "redeem",
      async () => {
        await redeemVoucherOrder(redeemCode);
        setRedeemForm({ redeemCode: "" });
      },
      "兑换码核销成功",
      "兑换码核销失败",
    );
  };

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <AppHeader />

      <div className="mx-auto max-w-7xl px-5 pb-6 pt-6 sm:px-8">
        <div className="mb-6 rounded-md border border-line bg-panel p-5 shadow-subtle">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm tracking-[0.24em] text-muted">优惠券管理</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                优惠券后台
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
                创建优惠券、配置秒杀库存，并处理线下兑换码核销。
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

        <div className="grid gap-5 lg:grid-cols-[240px_minmax(0,1fr)]">
          <aside className="h-fit rounded-md border border-line bg-panel p-3 shadow-subtle">
            <nav className="grid gap-2">
              {actionItems.map((item) => {
                const isActive = activeAction === item.key;

                return (
                  <button
                    key={item.key}
                    type="button"
                    className={cx(
                      "rounded-md px-4 py-3 text-left transition",
                      isActive
                        ? "bg-soft font-medium text-accent"
                        : "text-foreground hover:bg-soft hover:text-accent",
                    )}
                    onClick={() => {
                      setActiveAction(item.key);
                      setNotice(null);
                    }}
                    disabled={isSubmitting}
                  >
                    <span className="block text-sm">{item.label}</span>
                    <span className="mt-1 block break-all text-xs text-muted">
                      {item.summary}
                    </span>
                  </button>
                );
              })}
            </nav>
          </aside>

          <section className="min-w-0">
            <div className="rounded-md border border-line bg-panel p-4 shadow-subtle sm:p-5">
              <div className="mb-5 flex flex-col gap-2 border-b border-line pb-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-xs tracking-[0.24em] text-muted">
                    {currentAction?.summary}
                  </p>
                  <h2 className="mt-2 text-xl font-semibold text-foreground">
                    {currentAction?.label}
                  </h2>
                </div>
                <div className="rounded-md border border-line bg-soft px-3 py-2 text-sm text-muted">
                  {user?.nickname || "当前账号"}
                </div>
              </div>

              {notice ? (
                <div
                  className={cx(
                    "mb-4 rounded-md border px-3 py-2 text-sm leading-6",
                    notice.type === "error"
                      ? "border-danger/60 bg-danger/10 text-danger"
                      : "border-accent/60 bg-accent/10 text-accent",
                  )}
                  role={notice.type === "error" ? "alert" : "status"}
                >
                  {notice.text}
                </div>
              ) : null}

              {activeAction === "voucher" ? (
                <form className="grid gap-4" onSubmit={handleCreateVoucher}>
                  <Input
                    label="标题"
                    value={voucherForm.title}
                    onChange={(event) =>
                      setVoucherForm((current) => ({
                        ...current,
                        title: event.target.value,
                      }))
                    }
                    maxLength={VOUCHER_TITLE_MAX_LENGTH}
                    placeholder="登山杖优惠券"
                    disabled={isSubmitting}
                  />
                  <FieldArea
                    id="voucher-description"
                    label="描述"
                    value={voucherForm.description}
                    onChange={(description) =>
                      setVoucherForm((current) => ({ ...current, description }))
                    }
                    maxLength={VOUCHER_DESCRIPTION_MAX_LENGTH}
                    placeholder="凭兑换码可到线下门店兑换一次登山杖优惠资格"
                    disabled={isSubmitting}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                    <div className="text-xs text-muted">
                      标题 {voucherForm.title.length}/{VOUCHER_TITLE_MAX_LENGTH}，
                      描述 {voucherForm.description.length}/
                      {VOUCHER_DESCRIPTION_MAX_LENGTH}
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                      {pendingAction === "voucher" ? "创建中" : "创建优惠券"}
                    </Button>
                  </div>
                </form>
              ) : null}

              {activeAction === "seckill" ? (
                <form className="grid gap-4" onSubmit={handleCreateSeckill}>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <Input
                      label="优惠券 ID"
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      value={seckillForm.voucherId}
                      onChange={(event) =>
                        setSeckillForm((current) => ({
                          ...current,
                          voucherId: event.target.value,
                        }))
                      }
                      disabled={isSubmitting}
                    />
                    <Input
                      label="活动库存"
                      type="number"
                      min="1"
                      step="1"
                      inputMode="numeric"
                      value={seckillForm.totalStock}
                      onChange={(event) =>
                        setSeckillForm((current) => ({
                          ...current,
                          totalStock: event.target.value,
                        }))
                      }
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="grid gap-4 xl:grid-cols-3">
                    <Input
                      label="开始时间"
                      type="datetime-local"
                      step="1"
                      value={seckillForm.startTime}
                      onChange={(event) =>
                        setSeckillForm((current) => ({
                          ...current,
                          startTime: event.target.value,
                        }))
                      }
                      disabled={isSubmitting}
                    />
                    <Input
                      label="结束时间"
                      type="datetime-local"
                      step="1"
                      value={seckillForm.endTime}
                      onChange={(event) =>
                        setSeckillForm((current) => ({
                          ...current,
                          endTime: event.target.value,
                        }))
                      }
                      disabled={isSubmitting}
                    />
                    <Input
                      label="兑换截止时间"
                      type="datetime-local"
                      step="1"
                      value={seckillForm.redeemDeadline}
                      onChange={(event) =>
                        setSeckillForm((current) => ({
                          ...current,
                          redeemDeadline: event.target.value,
                        }))
                      }
                      disabled={isSubmitting}
                    />
                  </div>
                  <div className="flex justify-end border-t border-line pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                      {pendingAction === "seckill" ? "创建中" : "创建秒杀活动"}
                    </Button>
                  </div>
                </form>
              ) : null}

              {activeAction === "preheat" ? (
                <form className="grid gap-4" onSubmit={handlePreheat}>
                  <Input
                    label="秒杀活动 ID"
                    type="number"
                    min="1"
                    step="1"
                    inputMode="numeric"
                    value={preheatForm.seckillId}
                    onChange={(event) =>
                      setPreheatForm({ seckillId: event.target.value })
                    }
                    disabled={isSubmitting}
                  />
                  <div className="flex justify-end border-t border-line pt-4">
                    <Button type="submit" disabled={isSubmitting}>
                      {pendingAction === "preheat" ? "预热中" : "预热秒杀活动"}
                    </Button>
                  </div>
                </form>
              ) : null}

              {activeAction === "redeem" ? (
                <form className="grid gap-4" onSubmit={handleRedeem}>
                  <Input
                    label="兑换码"
                    value={redeemForm.redeemCode}
                    onChange={(event) =>
                      setRedeemForm({ redeemCode: event.target.value })
                    }
                    maxLength={REDEEM_CODE_MAX_LENGTH}
                    placeholder="QILU-VR-9F3A8K2P"
                    disabled={isSubmitting}
                  />
                  <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
                    <div className="text-xs text-muted">
                      兑换码 {redeemForm.redeemCode.length}/
                      {REDEEM_CODE_MAX_LENGTH}
                    </div>
                    <Button type="submit" disabled={isSubmitting}>
                      {pendingAction === "redeem" ? "核销中" : "核销兑换码"}
                    </Button>
                  </div>
                </form>
              ) : null}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

export default function VoucherAdminPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <VoucherAdminPageContent />
    </Suspense>
  );
}
