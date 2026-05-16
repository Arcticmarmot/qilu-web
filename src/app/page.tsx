"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { NotificationBell } from "@/components/notifications/notification-bell";
import { AppHeader, PageLoading } from "@/components/product-shell";
import { SocialActions } from "@/components/posts/post-actions";
import { getPostCoverUrl, PostCover } from "@/components/posts/post-media";
import { CouponCenterCard } from "@/components/vouchers/coupon-center-card";
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
  searchPosts,
  type PageResult,
  type PostListItem,
} from "@/lib/api";
import { cx } from "@/lib/cx";
import { getErrorMessage, isAuthError } from "@/lib/error";
import { useCurrentUser } from "@/lib/use-current-user";

const fortuneItems = [
  {
    label: "宜慢慢出发",
    tone: "小吉",
    message: "把脚步放轻一点，今天的风会替你指出温柔的方向。",
  },
  {
    label: "宜整理心事",
    tone: "清和",
    message: "留一点空白给自己，新的念头会在安静处发芽。",
  },
  {
    label: "宜认真吃饭",
    tone: "暖阳",
    message: "先照顾好此刻的身体，远方才会变得更近。",
  },
  {
    label: "宜写下一句",
    tone: "灵光",
    message: "有些答案会以文字的样子靠近你，不必急着完成。",
  },
  {
    label: "宜晒太阳",
    tone: "晴签",
    message: "光落在肩上时，心里的小路也会变得清楚。",
  },
  {
    label: "宜看云",
    tone: "浮白",
    message: "让思绪走慢一点，云会替你保存那些柔软的部分。",
  },
  {
    label: "宜轻声问候",
    tone: "有缘",
    message: "今天适合把善意递出去，它会绕一圈再回到你身边。",
  },
  {
    label: "宜早些休息",
    tone: "安宁",
    message: "夜晚不是终点，只是把明天悄悄折好放在枕边。",
  },
];

const greetings = [
  "你好，旅行者！",
  "Welcome, traveler!",
  "¡Hola, viajeros!",
  "Bonjour, voyageurs !",
  "Hallo, Reisende!",
  "こんにちは、旅人たち！",
  "안녕하세요, 여행자 여러분!",
  "Ciao, viaggiatori!",
];

const scrambleCharacters =
  "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&*+-/?@";

function getDailyFortune() {
  const now = new Date();
  const weekday = new Intl.DateTimeFormat("zh-CN", {
    weekday: "short",
  }).format(now);
  const dateText = `${now.getMonth() + 1}月${now.getDate()}日  ${weekday}`;
  const seed =
    now.getFullYear() * 10000 + (now.getMonth() + 1) * 100 + now.getDate();
  const score = (seed * 37) % 100;
  const firstIndex = seed % fortuneItems.length;
  const fortune = fortuneItems[firstIndex];

  return {
    dateText,
    score,
    ...fortune,
  };
}

type DailyFortune = ReturnType<typeof getDailyFortune>;

function AnimatedGreeting() {
  const [displayText, setDisplayText] = useState(greetings[0]);
  const greetingIndexRef = useRef(0);
  const displayTextRef = useRef(greetings[0]);
  const frameTimerRef = useRef<number | null>(null);

  useEffect(() => {
    displayTextRef.current = displayText;
  }, [displayText]);

  useEffect(() => {
    const scrambleToNextGreeting = () => {
      if (frameTimerRef.current != null) {
        window.clearInterval(frameTimerRef.current);
      }

      const nextIndex = (greetingIndexRef.current + 1) % greetings.length;
      const nextText = greetings[nextIndex];
      const fromLetters = Array.from(displayTextRef.current);
      const toLetters = Array.from(nextText);
      const maxLength = Math.max(fromLetters.length, toLetters.length);
      const frameCount = 22;
      let frame = 0;

      frameTimerRef.current = window.setInterval(() => {
        const settledCount = Math.floor((frame / frameCount) * maxLength);
        const nextDisplay = Array.from({ length: maxLength }, (_, index) => {
          const target = toLetters[index] ?? "";

          if (index < settledCount) {
            return target;
          }

          if (!target && frame > frameCount * 0.55) {
            return "";
          }

          return scrambleCharacters[
            Math.floor(Math.random() * scrambleCharacters.length)
          ];
        }).join("");

        setDisplayText(frame >= frameCount ? nextText : nextDisplay);

        if (frame >= frameCount) {
          if (frameTimerRef.current != null) {
            window.clearInterval(frameTimerRef.current);
            frameTimerRef.current = null;
          }
          greetingIndexRef.current = nextIndex;
          displayTextRef.current = nextText;
        }

        frame += 1;
      }, 38);
    };

    const cycleTimer = window.setInterval(scrambleToNextGreeting, 10000);

    return () => {
      window.clearInterval(cycleTimer);

      if (frameTimerRef.current != null) {
        window.clearInterval(frameTimerRef.current);
      }
    };
  }, []);

  return (
    <span className="greeting-scramble inline-block" aria-live="polite">
      {displayText}
    </span>
  );
}

function FortuneCard({ fortune }: { fortune: DailyFortune }) {
  return (
    <div className="relative flex flex-1 overflow-hidden rounded-md border border-line bg-panel p-4 shadow-subtle">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_10%,rgba(116,198,157,0.2),transparent_36%),linear-gradient(180deg,rgba(240,238,231,0.045),rgba(16,20,19,0))]" />
      <div className="relative flex w-full flex-col justify-between rounded-md border border-line bg-[#17241f] p-5 text-foreground">
        <div>
          <div className="mx-auto flex h-28 w-full max-w-44 items-center justify-center">
            <svg
              viewBox="0 0 176 128"
              className="fortune-flower h-full w-full"
              fill="none"
              aria-hidden="true"
            >
              <ellipse cx="88" cy="112" rx="42" ry="6" fill="#101413" opacity="0.42" />
              <path
                d="M72 84h32l-4 26H76L72 84Z"
                fill="#1F2724"
                stroke="#A1AEA8"
                strokeOpacity="0.42"
                strokeWidth="2"
              />
              <path
                d="M69 84h38"
                stroke="#74C69D"
                strokeOpacity="0.48"
                strokeWidth="3"
                strokeLinecap="round"
              />
              <g className="fortune-bouquet">
                <path
                  d="M88 85C83 68 74 52 61 35M88 85C94 66 104 50 121 39M88 85C89 64 84 49 92 27M88 85C78 72 62 66 45 68M88 85C100 73 116 66 136 64M88 85C82 64 91 55 76 45M88 85C98 61 111 55 108 33"
                  stroke="#A1AEA8"
                  strokeOpacity="0.58"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
                <path
                  d="M56 30c4-8 10-8 14-1 7-2 11 4 6 10 4 7-2 12-9 8-5 6-12 2-10-6-8-2-8-9-1-11Z"
                  fill="#D48B8B"
                  opacity="0.76"
                />
                <path
                  d="M117 34c5-7 11-6 13 2 8 0 10 7 3 11 2 8-5 12-11 6-7 4-13-2-9-9-7-4-4-11 4-10Z"
                  fill="#F4D35E"
                  opacity="0.72"
                />
                <path
                  d="M88 22c4-6 9-5 11 1 6 0 8 6 3 10 2 6-4 10-9 5-5 4-11 0-8-6-6-3-4-9 3-10Z"
                  fill="#74C69D"
                  opacity="0.76"
                />
                <path
                  d="M40 64c4-6 9-5 12 1 6-1 9 5 4 10 3 6-3 10-9 6-5 4-10 0-8-6-6-2-5-8 1-11Z"
                  fill="#F4D35E"
                  opacity="0.58"
                />
                <path
                  d="M132 59c4-6 9-5 11 1 6 0 8 6 3 10 2 6-4 10-9 5-5 4-10 0-8-6-6-3-4-9 3-10Z"
                  fill="#D48B8B"
                  opacity="0.62"
                />
                <path
                  d="M73 42c4-5 9-4 10 2 6 0 8 5 3 9 2 6-4 9-8 5-5 3-10-1-7-6-5-3-4-8 2-10Z"
                  fill="#74C69D"
                  opacity="0.58"
                />
                <path
                  d="M104 28c4-5 9-4 11 2 6 0 8 6 3 10 2 6-4 9-9 5-5 3-10-1-7-7-5-2-4-8 2-10Z"
                  fill="#F4D35E"
                  opacity="0.52"
                />
                <path
                  d="M69 54c-7 1-12 5-15 12 8 1 14-3 17-10"
                  fill="#74C69D"
                  opacity="0.38"
                />
                <path
                  d="M103 49c6-2 13 0 18 6-7 4-15 3-20-4"
                  fill="#74C69D"
                  opacity="0.34"
                />
                <path
                  d="M79 62c-7 0-12 4-15 10 8 1 14-2 17-8"
                  fill="#74C69D"
                  opacity="0.32"
                />
                <path
                  d="M96 59c6 0 12 3 16 9-7 2-14 0-18-7"
                  fill="#74C69D"
                  opacity="0.3"
                />
                <path
                  d="M58 73c-6 2-10 6-12 12 7 0 12-4 14-10"
                  fill="#74C69D"
                  opacity="0.28"
                />
              </g>
            </svg>
          </div>

          <div className="mt-5 text-center">
            <p className="fortune-date text-sm font-medium text-muted">
              {fortune.dateText}
            </p>
            <p className="mt-3 text-2xl font-semibold text-accent">
              {fortune.label}
            </p>
            <p className="mt-2 text-sm text-accent-strong">{fortune.tone}</p>
          </div>
        </div>

        <div className="mt-6 border-t border-line pt-5">
          <p className="text-sm leading-7 text-muted">{fortune.message}</p>
          <div className="mt-5 flex items-center justify-between text-xs text-muted">
            <span>签序 {String(fortune.score).padStart(2, "0")}</span>
            <span>心平路顺</span>
          </div>
        </div>
      </div>
    </div>
  );
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
          className="aspect-[16/7]"
          imageClassName="transition duration-500 group-hover:scale-105"
          fallbackClassName={fallbackPalette[index % fallbackPalette.length]}
          priority={index < 3}
        />
      </Link>
      <div className="flex flex-1 flex-col p-3">
        <Link href={`/posts/${post.id}`} className="block">
          <h2 className="line-clamp-1 break-words text-base font-semibold leading-6 text-foreground group-hover:text-accent-strong">
            {post.title?.trim() || "未命名帖子"}
          </h2>
          <p className="mt-2 line-clamp-2 break-words text-xs leading-5 text-muted">
            {preview}
          </p>
        </Link>
        <div className="mt-3 grid gap-1.5 border-t border-line pt-3 text-xs text-muted">
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
    if (current > 1) {
      params.set("current", String(current));
      params.set("size", String(POST_PAGE_SIZE));
    }
  } else if (current > 1) {
    params.set("current", String(current));
    params.set("size", String(POST_PAGE_SIZE));
  }

  const query = params.toString();
  return query ? `/posts?${query}` : "/posts";
}

function buildSearchHref(keyword: string, current = 1) {
  const params = new URLSearchParams({ keyword });

  if (current > 1) {
    params.set("current", String(current));
    params.set("size", String(POST_PAGE_SIZE));
  }

  return `/posts?${params.toString()}`;
}

function HomeContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { error: userError, isLoading: isUserLoading } = useCurrentUser();
  const notify = useToast();
  const current = readPage(searchParams.get("current"));
  const mode = readFeedMode(searchParams.get("mode"));
  const keyword = (searchParams.get("keyword") ?? "").trim();
  const [page, setPage] = useState<PageResult<PostListItem> | null>(null);
  const [hotPage, setHotPage] = useState<PageResult<PostListItem> | null>(null);
  const [searchPage, setSearchPage] = useState<PageResult<PostListItem> | null>(null);
  const [error, setError] = useState("");
  const [likeError, setLikeError] = useState("");
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);

  useToastMessage(error || userError || likeError, "error");

  const loadPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    setError("");

    try {
      setHotPage(null);
      setPage(null);
      setSearchPage(null);

      if (keyword) {
        const result = await searchPosts({
          keyword,
          current,
          size: POST_PAGE_SIZE,
        });
        setSearchPage(result);
      } else if (mode === "hot") {
        const result = await getHotPostList({
          current,
          size: POST_PAGE_SIZE,
        });
        setHotPage(result);
      } else {
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
  }, [current, keyword, mode]);

  useEffect(() => {
    if (!isUserLoading) {
      void loadPosts();
    }
  }, [isUserLoading, loadPosts]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((page?.total ?? 0) / POST_PAGE_SIZE)),
    [page?.total],
  );
  const hotTotalPages = useMemo(
    () => Math.max(1, Math.ceil((hotPage?.total ?? 0) / POST_PAGE_SIZE)),
    [hotPage?.total],
  );
  const searchTotalPages = useMemo(
    () => Math.max(1, Math.ceil((searchPage?.total ?? 0) / POST_PAGE_SIZE)),
    [searchPage?.total],
  );
  const fortune = useMemo(() => getDailyFortune(), []);
  const isSearchMode = keyword.length > 0;
  const isHotMode = !isSearchMode && mode === "hot";
  const visiblePosts = isSearchMode
    ? searchPage?.records ?? []
    : isHotMode
      ? hotPage?.records ?? []
      : page?.records ?? [];

  const handlePageChange = (nextPage: number) => {
    const boundedPage = Math.min(Math.max(1, nextPage), totalPages);
    router.push(buildFeedHref("latest", boundedPage));
  };

  const handleHotPageChange = (nextPage: number) => {
    const boundedPage = Math.min(Math.max(1, nextPage), hotTotalPages);
    router.push(buildFeedHref("hot", boundedPage));
  };

  const handleSearchPageChange = (nextPage: number) => {
    const boundedPage = Math.min(Math.max(1, nextPage), searchTotalPages);
    router.push(buildSearchHref(keyword, boundedPage));
  };

  const handleModeChange = (nextMode: FeedMode) => {
    if (!isSearchMode && nextMode === mode) {
      return;
    }

    router.push(buildFeedHref(nextMode));
  };

  const handleLikeChange = (
    postId: number,
    next: { likedByMe: boolean; likeCount: number },
  ) => {
    if (isSearchMode) {
      setSearchPage((currentPage) => {
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
      return;
    }

    if (isHotMode) {
      setHotPage((currentPage) => {
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
      <AppHeader initialKeyword={keyword} />

      <div className="mx-auto grid max-w-7xl gap-4 px-5 pb-4 pt-4 sm:px-8 lg:grid-cols-[minmax(0,1fr)_290px]">
        <section className="min-w-0">
          <div className="mb-4 rounded-md border border-line bg-panel px-4 py-4 shadow-subtle">
            <div className="min-w-0">
              <h1 className="greeting-title truncate text-2xl font-semibold text-foreground sm:text-3xl">
                {isSearchMode ? (
                  "搜索结果"
                ) : (
                  <AnimatedGreeting />
                )}
              </h1>
            </div>
            {isSearchMode ? (
              <div
                className="mt-4 flex h-[84px] items-start sm:h-9"
                aria-hidden="true"
              >
                <svg
                  viewBox="0 0 720 60"
                  className="h-14 w-full sm:h-9"
                  fill="none"
                  preserveAspectRatio="none"
                >
                  <path
                    d="M0 50H704"
                    stroke="#31403A"
                    strokeWidth="2"
                    strokeLinecap="round"
                  />
                  <g>
                    <path
                      d="M22 49C20 42 17 36 12 30M31 49C33 39 38 31 45 25M48 49C46 41 43 35 38 30M58 49C61 41 67 35 75 32"
                      stroke="#A1AEA8"
                      strokeOpacity="0.45"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M48 49C45 38 42 28 36 18M54 49C55 35 61 24 70 14M64 49C66 39 73 32 82 28M88 49C89 42 94 37 101 35"
                      stroke="#A1AEA8"
                      strokeOpacity="0.58"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M122 49C120 36 116 27 108 17M130 49C132 36 138 27 148 20M139 49C144 42 151 38 160 37M165 49C163 41 160 35 154 30"
                      stroke="#A1AEA8"
                      strokeOpacity="0.5"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M204 49C202 36 197 25 188 15M212 49C213 36 220 24 231 15M222 49C226 40 234 34 245 32M252 49C250 42 246 36 241 30"
                      stroke="#A1AEA8"
                      strokeOpacity="0.56"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M286 49C284 38 279 29 271 21M295 49C299 38 306 31 317 27M304 49C305 39 310 31 319 22M331 49C333 41 338 35 346 31"
                      stroke="#A1AEA8"
                      strokeOpacity="0.5"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M352 49C349 38 345 29 337 20M360 49C362 38 368 30 378 25M389 49C386 41 381 35 374 31"
                      stroke="#A1AEA8"
                      strokeOpacity="0.54"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M438 49C436 37 431 28 423 18M447 49C449 36 456 27 466 20M457 49C462 42 469 38 478 36M492 49C490 41 486 35 480 30"
                      stroke="#A1AEA8"
                      strokeOpacity="0.52"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M522 49C519 38 515 29 507 20M531 49C535 37 543 30 554 26M541 49C543 39 548 31 557 22M569 49C571 41 576 36 584 33"
                      stroke="#A1AEA8"
                      strokeOpacity="0.5"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M610 49C607 37 602 27 594 18M619 49C621 36 628 27 639 21M629 49C634 41 642 36 652 34M673 49C670 41 666 35 660 30"
                      stroke="#A1AEA8"
                      strokeOpacity="0.54"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M95 50C94 43 91 38 86 33M113 50C115 43 119 38 125 35M176 50C174 43 171 37 166 32M267 50C268 43 272 37 279 34M404 50C402 42 398 37 392 33M416 50C418 43 422 38 429 36M500 50C498 43 494 38 488 34M600 50C602 43 606 38 612 35M680 50C682 43 686 38 692 36"
                      stroke="#A1AEA8"
                      strokeOpacity="0.42"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    <path
                      d="M39 30c8 0 14 4 18 12-9 1-16-3-20-10 1-1 1-2 2-2ZM68 27c7-1 13 2 17 8-8 2-14 0-18-6 0-1 0-1 1-2ZM24 37c6 0 11 3 14 9-7 1-13-2-16-8 0-1 1-1 2-1ZM143 30c8-1 14 2 19 9-9 2-16-1-20-7 0-1 0-1 1-2ZM225 28c8-1 15 2 20 9-9 2-17-1-21-7 0-1 0-1 1-2ZM309 34c7-1 13 2 17 8-8 2-14 0-18-6 0-1 0-1 1-2ZM372 31c6-1 12 2 16 7-7 2-13 0-17-5 0-1 0-1 1-2ZM461 30c8-1 14 2 19 9-9 2-16-1-20-7 0-1 0-1 1-2ZM546 33c7-1 13 2 17 8-8 2-14 0-18-6 0-1 0-1 1-2ZM636 28c8-1 15 2 20 9-9 2-17-1-21-7 0-1 0-1 1-2ZM690 34c6-1 12 2 16 7-7 2-13 0-17-5 0-1 0-1 1-2Z"
                      fill="#74C69D"
                      opacity="0.34"
                    />
                    <path
                      d="M78 35c5-5 10-5 13 1 5-1 8 4 4 8 2 5-3 8-8 5-4 4-9 1-8-5-5-1-5-6-1-9ZM182 33c5-5 10-4 13 1 5-1 8 4 4 8 2 5-3 8-8 5-4 4-9 1-8-5-5-1-5-6-1-9ZM253 36c5-5 10-4 12 1 5-1 8 4 4 8 2 5-3 8-7 5-4 4-9 1-8-5-5-1-5-6-1-9ZM482 36c5-5 10-4 12 1 5-1 8 4 4 8 2 5-3 8-7 5-4 4-9 1-8-5-5-1-5-6-1-9ZM578 34c5-5 10-4 13 1 5-1 8 4 4 8 2 5-3 8-8 5-4 4-9 1-8-5-5-1-5-6-1-9ZM348 36c5-5 10-5 13 1 5-1 8 4 4 8 2 5-3 8-8 5-4 4-9 1-8-5-5-1-5-6-1-9ZM663 36c5-5 10-4 12 1 5-1 8 4 4 8 2 5-3 8-7 5-4 4-9 1-8-5-5-1-5-6-1-9Z"
                      fill="#F4D35E"
                      opacity="0.38"
                    />
                    <path
                      d="M96 39c4-5 9-4 11 1 5-1 8 4 4 8 2 5-3 8-7 5-4 4-9 1-8-5-5-1-5-6 0-9ZM165 37c4-5 9-4 11 1 5-1 8 4 4 8 2 5-3 8-7 5-4 4-9 1-8-5-5-1-5-6 0-9ZM404 38c4-5 9-4 11 1 5-1 8 4 4 8 2 5-3 8-7 5-4 4-9 1-8-5-5-1-5-6 0-9ZM514 38c4-5 9-4 11 1 5-1 8 4 4 8 2 5-3 8-7 5-4 4-9 1-8-5-5-1-5-6 0-9ZM620 38c4-5 9-4 11 1 5-1 8 4 4 8 2 5-3 8-7 5-4 4-9 1-8-5-5-1-5-6 0-9Z"
                      fill="#D48B8B"
                      opacity="0.5"
                    />
                    <path
                      d="M126 40c4-4 8-4 10 1 5-1 7 3 4 7 2 5-3 7-7 4-4 3-8 1-7-4-4-1-4-5 0-8ZM295 39c4-4 8-4 10 1 5-1 7 3 4 7 2 5-3 7-7 4-4 3-8 1-7-4-4-1-4-5 0-8ZM452 40c4-4 8-4 10 1 5-1 7 3 4 7 2 5-3 7-7 4-4 3-8 1-7-4-4-1-4-5 0-8Z"
                      fill="#74C69D"
                      opacity="0.34"
                    />
                  </g>
                </svg>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="inline-flex rounded-md border border-line bg-soft p-1">
                  <button
                    type="button"
                    className={cx(
                      "rounded-md px-3 py-1.5 text-sm transition",
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
                      "rounded-md px-3 py-1.5 text-sm transition",
                      isHotMode
                        ? "bg-foreground text-background"
                        : "text-foreground hover:text-accent",
                    )}
                    onClick={() => handleModeChange("hot")}
                  >
                    最热帖子
                  </button>
                </div>
                <Link
                  href="/posts/create"
                  className="inline-flex h-9 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition hover:bg-accent-strong"
                >
                  发布帖子
                </Link>
              </div>
            )}
          </div>

          <div>
            {isLoadingPosts ? (
              <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="h-36 animate-pulse rounded-md border border-line bg-panel"
                  />
                ))}
              </div>
            ) : visiblePosts.length ? (
              <>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
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
                {isSearchMode ? (
                  <Pagination
                    current={searchPage?.current || current}
                    total={searchPage?.total ?? 0}
                    onChange={handleSearchPageChange}
                  />
                ) : isHotMode ? (
                  <Pagination
                    current={hotPage?.current || current}
                    total={hotPage?.total ?? 0}
                    onChange={handleHotPageChange}
                  />
                ) : (
                  <Pagination
                    current={page?.current || current}
                    total={page?.total ?? 0}
                    onChange={handlePageChange}
                  />
                )}
              </>
            ) : (
              <>
                <EmptyState
                  title={
                    isSearchMode
                      ? "没有匹配的帖子"
                      : isHotMode
                        ? "还没有最热帖子"
                        : "还没有帖子"
                  }
                  description={
                    isSearchMode
                      ? "换一个关键词再试试，搜索会匹配标题、分支提示和正文。"
                      : isHotMode
                        ? "当前日榜还没有可展示的帖子，可以先发布或互动后再回来测试接口。"
                        : "发布第一篇帖子后，这里会出现公开内容流。"
                  }
                />
                {isSearchMode && (searchPage?.total || current > 1) ? (
                  <Pagination
                    current={searchPage?.current || current}
                    total={searchPage?.total ?? 0}
                    onChange={handleSearchPageChange}
                  />
                ) : isHotMode && (hotPage?.total || current > 1) ? (
                  <Pagination
                    current={hotPage?.current || current}
                    total={hotPage?.total ?? 0}
                    onChange={handleHotPageChange}
                  />
                ) : null}
              </>
            )}
          </div>
        </section>

        <aside className="flex h-full min-h-0 flex-col gap-4 lg:self-stretch">
          <NotificationBell card />

          <CouponCenterCard />

          <FortuneCard fortune={fortune} />
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
