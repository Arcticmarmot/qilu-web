"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorNotice } from "@/components/ui/error-notice";
import { QiluMark } from "@/components/ui/qilu-mark";
import { getCurrentUser, type User } from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";

export default function Home() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
      })
      .catch((err: unknown) => {
        clearToken();
        setError(err instanceof Error ? err.message : "登录状态已失效");
        router.replace("/login");
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [router]);

  const handleLogout = () => {
    clearToken();
    router.replace("/login");
  };

  if (isLoading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
        <div className="flex items-center gap-3 text-sm text-muted">
          <span className="h-2 w-2 rounded-full bg-accent" />
          正在确认路径
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <header className="border-b border-line bg-panel/70 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-3">
            <QiluMark />
            <div>
              <p className="text-base font-semibold tracking-[0.18em] text-foreground">
                歧路
              </p>
              <p className="text-xs text-muted">路径、节点与文字</p>
            </div>
          </Link>
          <Button variant="secondary" onClick={handleLogout}>
            退出登录
          </Button>
        </div>
      </header>

      <div className="mx-auto grid max-w-6xl gap-6 px-5 py-8 sm:px-8 lg:grid-cols-[1.5fr_1fr]">
        <section className="space-y-6">
          <Card className="overflow-hidden">
            <CardContent className="relative p-6 sm:p-8">
              <div className="absolute left-8 top-8 h-24 w-px bg-line" />
              <div className="absolute left-8 top-16 h-px w-20 bg-line" />
              <div className="absolute left-8 top-28 h-px w-14 bg-line" />
              <div className="relative pl-8">
                <p className="mb-4 text-sm text-muted">当前位置</p>
                <h1 className="max-w-2xl text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
                  欢迎回到歧路，{user?.nickname}
                </h1>
                <p className="mt-4 max-w-2xl text-sm leading-7 text-muted sm:text-base">
                  这里是第一版产品壳。先确认身份、入口和基础路径，再把真正的内容能力接入进来。
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 sm:grid-cols-3">
            <Card>
              <CardHeader eyebrow="节点" title="身份已恢复" />
              <CardContent>
                <p className="text-sm leading-6 text-muted">
                  已通过 /users/me 确认当前登录态。
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader eyebrow="方向" title="接口可联调" />
              <CardContent>
                <p className="text-sm leading-6 text-muted">
                  API Base URL 来自环境变量，便于本地和部署切换。
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader eyebrow="分岔" title="业务待接入" />
              <CardContent>
                <p className="text-sm leading-6 text-muted">
                  仅保留 MVP 占位，不扩展额外后端需求。
                </p>
              </CardContent>
            </Card>
          </div>

          <EmptyState
            title="还没有新的路径"
            description="内容、草稿、选择流或其他业务模块可以在这里接入。当前版本只保留清晰的入口和登录态恢复。"
          />
        </section>

        <aside className="space-y-6">
          {error ? <ErrorNotice message={error} /> : null}
          <Card>
            <CardHeader eyebrow="用户状态" title="当前账户" />
            <CardContent className="space-y-4">
              <div className="rounded-md border border-line bg-soft p-4">
                <p className="text-xs text-muted">昵称</p>
                <p className="mt-1 text-sm font-medium text-foreground">
                  {user?.nickname}
                </p>
              </div>
              <div className="rounded-md border border-line bg-soft p-4">
                <p className="text-xs text-muted">邮箱</p>
                <p className="mt-1 break-all text-sm font-medium text-foreground">
                  {user?.email}
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader eyebrow="联调说明" title="请求路径" />
            <CardContent>
              <div className="space-y-3 text-sm text-muted">
                <p>POST /auth/login</p>
                <p>POST /users</p>
                <p>GET /users/me</p>
              </div>
            </CardContent>
          </Card>
        </aside>
      </div>
    </main>
  );
}
