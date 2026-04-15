"use client";

import Link from "next/link";
import { AppHeader, PageLoading } from "@/components/product-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ErrorNotice } from "@/components/ui/error-notice";
import { useCurrentUser } from "@/lib/use-current-user";

export default function ProfilePage() {
  const { user, error, isLoading } = useCurrentUser();

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <AppHeader />

      <div className="mx-auto max-w-5xl px-5 py-8 sm:px-8">
        <div className="mb-7 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <p className="text-sm tracking-[0.24em] text-muted">PROFILE</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              个人中心
            </h1>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
              当前信息来自 /users/me，用于确认登录后的身份节点。
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex h-10 items-center justify-center rounded-md border border-line px-4 text-sm text-foreground transition hover:border-accent hover:text-accent"
          >
            返回首页
          </Link>
        </div>

        {error ? <ErrorNotice message={error} /> : null}

        <div className="grid gap-5 lg:grid-cols-[1fr_1.2fr]">
          <Card className="overflow-hidden">
            <CardContent className="relative p-7">
              <div className="absolute left-8 top-8 h-36 w-px bg-line" />
              <div className="absolute left-8 top-20 h-px w-24 bg-line" />
              <div className="absolute left-8 top-36 h-px w-16 bg-line" />
              <div className="relative pl-10">
                <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-md border border-line bg-soft text-2xl font-semibold text-accent">
                  {user?.nickname?.slice(0, 1).toUpperCase()}
                </div>
                <h2 className="text-2xl font-semibold">{user?.nickname}</h2>
                <p className="mt-2 break-all text-sm text-muted">{user?.email}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader eyebrow="账户信息" title="用户详情" />
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <InfoItem label="UUID" value={user?.uuid} />
              <InfoItem label="状态" value={String(user?.status ?? "")} />
              <InfoItem label="昵称" value={user?.nickname} />
              <InfoItem label="邮箱" value={user?.email} />
              <InfoItem label="创建时间" value={user?.createdAt} wide />
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}

function InfoItem({
  label,
  value,
  wide,
}: {
  label: string;
  value?: string;
  wide?: boolean;
}) {
  return (
    <div className={wide ? "sm:col-span-2" : undefined}>
      <div className="rounded-md border border-line bg-soft p-4">
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-1 break-all text-sm font-medium text-foreground">
          {value || "-"}
        </p>
      </div>
    </div>
  );
}
