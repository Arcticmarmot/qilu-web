"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { AppHeader, PageLoading } from "@/components/product-shell";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorNotice } from "@/components/ui/error-notice";
import { getPostPage, type PageResult, type PostListItem } from "@/lib/api";
import { cx } from "@/lib/cx";
import { useCurrentUser } from "@/lib/use-current-user";

const PAGE_SIZE = 6;
const fortuneItems = [
  "宜跑步",
  "宜早睡",
  "宜发帖",
  "宜整理书桌",
  "宜喝热水",
  "宜晒太阳",
  "宜看书",
  "宜认真吃饭",
  "宜散步",
];

function readPage(value: string | null) {
  const page = Number(value);

  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }

  return Math.floor(page);
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getPostTime(post: PostListItem) {
  return post.createAt ?? post.createdAt ?? "";
}

function getDailyFortune() {
  const now = new Date();
  const dateText = new Intl.DateTimeFormat("zh-CN", {
    month: "long",
    day: "numeric",
    weekday: "short",
  }).format(now);
  const seed =
    now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const score = (seed * 37) % 100;
  const firstIndex = seed % fortuneItems.length;
  const secondIndex = Math.floor(seed / 3) % fortuneItems.length;
  const thirdIndex = Math.floor(seed / 7) % fortuneItems.length;
  const items = [firstIndex, secondIndex, thirdIndex]
    .map((index) => fortuneItems[index])
    .filter((item, index, all) => all.indexOf(item) === index);

  return {
    dateText,
    score,
    items: items.length >= 3 ? items : [...items, "宜慢一点"].slice(0, 3),
  };
}

function getPageItems(current: number, totalPages: number) {
  const items: Array<number | "..."> = [];

  for (let page = 1; page <= totalPages; page += 1) {
    const nearCurrent = Math.abs(page - current) <= 1;
    const nearEdge = page <= 2 || page > totalPages - 2;

    if (nearCurrent || nearEdge) {
      items.push(page);
      continue;
    }

    if (items[items.length - 1] !== "...") {
      items.push("...");
    }
  }

  return items;
}

function PostCard({ post, index }: { post: PostListItem; index: number }) {
  const palette = [
    "from-[#f4d35e] via-[#74c69d] to-[#4cc9f0]",
    "from-[#4cc9f0] via-[#74c69d] to-[#f0eee7]",
    "from-[#f0eee7] via-[#f4d35e] to-[#74c69d]",
    "from-[#74c69d] via-[#4cc9f0] to-[#f4d35e]",
  ];
  const size = index % 3 === 0 ? "min-h-52" : "min-h-48";

  return (
    <Link
      href={`/posts/${post.id}`}
      className={cx(
        "group block break-inside-avoid overflow-hidden rounded-md border border-line bg-panel shadow-subtle transition hover:-translate-y-1 hover:border-accent",
        size,
      )}
    >
      <div className={cx("h-20 bg-gradient-to-br", palette[index % palette.length])}>
        <div className="flex h-full items-end justify-between bg-background/10 p-3">
          <span className="rounded-md bg-background/72 px-3 py-1 text-xs font-medium text-foreground backdrop-blur">
            #{post.id}
          </span>
          <span className="rounded-md bg-background/72 px-3 py-1 text-xs text-accent backdrop-blur">
            公开
          </span>
        </div>
      </div>
      <article className="p-4">
        <h2 className="line-clamp-2 break-words text-base font-semibold leading-6 text-foreground group-hover:text-accent-strong">
          {post.title?.trim() || "未命名帖子"}
        </h2>
        <div className="mt-4 grid gap-2 border-t border-line pt-3 text-xs text-muted">
          <div className="flex items-center justify-between gap-3">
            <span>发布人</span>
            <span className="min-w-0 max-w-44 truncate text-right text-foreground">
              {post.userUuid}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>创建时间</span>
            <span className="text-foreground">
              {getPostTime(post) ? formatDate(getPostTime(post)) : "暂无"}
            </span>
          </div>
        </div>
      </article>
    </Link>
  );
}

function Pagination({
  current,
  total,
  onChange,
}: {
  current: number;
  total: number;
  onChange: (page: number) => void;
}) {
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageItems = getPageItems(current, totalPages);

  return (
    <nav className="mt-7 rounded-md border border-line bg-panel p-4 shadow-subtle">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          共 <span className="font-medium text-foreground">{total}</span> 条帖子，
          第 <span className="font-medium text-foreground">{current}</span> / {totalPages} 页
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            className="h-9 px-3"
            disabled={current <= 1}
            onClick={() => onChange(current - 1)}
          >
            上一页
          </Button>
          {pageItems.map((item, index) =>
            item === "..." ? (
              <span key={`ellipsis-${index}`} className="px-2 text-sm text-muted">
                ...
              </span>
            ) : (
              <button
                key={item}
                type="button"
                className={cx(
                  "h-9 min-w-9 rounded-md border px-3 text-sm transition",
                  item === current
                    ? "border-accent bg-accent text-background"
                    : "border-line text-foreground hover:border-accent hover:text-accent",
                )}
                onClick={() => onChange(item)}
              >
                {item}
              </button>
            ),
          )}
          <Button
            variant="secondary"
            className="h-9 px-3"
            disabled={current >= totalPages}
            onClick={() => onChange(current + 1)}
          >
            下一页
          </Button>
        </div>
      </div>
    </nav>
  );
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, error: userError, isLoading: isUserLoading } = useCurrentUser();
  const current = readPage(searchParams.get("current"));
  const [page, setPage] = useState<PageResult<PostListItem> | null>(null);
  const [error, setError] = useState("");
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  const loadPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    setError("");

    try {
      const result = await getPostPage({ current, size: PAGE_SIZE });
      setPage(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "帖子加载失败");
    } finally {
      setIsLoadingPosts(false);
    }
  }, [current]);

  useEffect(() => {
    if (!isUserLoading) {
      void loadPosts();
    }
  }, [isUserLoading, loadPosts]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((page?.total ?? 0) / PAGE_SIZE)),
    [page?.total],
  );
  const fortune = useMemo(() => getDailyFortune(), []);

  const handlePageChange = (nextPage: number) => {
    const boundedPage = Math.min(Math.max(1, nextPage), totalPages);
    router.push(`/?current=${boundedPage}&size=${PAGE_SIZE}`);
  };

  if (isUserLoading) {
    return <PageLoading />;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <AppHeader />

      <div className="mx-auto grid max-w-7xl gap-5 px-5 py-5 sm:px-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section className="min-w-0">
          <div className="mb-5 flex flex-col gap-4 rounded-md border border-line bg-panel p-4 shadow-subtle sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <p className="text-xs tracking-[0.24em] text-accent">POST FEED</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                最新发布
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                浏览公开内容，点进卡片查看完整正文、发布人和创建时间。
              </p>
            </div>
            <Link
              href="/posts/new"
              className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition hover:bg-accent-strong"
            >
              发布帖子
            </Link>
          </div>

          {error || userError ? (
            <div className="mb-5">
              <ErrorNotice message={error || userError} />
            </div>
          ) : null}

          {isLoadingPosts ? (
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-48 animate-pulse rounded-md border border-line bg-panel"
                />
              ))}
            </div>
          ) : page?.records.length ? (
            <>
              <div className="columns-1 gap-4 sm:columns-2 xl:columns-3 [&>*]:mb-4">
                {page.records.map((post, index) => (
                  <PostCard key={post.id} post={post} index={index} />
                ))}
              </div>
              <Pagination
                current={page.current || current}
                total={page.total}
                onChange={handlePageChange}
              />
            </>
          ) : (
            <EmptyState
              title="还没有帖子"
              description="发布第一篇帖子后，这里会出现公开内容流。"
            />
          )}
        </section>

        <aside className="space-y-4">
          <div className="overflow-hidden rounded-md border border-line bg-panel shadow-subtle">
            <div className="h-20 bg-[linear-gradient(135deg,#f4d35e_0%,#74c69d_48%,#4cc9f0_100%)]" />
            <div className="p-4">
              <p className="text-xs tracking-[0.24em] text-muted">SIGNED IN</p>
              <h2 className="mt-2 text-lg font-semibold text-foreground">
                {user?.nickname}
              </h2>
              <p className="mt-2 break-all text-sm leading-6 text-muted">
                {user?.email}
              </p>
            </div>
          </div>

          <div className="rounded-md border border-line bg-panel p-4 shadow-subtle">
            <p className="text-xs tracking-[0.24em] text-muted">PAGING</p>
            <p className="mt-2 text-sm leading-6 text-muted">
              每页 {PAGE_SIZE} 条，按创建时间从新到旧排列。
            </p>
          </div>

          <div className="overflow-hidden rounded-md border border-line bg-panel shadow-subtle">
            <Image
              src="/fortune-card.svg"
              alt=""
              width={640}
              height={360}
              className="h-28 w-full object-cover"
              priority
            />
            <div className="p-4">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs tracking-[0.24em] text-muted">TODAY</p>
                  <h2 className="mt-1 text-lg font-semibold text-foreground">
                    今日宜
                  </h2>
                </div>
                <div className="rounded-md border border-line bg-soft px-3 py-2 text-right">
                  <p className="text-xs text-muted">{fortune.dateText}</p>
                  <p className="text-sm font-semibold text-accent-strong">
                    {fortune.score}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid gap-2">
                {fortune.items.map((item) => (
                  <div
                    key={item}
                    className="rounded-md border border-line bg-soft px-3 py-2 text-sm text-foreground"
                  >
                    {item}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<PageLoading />}>
      <HomeContent />
    </Suspense>
  );
}
