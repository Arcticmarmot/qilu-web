"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { AppHeader, PageLoading } from "@/components/product-shell";
import { SocialActions } from "@/components/posts/post-actions";
import { getPostCoverUrl, PostCover } from "@/components/posts/post-media";
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
  getHotPostList,
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
  const fallbackPalette = [
    "bg-[linear-gradient(135deg,#f4d35e_0%,#74c69d_46%,#4cc9f0_100%)]",
    "bg-[linear-gradient(135deg,#4cc9f0_0%,#74c69d_48%,#f0eee7_100%)]",
    "bg-[linear-gradient(135deg,#f0eee7_0%,#f4d35e_45%,#74c69d_100%)]",
    "bg-[linear-gradient(135deg,#74c69d_0%,#4cc9f0_52%,#f4d35e_100%)]",
  ];
  const preview = post.contentSnippet?.trim() || "暂无内容预览";
  const previewLine = index % 2 === 0 ? "line-clamp-3" : "line-clamp-4";
  const coverUrl = getPostCoverUrl(post);

  return (
    <article
      className="group flex h-full flex-col overflow-hidden rounded-md border border-line bg-panel shadow-subtle transition hover:-translate-y-1 hover:border-accent"
    >
      <Link href={`/posts/${post.id}`} className="block">
        <PostCover
          coverUrl={coverUrl}
          title={post.title}
          badge="公开"
          className="aspect-[16/10]"
          imageClassName="transition duration-500 group-hover:scale-105"
          fallbackClassName={fallbackPalette[index % fallbackPalette.length]}
          priority={index < 3}
        />
      </Link>
      <div className="flex flex-1 flex-col p-4">
        <Link href={`/posts/${post.id}`} className="block">
          <h2 className="line-clamp-2 break-words text-lg font-semibold leading-7 text-foreground group-hover:text-accent-strong">
            {post.title?.trim() || "未命名帖子"}
          </h2>
          <p className={cx("mt-3 break-words text-sm leading-6 text-muted", previewLine)}>
            {preview}
          </p>
        </Link>
        <div className="mt-5 grid gap-2 border-t border-line pt-4 text-xs text-muted">
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
      </div>
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

type FeedMode = "latest" | "hot";

function readFeedMode(value: string | null): FeedMode {
  return value === "hot" ? "hot" : "latest";
}

function buildFeedHref(mode: FeedMode, current = 1) {
  const params = new URLSearchParams();

  if (mode === "hot") {
    params.set("mode", "hot");
  } else if (current > 1) {
    params.set("current", String(current));
    params.set("size", String(POST_PAGE_SIZE));
  }

  const query = params.toString();
  return query ? `/posts?${query}` : "/posts";
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user, error: userError, isLoading: isUserLoading } = useCurrentUser();
  const notify = useToast();
  const current = readPage(searchParams.get("current"));
  const mode = readFeedMode(searchParams.get("mode"));
  const [page, setPage] = useState<PageResult<PostListItem> | null>(null);
  const [hotPosts, setHotPosts] = useState<PostListItem[]>([]);
  const [error, setError] = useState("");
  const [likeError, setLikeError] = useState("");
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  useToastMessage(error || userError || likeError, "error");

  const loadPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    setError("");

    try {
      if (mode === "hot") {
        setHotPosts([]);
        setPage(null);
        const result = await getHotPostList({
          current,
          size: POST_PAGE_SIZE,
        });
        setHotPosts(result);
      } else {
        setPage(null);
        setHotPosts([]);
        const result = await getPostPage({ current, size: POST_PAGE_SIZE });
        setPage(result);
      }
    } catch (err) {
      if (!isAuthError(err)) {
        setError(getErrorMessage(err, "帖子加载失败"));
      }
    } finally {
      setIsLoadingPosts(false);
    }
  }, [current, mode]);

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
  const visiblePosts = mode === "hot" ? hotPosts : page?.records ?? [];
  const isHotMode = mode === "hot";

  const handlePageChange = (nextPage: number) => {
    const boundedPage = Math.min(Math.max(1, nextPage), totalPages);
    router.push(buildFeedHref("latest", boundedPage));
  };

  const handleModeChange = (nextMode: FeedMode) => {
    if (nextMode === mode) {
      return;
    }

    router.push(buildFeedHref(nextMode, current));
  };

  const handleLikeChange = (
    postId: number,
    next: { likedByMe: boolean; likeCount: number },
  ) => {
    if (isHotMode) {
      setHotPosts((currentPosts) =>
        currentPosts.map((post) => (post.id === postId ? { ...post, ...next } : post)),
      );
      return;
    }

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
                {isHotMode ? "最热帖子" : "最新发布"}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
                {isHotMode
                  ? "当前接入 hot-post-controller 的日榜接口，方便直接切换和验证最热帖子数据。"
                  : "浏览公开内容，点进卡片查看完整正文、发布人和创建时间。"}
              </p>
              <div className="mt-4 inline-flex rounded-md border border-line bg-soft p-1">
                <button
                  type="button"
                  className={cx(
                    "rounded-md px-4 py-2 text-sm transition",
                    !isHotMode
                      ? "bg-foreground text-background"
                      : "text-foreground hover:text-accent",
                  )}
                  onClick={() => handleModeChange("latest")}
                >
                  正常模式
                </button>
                <button
                  type="button"
                  className={cx(
                    "rounded-md px-4 py-2 text-sm transition",
                    isHotMode
                      ? "bg-foreground text-background"
                      : "text-foreground hover:text-accent",
                  )}
                  onClick={() => handleModeChange("hot")}
                >
                  最热帖子
                </button>
              </div>
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
            ) : visiblePosts.length ? (
              <>
                <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                  {visiblePosts.map((post, index) => (
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
                {isHotMode ? null : (
                  <Pagination
                    current={page?.current || current}
                    total={page?.total ?? 0}
                    onChange={handlePageChange}
                  />
                )}
              </>
            ) : (
              <EmptyState
                title={isHotMode ? "还没有最热帖子" : "还没有帖子"}
                description={
                  isHotMode
                    ? "当前日榜还没有可展示的帖子，可以先发布或互动后再回来测试接口。"
                    : "发布第一篇帖子后，这里会出现公开内容流。"
                }
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
