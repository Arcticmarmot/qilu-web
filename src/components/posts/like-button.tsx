"use client";

import { useState } from "react";
import { likePost, unlikePost } from "@/lib/api";
import { cx } from "@/lib/cx";
import { getErrorMessage, isAuthError } from "@/lib/error";

type LikeButtonProps = {
  postId: number | string;
  likedByMe: boolean;
  likeCount: number;
  onChange: (next: { likedByMe: boolean; likeCount: number }) => void;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
  className?: string;
};

export function LikeButton({
  postId,
  likedByMe,
  likeCount,
  onChange,
  onError,
  onSuccess,
  className,
}: LikeButtonProps) {
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isLoading) {
      return;
    }

    const previous = { likedByMe, likeCount };
    const nextLiked = !likedByMe;
    const nextCount = nextLiked ? likeCount + 1 : Math.max(likeCount - 1, 0);

    setIsLoading(true);
    onError?.("");
    onChange({ likedByMe: nextLiked, likeCount: nextCount });

    try {
      if (nextLiked) {
        await likePost(postId);
        onSuccess?.("点赞成功");
      } else {
        await unlikePost(postId);
        onSuccess?.("已取消点赞");
      }
    } catch (error) {
      onChange(previous);
      if (!isAuthError(error)) {
        onError?.(getErrorMessage(error, "点赞失败"));
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      type="button"
      className={cx(
        "inline-flex h-9 min-w-9 items-center justify-center gap-1.5 rounded-md border px-2.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        likedByMe
          ? "border-danger bg-danger/12 text-danger hover:bg-danger/18"
          : "border-line bg-transparent text-muted hover:border-danger hover:text-danger",
        className,
      )}
      disabled={isLoading}
      onClick={handleClick}
      aria-pressed={likedByMe}
      aria-label={likedByMe ? "取消点赞" : "点赞"}
    >
      <svg
        viewBox="0 0 24 24"
        className={cx(
          "h-4 w-4 transition",
          likedByMe ? "fill-danger stroke-danger" : "fill-transparent stroke-current",
        )}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M20.4 5.7c-2-2.1-5.2-1.9-7.1.3L12 7.5 10.7 6c-1.9-2.2-5.1-2.4-7.1-.3-2 2-1.9 5.2.2 7.2l8.2 7.6 8.2-7.6c2.1-2 2.2-5.2.2-7.2Z" />
      </svg>
      <span className="tabular-nums">{likeCount}</span>
    </button>
  );
}
