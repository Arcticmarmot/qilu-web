"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { QiluMark } from "@/components/ui/qilu-mark";
import { clearToken } from "@/lib/auth";

export function AppHeader() {
  const router = useRouter();

  const handleLogout = () => {
    clearToken();
    router.replace("/login");
  };

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-background/82 backdrop-blur">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <QiluMark />
          <div>
            <p className="text-base font-semibold tracking-[0.18em] text-foreground">
              歧路
            </p>
            <p className="hidden text-xs text-muted sm:block">分支、路径与内容流</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/posts/create"
            className="inline-flex h-9 items-center justify-center rounded-md bg-foreground px-3 text-sm font-medium text-background transition hover:bg-accent-strong"
          >
            发帖
          </Link>
          <Link
            href="/profile?tab=posts"
            className="inline-flex h-9 items-center justify-center rounded-md border border-line px-3 text-sm text-foreground transition hover:border-accent hover:text-accent"
          >
            我的帖子
          </Link>
          <Link
            href="/profile"
            className="hidden h-9 items-center justify-center rounded-md border border-line px-3 text-sm text-foreground transition hover:border-accent hover:text-accent sm:inline-flex"
          >
            个人中心
          </Link>
          <button
            type="button"
            className="inline-flex h-9 min-w-16 items-center justify-center rounded-md border border-[#8f2424] px-4 text-sm font-medium text-[#d98d8d] transition hover:border-[#b73535] hover:bg-[#8f2424]/12 hover:text-[#f0b0b0]"
            onClick={handleLogout}
          >
            退出
          </button>
        </nav>
      </div>
    </header>
  );
}

export function PageLoading() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-6 text-foreground">
      <div className="flex items-center gap-3 text-sm text-muted">
        <span className="h-2 w-2 rounded-full bg-accent" />
        正在确认路径
      </div>
    </main>
  );
}
