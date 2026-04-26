"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { AppHeader, PageLoading } from "@/components/product-shell";
import { SocialActions } from "@/components/posts/post-actions";
import {
  formatDate,
  getPageItems,
  POST_PAGE_SIZE,
  readPage,
} from "@/components/posts/post-utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast, useToastMessage } from "@/components/ui/toast";
import {
  getPostPage,
  type PageResult,
  type PostListItem,
} from "@/lib/api";
import { cx } from "@/lib/cx";
import { getErrorMessage, isAuthError } from "@/lib/error";
import { useCurrentUser } from "@/lib/use-current-user";

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

  return {
    dateText,
    score,
    item: fortuneItems[firstIndex],
  };
}

function PostCard({
  post,
  index,
  onLikeChange,
  onLikeError,
  onLikeSuccess,
}: {
  post: PostListItem;
  index: number;
  onLikeChange: (postId: number, next: { likedByMe: boolean; likeCount: number }) => void;
  onLikeError: (message: string) => void;
  onLikeSuccess: (message: string) => void;
}) {
  const palette = [
    "from-[#f4d35e] via-[#74c69d] to-[#4cc9f0]",
    "from-[#4cc9f0] via-[#74c69d] to-[#f0eee7]",
    "from-[#f0eee7] via-[#f4d35e] to-[#74c69d]",
    "from-[#74c69d] via-[#4cc9f0] to-[#f4d35e]",
  ];
  const blockHeights = ["min-h-[11rem]", "min-h-[12.5rem]", "min-h-[14rem]", "min-h-[12rem]"];
  const previewLines = ["line-clamp-2", "line-clamp-3", "line-clamp-4"];
  const size = blockHeights[index % blockHeights.length];
  const preview = post.contentSnippet?.trim() || "暂无内容预览";
  const previewLine = previewLines[(post.id + index) % previewLines.length];
  const bannerHeights = ["h-14", "h-16", "h-20"];
  const bannerHeight = bannerHeights[(post.id + index) % bannerHeights.length];

  return (
    <article
      className={cx(
        "group flex break-inside-avoid flex-col overflow-hidden rounded-md border border-line bg-panel shadow-subtle transition hover:-translate-y-1 hover:border-accent",
        size,
      )}
    >
      <Link href={`/posts/${post.id}`} className="block">
        <div className={cx("bg-gradient-to-br", bannerHeight, palette[index % palette.length])}>
          <div className="flex h-full items-end justify-end bg-background/10 p-3">
            <span className="rounded-md bg-background/72 px-3 py-1 text-xs text-accent backdrop-blur">
              公开
            </span>
          </div>
        </div>
      </Link>
      <article className="flex flex-1 flex-col p-4">
        <Link href={`/posts/${post.id}`} className="block">
          <h2 className="line-clamp-3 break-words text-base font-semibold leading-6 text-foreground group-hover:text-accent-strong">
            {post.title?.trim() || "未命名帖子"}
          </h2>
          <p className={cx("mt-2 break-words text-sm leading-6 text-muted", previewLine)}>
            {preview}
          </p>
        </Link>
        <div className="mt-auto grid gap-2 border-t border-line pt-3 text-xs text-muted">
          <div className="flex items-center justify-between gap-3">
            <span>发布人</span>
            <span className="min-w-0 max-w-44 truncate text-right text-foreground">
              {post.nickname}
            </span>
          </div>
          <div className="flex items-center justify-between gap-3">
            <span>创建时间</span>
            <span className="text-foreground">
              {formatDate(post.createdAt)}
            </span>
          </div>
          <div>
            <SocialActions
              postId={post.id}
              likedByMe={post.likedByMe}
              likeCount={post.likeCount}
              onLikeChange={(next) => onLikeChange(post.id, next)}
              onError={onLikeError}
              onSuccess={onLikeSuccess}
              commentHref={`/posts/${post.id}#comments`}
              commentCount={post.commentCount}
              compact
            />
          </div>
        </div>
      </article>
    </article>
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
  const totalPages = Math.max(1, Math.ceil(total / POST_PAGE_SIZE));
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
  const notify = useToast();
  const current = readPage(searchParams.get("current"));
  const [page, setPage] = useState<PageResult<PostListItem> | null>(null);
  const [error, setError] = useState("");
  const [likeError, setLikeError] = useState("");
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  useToastMessage(error || userError || likeError, "error");

  const loadPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    setError("");

    try {
      const result = await getPostPage({ current, size: POST_PAGE_SIZE });
      setPage(result);
    } catch (err) {
      if (!isAuthError(err)) {
        setError(getErrorMessage(err, "帖子加载失败"));
      }
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
    () => Math.max(1, Math.ceil((page?.total ?? 0) / POST_PAGE_SIZE)),
    [page?.total],
  );
  const fortune = useMemo(() => getDailyFortune(), []);

  const handlePageChange = (nextPage: number) => {
    const boundedPage = Math.min(Math.max(1, nextPage), totalPages);
    router.push(`/posts?current=${boundedPage}&size=${POST_PAGE_SIZE}`);
  };

  const handleLikeChange = (
    postId: number,
    next: { likedByMe: boolean; likeCount: number },
  ) => {
    setPage((currentPage) => {
      if (!currentPage) {
        return currentPage;
      }

      return {
        ...currentPage,
        records: currentPage.records.map((post) =>
          post.id === postId ? { ...post, ...next } : post,
        ),
      };
    });
  };

  if (isUserLoading) {
    return <PageLoading />;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <AppHeader />

      <div className="mx-auto grid max-w-7xl gap-5 px-5 pb-6 pt-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <section className="min-w-0">
          <div className="mb-4 flex flex-col gap-4 rounded-md border border-line bg-panel p-4 shadow-subtle sm:flex-row sm:items-center sm:justify-between sm:p-5">
            <div>
              <p className="text-xs tracking-[0.24em] text-accent">内容流</p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                最新发布
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                浏览公开内容，点进卡片查看完整正文、发布人和创建时间。
              </p>
            </div>
            <Link
              href="/posts/create"
              className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition hover:bg-accent-strong"
            >
              发布帖子
            </Link>
          </div>

          <div>
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
                    <PostCard
                      key={post.id}
                      post={post}
                      index={index}
                      onLikeChange={handleLikeChange}
                      onLikeError={setLikeError}
                      onLikeSuccess={(message) => notify(message, "success")}
                    />
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
          </div>
        </section>

        <aside className="grid content-start gap-5">
          <NotificationBell card />

          <div className="overflow-hidden rounded-md border border-line bg-panel shadow-subtle">
            <Image
              src="/fortune-card.svg"
              alt=""
              width={640}
              height={360}
              className="h-28 w-full object-cover"
              priority
            />
            <div className="p-5">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs tracking-[0.24em] text-muted">今日签</p>
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
              <div className="mt-4 rounded-md border border-line bg-soft px-3 py-3 text-sm font-medium text-foreground">
                {fortune.item}
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-md border border-line bg-panel shadow-subtle">
            <div className="p-5">
              <div className="mb-4 flex items-center gap-3 border-b border-line pb-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-soft text-base font-semibold text-accent-strong">
                  {user?.nickname?.slice(0, 1).toUpperCase() || "歧"}
                </div>
                <div className="min-w-0">
                  <p className="text-xs tracking-[0.24em] text-muted">当前账号</p>
                  <h2 className="mt-1 truncate text-lg font-semibold text-foreground">
                    {user?.nickname || "未登录"}
                  </h2>
                </div>
              </div>
              <div>
                <p className="break-all text-sm leading-6 text-muted">
                  {user?.email || "暂无邮箱信息"}
                </p>
                <Link
                  href="/profile"
                  className="mt-4 inline-flex h-9 items-center justify-center rounded-md border border-line px-3 text-sm text-foreground transition hover:border-accent hover:text-accent"
                >
                  查看个人中心
                </Link>
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
