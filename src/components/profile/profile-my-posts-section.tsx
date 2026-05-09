"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { ManagementActions, SocialActions } from "@/components/posts/post-actions";
import { getPostCoverUrl, PostCover } from "@/components/posts/post-media";
import {
  formatDate,
  getPageItems,
  getVisibilityLabel,
  POST_PAGE_SIZE,
  readPage,
} from "@/components/posts/post-utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { useToast, useToastMessage } from "@/components/ui/toast";
import {
  deletePost,
  getMyPostPage,
  type PageResult,
  type PostListItem,
} from "@/lib/api";
import { cx } from "@/lib/cx";
import { getErrorMessage, isAuthError } from "@/lib/error";

function buildProfilePostsHref(page: number) {
  return `/profile?tab=posts&current=${page}&size=${POST_PAGE_SIZE}`;
}

function MyPostCard({
  post,
  index,
  deletingId,
  onDelete,
  onLikeChange,
  onLikeError,
  onLikeSuccess,
}: {
  post: PostListItem;
  index: number;
  deletingId: number | null;
  onDelete: (postId: number) => void;
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
      <Link href={`/posts/me/${post.id}`} className="block">
        <PostCover
          coverUrl={coverUrl}
          title={post.title}
          badge={getVisibilityLabel(post.visibility)}
          className="aspect-[16/10]"
          imageClassName="transition duration-500 group-hover:scale-105"
          fallbackClassName={fallbackPalette[index % fallbackPalette.length]}
          priority={index < 3}
        />
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link href={`/posts/me/${post.id}`} className="block">
          <h2 className="line-clamp-2 break-words text-lg font-semibold leading-7 text-foreground group-hover:text-accent-strong">
            {post.title?.trim() || "未命名帖子"}
          </h2>
          <p
            className={cx(
              "mt-3 break-words text-sm leading-6 text-muted",
              index % 2 === 0 ? "line-clamp-3" : "line-clamp-4",
            )}
          >
            {preview}
          </p>
        </Link>

        <div className="mt-5 grid gap-2 border-t border-line pt-4 text-xs text-muted">
          <div className="flex items-center justify-between gap-3">
            <span>创建时间</span>
            <span className="text-foreground">{formatDate(post.createdAt)}</span>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <SocialActions
              postId={post.id}
              likedByMe={post.likedByMe}
              likeCount={post.likeCount}
              onLikeChange={(next) => onLikeChange(post.id, next)}
              onError={onLikeError}
              onSuccess={onLikeSuccess}
              commentHref={`/posts/me/${post.id}#comments`}
              commentCount={post.commentCount}
              compact
            />
            <div className="flex items-center gap-2">
              <Link
                href={`/posts/me/${post.id}`}
                className="inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-line px-2 text-sm text-muted transition hover:border-accent hover:text-accent"
                title="详情"
                aria-label="详情"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="h-4 w-4"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M4 5h16" />
                  <path d="M4 12h16" />
                  <path d="M4 19h10" />
                </svg>
              </Link>
              <ManagementActions
                postId={post.id}
                deleting={deletingId === post.id}
                onDelete={() => onDelete(post.id)}
                compact
              />
            </div>
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
    <nav className="mt-5 rounded-md border border-line bg-panel p-4 shadow-subtle">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted">
          共 <span className="font-medium text-foreground">{total}</span> 条帖子，
          第 <span className="font-medium text-foreground">{current}</span> / {totalPages} 页
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="secondary"
            onClick={() => onChange(current - 1)}
            disabled={current <= 1}
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
                  "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm transition",
                  item === current
                    ? "border-accent bg-soft text-accent"
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
            onClick={() => onChange(current + 1)}
            disabled={current >= totalPages}
          >
            下一页
          </Button>
        </div>
      </div>
    </nav>
  );
}

export function ProfileMyPostsSection() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const notify = useToast();
  const current = readPage(searchParams.get("current"));
  const [page, setPage] = useState<PageResult<PostListItem> | null>(null);
  const [error, setError] = useState("");
  const [isLoadingPosts, setIsLoadingPosts] = useState(true);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  useToastMessage(error, "error");

  const loadPosts = useCallback(async () => {
    setIsLoadingPosts(true);
    setError("");

    try {
      const result = await getMyPostPage({ current, size: POST_PAGE_SIZE });
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
    void loadPosts();
  }, [loadPosts]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil((page?.total ?? 0) / POST_PAGE_SIZE)),
    [page?.total],
  );

  const handlePageChange = (nextPage: number) => {
    const boundedPage = Math.min(Math.max(1, nextPage), totalPages);
    router.push(buildProfilePostsHref(boundedPage));
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

  const handleDelete = async (postId: number) => {
    if (!window.confirm("确认删除这篇帖子？")) {
      return;
    }

    setDeletingId(postId);
    setError("");

    try {
      await deletePost(postId);
      notify("删除成功", "success");
      setPage((currentPage) => {
        if (!currentPage) {
          return currentPage;
        }

        return {
          ...currentPage,
          total: Math.max(currentPage.total - 1, 0),
          records: currentPage.records.filter((post) => post.id !== postId),
        };
      });
    } catch (err) {
      if (!isAuthError(err)) {
        setError(getErrorMessage(err, "删除失败"));
      }
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="min-w-0">
      <div className="mb-5 flex flex-col justify-between gap-4 rounded-md border border-line bg-panel p-4 shadow-subtle sm:flex-row sm:items-center sm:p-5">
        <div>
          <p className="text-xs tracking-[0.24em] text-accent">内容管理</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">
            我的帖子
          </h2>
          <p className="mt-2 text-sm leading-6 text-muted">
            管理公开和仅自己可见的帖子。
          </p>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/posts/create"
            className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition hover:bg-accent-strong"
          >
            发布帖子
          </Link>
          <Link
            href="/posts"
            className="inline-flex h-10 items-center justify-center rounded-md border border-line px-4 text-sm text-foreground transition hover:border-accent hover:text-accent"
          >
            公开内容流
          </Link>
        </div>
      </div>

      {isLoadingPosts ? (
        <div className="grid gap-4 sm:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-48 animate-pulse rounded-md border border-line bg-panel"
            />
          ))}
        </div>
      ) : page?.records.length ? (
        <>
          <div className="grid gap-4 xl:grid-cols-2 2xl:grid-cols-3">
            {page.records.map((post, index) => (
              <MyPostCard
                key={post.id}
                post={post}
                index={index}
                deletingId={deletingId}
                onDelete={handleDelete}
                onLikeChange={handleLikeChange}
                onLikeError={setError}
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
          description="发布第一篇帖子后，可以在这里管理公开和私密内容。"
        />
      )}
    </section>
  );
}
