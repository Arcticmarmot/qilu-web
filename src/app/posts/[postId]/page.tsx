"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppHeader, PageLoading } from "@/components/product-shell";
import { CommentPanel } from "@/components/posts/comment-panel";
import { PostContent } from "@/components/posts/post-content";
import { SocialActions } from "@/components/posts/post-actions";
import { formatDate, getPostTime } from "@/components/posts/post-utils";
import { useToast, useToastMessage } from "@/components/ui/toast";
import { getPost, type Post } from "@/lib/api";
import { getErrorMessage, isAuthError } from "@/lib/error";
import { useCurrentUser } from "@/lib/use-current-user";

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function PostDetailPage() {
  const params = useParams();
  const postId = getParam(params.postId);
  const { user, error: userError, isLoading: isUserLoading } = useCurrentUser();
  const notify = useToast();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState("");
  const [isLoadingPost, setIsLoadingPost] = useState(true);
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
      const result = await getPost(postId);
      setPost(result);
    } catch (err) {
      if (!isAuthError(err)) {
        setError(getErrorMessage(err, "帖子加载失败"));
      }
    } finally {
      setIsLoadingPost(false);
    }
  }, [postId]);

  useEffect(() => {
    if (!isUserLoading) {
      void loadPost();
    }
  }, [isUserLoading, loadPost]);

  if (isUserLoading || isLoadingPost) {
    return <PageLoading />;
  }

  return (
    <main className="h-screen overflow-hidden bg-background text-foreground">
      <AppHeader />

      <div className="mx-auto grid h-[calc(100vh-3.5rem)] max-w-6xl gap-5 overflow-hidden px-5 pb-4 pt-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article className="scrollbar-hidden min-w-0 overflow-y-auto rounded-md border border-line bg-panel shadow-subtle">
          <div className="relative h-52 overflow-hidden rounded-t-md bg-[linear-gradient(135deg,#f4d35e_0%,#74c69d_46%,#4cc9f0_100%)]">
            <div className="absolute inset-0 bg-gradient-to-t from-panel via-panel/45 to-transparent" />
          </div>

          <div className="p-6 sm:p-8">
            {post ? (
              <>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                  <span>{getPostTime(post) ? formatDate(getPostTime(post)) : "暂无"}</span>
                  <span>公开</span>
                </div>
                <h1 className="mt-5 break-words text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
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
                <PostContent content={post.content} />
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
          <div className="rounded-md border border-line bg-panel p-5 shadow-subtle">
            <p className="text-xs tracking-[0.24em] text-muted">公开浏览</p>
            <div className="mt-5 grid gap-3">
              <Link
                href="/posts"
                className="inline-flex h-11 items-center justify-center rounded-md border border-line px-5 text-sm text-foreground transition hover:border-accent hover:text-accent"
              >
                返回内容流
              </Link>
              <Link
                href="/profile?tab=posts"
                className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition hover:bg-accent-strong"
              >
                我的帖子
              </Link>
            </div>
          </div>

          <div className="rounded-md border border-line bg-panel p-5 shadow-subtle">
            <p className="text-xs tracking-[0.24em] text-muted">阅读说明</p>
            <p className="mt-3 text-sm leading-7 text-muted">
              详情页展示完整正文，保留换行和段落。
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
