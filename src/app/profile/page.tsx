"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ProfileMyPostsSection } from "@/components/profile/profile-my-posts-section";
import { AppHeader, PageLoading } from "@/components/product-shell";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { useToastMessage } from "@/components/ui/toast";
import { cx } from "@/lib/cx";
import { useCurrentUser } from "@/lib/use-current-user";

type ProfileTab = "account" | "posts" | "comments";

function readTab(value: string | null): ProfileTab {
  if (value === "posts" || value === "comments") {
    return value;
  }

  return "account";
}

function buildTabHref(tab: ProfileTab) {
  return tab === "account" ? "/profile" : `/profile?tab=${tab}`;
}

function AccountSection({
  user,
}: {
  user: ReturnType<typeof useCurrentUser>["user"];
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
      <Card className="overflow-hidden">
        <CardContent className="relative p-7">
          <div className="absolute left-8 top-8 h-36 w-px bg-line" />
          <div className="absolute left-8 top-20 h-px w-24 bg-line" />
          <div className="absolute left-8 top-36 h-px w-16 bg-line" />
          <div className="relative pl-10">
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-line bg-soft text-2xl font-semibold text-accent">
              {user?.nickname?.slice(0, 1).toUpperCase() || "我"}
            </div>
            <h2 className="text-2xl font-semibold">{user?.nickname || "未设置昵称"}</h2>
            <p className="mt-2 break-all text-sm text-muted">{user?.email || "-"}</p>
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
          <InfoItem label="创建时间" value={user?.createAt} wide />
        </CardContent>
      </Card>
    </section>
  );
}

export default function ProfilePage() {
  const { user, error, isLoading } = useCurrentUser();
  const searchParams = useSearchParams();
  const activeTab = readTab(searchParams.get("tab"));

  useToastMessage(error, "error");

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <AppHeader />

      <div className="mx-auto max-w-7xl px-5 pb-6 pt-6 sm:px-8">
        <div className="mb-6 rounded-md border border-line bg-panel p-5 shadow-subtle">
          <p className="text-sm tracking-[0.24em] text-muted">个人档案</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight">个人中心</h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
            在这里统一查看账号信息、管理帖子，以及后续接入评论记录。
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="h-fit rounded-md border border-line bg-panel p-3 shadow-subtle">
            <nav className="grid gap-2">
              {[
                { key: "account", label: "账号信息" },
                { key: "posts", label: "我的帖子" },
                { key: "comments", label: "我的评论" },
              ].map((item) => {
                const isActive = activeTab === item.key;

                return (
                  <Link
                    key={item.key}
                    href={buildTabHref(item.key as ProfileTab)}
                    className={cx(
                      "inline-flex h-11 items-center rounded-md px-4 text-sm transition",
                      isActive
                        ? "bg-soft font-medium text-accent"
                        : "text-foreground hover:bg-soft hover:text-accent",
                    )}
                  >
                    {item.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <div className="min-w-0">
            {activeTab === "account" ? <AccountSection user={user} /> : null}
            {activeTab === "posts" ? <ProfileMyPostsSection /> : null}
            {activeTab === "comments" ? (
              <EmptyState
                title="我的评论"
                description="评论接口还未接入，这里先预留为空，后续可直接补上列表与筛选。"
              />
            ) : null}
          </div>
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
