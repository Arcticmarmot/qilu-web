"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
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
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
        <Link href="/" className="flex items-center gap-3">
          <QiluMark />
          <div>
            <p className="text-base font-semibold tracking-[0.18em] text-foreground">
              歧路
            </p>
            <p className="text-xs text-muted">分支、路径与内容流</p>
          </div>
        </Link>

        <nav className="flex items-center gap-2">
          <Link
            href="/profile"
            className="inline-flex h-10 items-center justify-center rounded-md border border-line px-4 text-sm text-foreground transition hover:border-accent hover:text-accent"
          >
            个人中心
          </Link>
          <Button variant="secondary" onClick={handleLogout}>
            退出
          </Button>
        </nav>
      </div>
    </header>
  );
}
