"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppHeader, PageLoading } from "@/components/product-shell";
import { CommentPanel } from "@/components/posts/comment-panel";
import { ManagementActions, SocialActions } from "@/components/posts/post-actions";
import {
  formatDate,
  getPostTime,
  getVisibilityLabel,
} from "@/components/posts/post-utils";
import { useToast, useToastMessage } from "@/components/ui/toast";
import { deletePost, getMyPost, type Post } from "@/lib/api";
import { useCurrentUser } from "@/lib/use-current-user";

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function MyPostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = getParam(params.postId);
  const { user, error: userError, isLoading: isUserLoading } = useCurrentUser();
  const notify = useToast();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState("");
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);
  const [commentCount, setCommentCount] = useState(0);

  useToastMessage(error || userError, "error");

  const loadPost = useCallback(async () => {
    if (!postId) {
      setError("帖子不存在");
      setIsLoadingPost(false);
      return;
    }

    setIsLoadingPost(true);
    setError("");

    try {
      const result = await getMyPost(postId);
      setPost(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "帖子加载失败");
    } finally {
      setIsLoadingPost(false);
    }
  }, [postId]);

  useEffect(() => {
    if (!isUserLoading) {
      void loadPost();
    }
  }, [isUserLoading, loadPost]);

  const handleDelete = async () => {
    if (!postId || !window.confirm("确认删除这篇帖子？")) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      await deletePost(postId);
      notify("删除成功", "success");
      router.replace("/posts/me");
    } catch (err) {
      setError(err instanceof Error ? err.message : "删除失败");
    } finally {
      setIsDeleting(false);
    }
  };

  if (isUserLoading || isLoadingPost) {
    return <PageLoading />;
  }

  return (
    <main className="h-screen overflow-hidden bg-background text-foreground">
      <AppHeader />

      <div className="mx-auto grid h-[calc(100vh-3.5rem)] max-w-6xl gap-5 overflow-hidden px-5 pb-4 pt-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article className="min-w-0 overflow-y-auto rounded-md border border-line bg-panel shadow-subtle">
          <div className="relative h-52 overflow-hidden rounded-t-md bg-[linear-gradient(135deg,#f4d35e_0%,#74c69d_46%,#4cc9f0_100%)]">
            <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/45 to-transparent" />
          </div>

          <div className="p-6 sm:p-8">
            {post ? (
              <>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                  <span>{formatDate(getPostTime(post))}</span>
                  <span className="rounded-md border border-accent bg-soft px-3 py-1 text-accent">
                    {getVisibilityLabel(post.visibility)}
                  </span>
                </div>
                <h1 className="mt-5 break-words text-3xl font-semibold leading-tight tracking-tight sm:text-4xl">
                  {post.title?.trim() || "未命名帖子"}
                </h1>
                <p className="mt-4 break-all text-xs text-muted">
                  作者 {post.nickname || post.userUuid}
                </p>
                <div className="mt-6 border-t border-line pt-5">
                  <SocialActions
                    postId={post.id}
                    likedByMe={Boolean(post.likedByMe)}
                    likeCount={post.likeCount ?? 0}
                    onLikeChange={(next) =>
                      setPost((current) => (current ? { ...current, ...next } : current))
                    }
                    onError={setError}
                    onSuccess={(message) => notify(message, "success")}
                    commentsEnabled
                    commentCount={commentCount}
                  />
                </div>
                <div className="mt-8 whitespace-pre-wrap break-words border-t border-line pt-8 text-base leading-8">
                  {post.content}
                </div>
                <CommentPanel
                  postId={post.id}
                  currentUserUuid={user?.uuid}
                  onError={setError}
                  onSuccess={(message) => notify(message, "success")}
                  onCountChange={setCommentCount}
                />
              </>
            ) : (
              <p className="text-sm text-muted">没有找到这篇帖子。</p>
            )}
          </div>
        </article>

        <aside className="space-y-4 overflow-y-auto pr-1">
          <div className="grid gap-3">
            {postId ? (
              <ManagementActions
                postId={postId}
                deleting={isDeleting}
                onDelete={handleDelete}
              />
            ) : null}
            <Link
              href="/posts/me"
              className="inline-flex h-9 items-center justify-center rounded-md border border-line px-3 text-sm text-foreground transition hover:border-accent hover:text-accent"
            >
              返回我的帖子
            </Link>
          </div>

          <div className="rounded-md border border-line bg-panel p-5 shadow-subtle">
            <p className="text-xs tracking-[0.24em] text-muted">可见性</p>
            <p className="mt-3 text-sm leading-7 text-muted">
              {post?.visibility === 2
                ? "这篇帖子仅当前账号可见。"
                : "这篇帖子会出现在公开内容流。"}
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
