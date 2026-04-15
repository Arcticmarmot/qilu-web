"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { QiluMark } from "@/components/ui/qilu-mark";
import { clearToken } from "@/lib/auth";
import { cx } from "@/lib/cx";

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

type ContentCardProps = {
  title: string;
  excerpt: string;
  author: string;
  tag: string;
  image: string;
  height: "short" | "medium" | "tall";
};

const imageHeights = {
  short: "h-40",
  medium: "h-52",
  tall: "h-72",
};

export function ContentCard({
  title,
  excerpt,
  author,
  tag,
  image,
  height,
}: ContentCardProps) {
  return (
    <article className="break-inside-avoid overflow-hidden rounded-md border border-line bg-panel shadow-subtle">
      <div className={cx("relative", imageHeights[height])}>
        <Image
          src={image}
          alt=""
          fill
          unoptimized
          sizes="(min-width: 1280px) 28vw, (min-width: 640px) 44vw, 90vw"
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
        <span className="absolute left-4 top-4 rounded-md border border-line bg-background/72 px-3 py-1 text-xs text-accent backdrop-blur">
          {tag}
        </span>
      </div>
      <div className="p-5">
        <h2 className="text-lg font-semibold leading-7 text-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted">{excerpt}</p>
        <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
          <span className="text-xs text-muted">{author}</span>
          <span className="flex items-center gap-2 text-xs text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            延展中
          </span>
        </div>
      </div>
    </article>
  );
}
