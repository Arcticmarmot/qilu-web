"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { LikeButton } from "@/components/posts/like-button";
import { cx } from "@/lib/cx";

type SocialActionsProps = {
  postId: number | string;
  likedByMe: boolean;
  likeCount: number;
  onLikeChange: (next: { likedByMe: boolean; likeCount: number }) => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
  compact?: boolean;
};

export function SocialActions({
  postId,
  likedByMe,
  likeCount,
  onLikeChange,
  onError,
  onSuccess,
  compact = false,
}: SocialActionsProps) {
  return (
    <div className={cx("flex flex-wrap items-center gap-2", compact ? "" : "rounded-md border border-line bg-soft p-2")}>
      <LikeButton
        postId={postId}
        likedByMe={likedByMe}
        likeCount={likeCount}
        onChange={onLikeChange}
        onError={onError}
        onSuccess={onSuccess}
      />
      <DisabledAction label="收藏" compact={compact}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m12 3 2.7 5.5 6.1.9-4.4 4.3 1 6-5.4-2.9-5.4 2.9 1-6-4.4-4.3 6.1-.9L12 3Z" />
        </svg>
      </DisabledAction>
      <DisabledAction label="评论" compact={compact}>
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M5 5.8A8.4 8.4 0 0 1 12 3a8.4 8.4 0 0 1 7 2.8 7.7 7.7 0 0 1 1.9 5.2c0 4.4-3.9 8-8.9 8a10 10 0 0 1-2.8-.4L4 21l1.4-4.2A7.6 7.6 0 0 1 3.1 11 7.7 7.7 0 0 1 5 5.8Z" />
          <path d="M8.2 11.3h.1" />
          <path d="M12 11.3h.1" />
          <path d="M15.8 11.3h.1" />
        </svg>
      </DisabledAction>
    </div>
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
