"use client";

import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { formatDate } from "@/components/posts/post-utils";
import { EmptyState } from "@/components/ui/empty-state";
import {
  createPostComment,
  deletePostComment,
  getPostComments,
  type PostComment,
} from "@/lib/api";
import { cx } from "@/lib/cx";

const MAX_COMMENT_LENGTH = 1024;

type CommentPanelProps = {
  postId: number | string;
  currentUserUuid?: string;
  onError?: (message: string) => void;
  onSuccess?: (message: string) => void;
  onCountChange?: (count: number) => void;
};

function getInitial(name?: string) {
  return name?.trim().slice(0, 1).toUpperCase() || "歧";
}

export function CommentPanel({
  postId,
  currentUserUuid,
  onError,
  onSuccess,
  onCountChange,
}: CommentPanelProps) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [content, setContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);

  const trimmedContent = content.trim();
  const charactersLeft = MAX_COMMENT_LENGTH - content.length;

  const loadComments = useCallback(async () => {
    setIsLoading(true);
    onError?.("");

    try {
      const result = await getPostComments(postId);
      setComments(result);
      onCountChange?.(result.length);
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "评论加载失败");
    } finally {
      setIsLoading(false);
    }
  }, [onCountChange, onError, postId]);

  useEffect(() => {
    void loadComments();
  }, [loadComments]);

  const sortedComments = useMemo(
    () =>
      [...comments].sort((left, right) => {
        const leftTime = left.createdAt ? new Date(left.createdAt).getTime() : 0;
        const rightTime = right.createdAt ? new Date(right.createdAt).getTime() : 0;
        return leftTime - rightTime;
      }),
    [comments],
  );

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!trimmedContent || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    onError?.("");

    try {
      await createPostComment(postId, { content: trimmedContent });
      setContent("");
      onSuccess?.("评论已发布");
      await loadComments();
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "评论发布失败");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (deletingId || !window.confirm("确认删除这条评论？")) {
      return;
    }

    setDeletingId(commentId);
    onError?.("");

    try {
      await deletePostComment(commentId);
      const nextComments = comments.filter((comment) => comment.id !== commentId);
      setComments(nextComments);
      onCountChange?.(nextComments.length);
      onSuccess?.("评论已删除");
    } catch (error) {
      onError?.(error instanceof Error ? error.message : "评论删除失败");
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section id="comments" className="mt-10 border-t border-line pt-8">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs tracking-[0.24em] text-accent">评论</p>
          <h2 className="mt-2 text-2xl font-semibold tracking-tight text-foreground">
            {comments.length ? `${comments.length} 条回应` : "留下第一条回应"}
          </h2>
        </div>
        <button
          type="button"
          className="inline-flex h-9 items-center justify-center rounded-md border border-line px-3 text-sm text-foreground transition hover:border-accent hover:text-accent disabled:cursor-not-allowed disabled:opacity-60"
          disabled={isLoading}
          onClick={() => void loadComments()}
        >
          刷新评论
        </button>
      </div>

      <form
        className="mt-5 rounded-md border border-line bg-soft p-4"
        onSubmit={handleSubmit}
      >
        <label htmlFor="comment-content" className="text-sm font-medium text-foreground">
          写评论
        </label>
        <textarea
          id="comment-content"
          className="mt-3 min-h-28 w-full resize-y rounded-md border border-line bg-panel px-4 py-3 text-sm leading-6 text-foreground outline-none transition placeholder:text-muted focus:border-accent"
          maxLength={MAX_COMMENT_LENGTH}
          placeholder="说点什么，给这条路径添一段回声。"
          value={content}
          onChange={(event) => setContent(event.target.value)}
        />
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p
            className={cx(
              "text-xs",
              charactersLeft < 80 ? "text-accent-strong" : "text-muted",
            )}
          >
            还可输入 {charactersLeft} 字
          </p>
          <button
            type="submit"
            className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition hover:bg-accent-strong disabled:cursor-not-allowed disabled:opacity-60"
            disabled={!trimmedContent || isSubmitting}
          >
            {isSubmitting ? "提交中" : "发表评论"}
          </button>
        </div>
      </form>

      <div className="mt-5">
        {isLoading ? (
          <div className="grid gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-28 animate-pulse rounded-md border border-line bg-soft"
              />
            ))}
          </div>
        ) : sortedComments.length ? (
          <div className="grid gap-3">
            {sortedComments.map((comment) => {
              const canDelete = Boolean(
                currentUserUuid && comment.userUuid === currentUserUuid,
              );

              return (
                <article
                  key={comment.id}
                  className="rounded-md border border-line bg-soft p-4"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-line bg-panel text-sm font-semibold text-accent-strong">
                      {getInitial(comment.nickname || comment.userUuid)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-foreground">
                            {comment.nickname || comment.userUuid}
                          </p>
                          <p className="mt-1 text-xs text-muted">
                            {comment.createdAt ? formatDate(comment.createdAt) : "刚刚"}
                          </p>
                        </div>
                        {canDelete ? (
                          <button
                            type="button"
                            className="inline-flex h-8 items-center justify-center self-start rounded-md border border-[#8f2424] px-3 text-xs font-medium text-[#d98d8d] transition hover:border-[#b73535] hover:bg-[#8f2424]/12 hover:text-[#f0b0b0] disabled:cursor-not-allowed disabled:opacity-60 sm:self-auto"
                            disabled={deletingId === comment.id}
                            onClick={() => void handleDelete(comment.id)}
                          >
                            {deletingId === comment.id ? "删除中" : "删除"}
                          </button>
                        ) : null}
                      </div>
                      <p className="mt-3 whitespace-pre-wrap break-words text-sm leading-7 text-foreground">
                        {comment.content}
                      </p>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState title="暂无评论" description="发布第一条评论，继续这篇帖子的讨论。" />
        )}
      </div>
    </section>
  );
}
