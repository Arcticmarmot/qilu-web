"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LikeButton } from "@/components/posts/like-button";
import { likePost, unlikePost } from "@/lib/api";
import { cx } from "@/lib/cx";

type SocialActionsProps = {
  postId: number | string;
  likedByMe: boolean;
  likeCount: number;
  onLikeChange: (next: { likedByMe: boolean; likeCount: number }) => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
  commentsEnabled?: boolean;
  commentHref?: string;
  commentCount?: number;
  compact?: boolean;
};

export function SocialActions({
  postId,
  likedByMe,
  likeCount,
  onLikeChange,
  onError,
  onSuccess,
  commentsEnabled = false,
  commentHref,
  commentCount,
  compact = false,
}: SocialActionsProps) {
  const handleCommentsClick = () => {
    document.getElementById("comments")?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  };

  return (
    <div className={cx("flex flex-wrap items-center gap-2", compact ? "" : "rounded-md border border-line bg-soft p-2")}>
      <LikeButton
        liked={likedByMe}
        count={likeCount}
        onLike={() => likePost(postId)}
        onUnlike={() => unlikePost(postId)}
        onChange={onLikeChange}
        onError={onError}
        onSuccess={onSuccess}
      />
      <DisabledAction label="收藏" compact={compact}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.9-5.4 2.9 1-6-4.4-4.3 6.1-.9L12 3Z" />
        </svg>
      </DisabledAction>
      {commentHref ? (
        <Link
          href={commentHref}
          className="inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-md border border-line bg-transparent px-2 text-sm font-medium text-muted transition hover:border-accent hover:text-accent"
          title="查看评论"
          aria-label="评论"
        >
          <CommentIcon />
          {typeof commentCount === "number" ? (
            <span className="tabular-nums">{commentCount}</span>
          ) : null}
        </Link>
      ) : (
        <button
          type="button"
          className={cx(
            "inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-md border px-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-65",
            commentsEnabled
              ? "border-line bg-transparent text-muted hover:border-accent hover:text-accent"
              : "border-line text-muted opacity-65",
            compact || commentsEnabled ? "bg-transparent" : "bg-panel",
          )}
          disabled={!commentsEnabled}
          title={commentsEnabled ? "查看评论" : "进入详情后评论"}
          aria-label="评论"
          onClick={handleCommentsClick}
        >
          <CommentIcon />
          {typeof commentCount === "number" ? (
            <span className="tabular-nums">{commentCount}</span>
          ) : null}
        </button>
      )}
    </div>
  );
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.85" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M12 5.2c4.52 0 8.2 2.94 8.2 6.57S16.52 18.34 12 18.34c-1.04 0-2.05-.16-2.98-.47l-4.02 1.53 1.21-3.15c-1.49-1.14-2.41-2.72-2.41-4.48 0-3.63 3.68-6.57 8.2-6.57Z" />
      <path d="M9 11.77h.01" />
      <path d="M12 11.77h.01" />
      <path d="M15 11.77h.01" />
    </svg>
  );
}

function DisabledAction({
  label,
  compact,
  children,
}: {
  label: string;
  compact: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      className={cx(
        "inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-line px-2 text-sm font-medium text-muted opacity-65",
        compact ? "bg-transparent" : "bg-panel",
      )}
      disabled
      title={`${label}接口文档暂未提供`}
      aria-label={label}
    >
      {children}
    </button>
  );
}

type ManagementActionsProps = {
  postId: number | string;
  deleting?: boolean;
  onDelete: () => void;
  compact?: boolean;
};

export function ManagementActions({
  postId,
  deleting = false,
  onDelete,
  compact = false,
}: ManagementActionsProps) {
  if (compact) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href={`/posts/me/${postId}/edit`}
          className="inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-line bg-transparent px-2 text-sm font-medium text-muted transition hover:border-accent hover:text-accent"
          title="编辑"
          aria-label="编辑"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 20h9" />
            <path d="M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
        </Link>
        <button
          type="button"
          className="inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-line bg-transparent px-2 text-sm font-medium text-muted transition hover:border-danger hover:text-danger disabled:cursor-not-allowed disabled:opacity-60"
          disabled={deleting}
          onClick={onDelete}
          title={deleting ? "删除中" : "删除"}
          aria-label={deleting ? "删除中" : "删除"}
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M3 6h18" />
            <path d="M8 6V4h8v2" />
            <path d="m6 6 1 15h10l1-15" />
            <path d="M10 11v6" />
            <path d="M14 11v6" />
          </svg>
        </button>
      </div>
    );
  }

  return (
    <div className="grid gap-2">
      <Link
        href={`/posts/me/${postId}/edit`}
        className="inline-flex h-9 w-full items-center justify-center rounded-md border border-line bg-panel px-3 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
      >
        编辑
      </Link>
      <button
        type="button"
        className="inline-flex h-9 w-full items-center justify-center rounded-md border border-[#8f2424] bg-panel px-3 text-sm font-medium text-[#d98d8d] transition hover:border-[#b73535] hover:bg-[#8f2424]/12 hover:text-[#f0b0b0] disabled:cursor-not-allowed disabled:opacity-60"
        disabled={deleting}
        onClick={onDelete}
      >
        {deleting ? "删除中" : "删除"}
      </button>
    </div>
  );
}
