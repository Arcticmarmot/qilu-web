"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AppHeader, PageLoading } from "@/components/product-shell";
import { CommentPanel } from "@/components/posts/comment-panel";
import { PostContent } from "@/components/posts/post-content";
import { PostCover, PostMediaCarousel } from "@/components/posts/post-media";
import { ManagementActions, SocialActions } from "@/components/posts/post-actions";
import {
  formatDate,
  getPostTime,
  getVisibilityLabel,
} from "@/components/posts/post-utils";
import { useToast, useToastMessage } from "@/components/ui/toast";
import {
  deletePost,
  getMyPostDetailList,
  getRootPost,
  type Post,
} from "@/lib/api";
import { getErrorMessage, isAuthError } from "@/lib/error";
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
  const articleRef = useRef<HTMLElement | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPostId, setCurrentPostId] = useState<number | null>(null);
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
      const result = await getMyPostDetailList(postId);
      const rootPost = getRootPost(result, postId);
      setPosts(result);
      setCurrentPostId(rootPost?.id ?? null);
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

  const handleDelete = async (targetPostId: number | string) => {
    if (!window.confirm("确认删除这篇帖子？")) {
      return;
    }

    setIsDeleting(true);
    setError("");

    try {
      await deletePost(targetPostId);
      notify("删除成功", "success");
      if (String(targetPostId) === String(postId)) {
        router.replace("/profile?tab=posts");
      } else {
        await loadPost();
      }
    } catch (err) {
      if (!isAuthError(err)) {
        setError(getErrorMessage(err, "删除失败"));
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const post =
    posts.find((item) => item.id === currentPostId) ??
    getRootPost(posts, postId);
  const parentPost = post?.parentId
    ? posts.find((item) => item.id === post.parentId)
    : null;
  const childPosts = useMemo(
    () => (post ? posts.filter((item) => item.parentId === post.id) : []),
    [post, posts],
  );
  const hiddenImageUrls = post?.mediaList?.flatMap((item) => (item.url ? [item.url] : [])) ?? [];
  const hasMedia = Boolean(post?.mediaList?.length);

  const switchPost = (nextPostId: number) => {
    setCurrentPostId(nextPostId);
    setCommentCount(0);
    articleRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const updateCurrentPost = (next: { likedByMe: boolean; likeCount: number }) => {
    if (!post) {
      return;
    }

    setPosts((current) =>
      current.map((item) => (item.id === post.id ? { ...item, ...next } : item)),
    );
  };

  if (isUserLoading || isLoadingPost) {
    return <PageLoading />;
  }

  return (
    <main className="h-screen overflow-hidden bg-background text-foreground">
      <AppHeader />

      <div className="mx-auto grid h-[calc(100vh-3.5rem)] max-w-6xl gap-5 overflow-hidden px-5 pb-4 pt-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_300px]">
        <article
          ref={articleRef}
          className="min-w-0 overflow-y-auto rounded-md border border-line bg-panel shadow-subtle"
        >
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
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-muted">
                  <span className="break-all">作者 {post.nickname || post.userUuid}</span>
                  <span>图片 {post.mediaList?.length ?? 0}</span>
                </div>
                {hasMedia ? (
                  <PostMediaCarousel mediaList={post.mediaList} title={post.title} />
                ) : (
                  <div className="mt-8 overflow-hidden rounded-md border border-line bg-panel shadow-subtle">
                    <PostCover
                      title={post.title}
                      className="aspect-[16/9]"
                      fallbackClassName="bg-[linear-gradient(135deg,#f4d35e_0%,#74c69d_46%,#4cc9f0_100%)]"
                    />
                  </div>
                )}
                <div className="mt-6 border-t border-line pt-5">
                  <SocialActions
                    postId={post.id}
                    likedByMe={Boolean(post.likedByMe)}
                    likeCount={post.likeCount ?? 0}
                    onLikeChange={updateCurrentPost}
                    onError={setError}
                    onSuccess={(message) => notify(message, "success")}
                    commentsEnabled
                    commentCount={commentCount}
                  />
                </div>
                <PostContent content={post.content} hiddenImageUrls={hiddenImageUrls} />
                <CommentPanel
                  key={post.id}
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
            {post ? (
              <ManagementActions
                postId={post.id}
                deleting={isDeleting}
                onDelete={() => handleDelete(post.id)}
              />
            ) : null}
            {post ? (
              <Link
                href={`/posts/me/${post.id}/branch`}
                className="inline-flex h-9 items-center justify-center rounded-md bg-foreground px-3 text-sm font-medium text-background transition hover:bg-accent-strong"
              >
                创建分支
              </Link>
            ) : null}
            <Link
              href="/profile?tab=posts"
              className="inline-flex h-9 items-center justify-center rounded-md border border-line px-3 text-sm text-foreground transition hover:border-accent hover:text-accent"
            >
              返回我的帖子
            </Link>
          </div>

          {post ? (
            <div className="rounded-md border border-line bg-panel p-5 shadow-subtle">
              <p className="text-xs tracking-[0.24em] text-muted">分支路径</p>
              <p className="mt-3 break-words text-sm leading-7 text-foreground">
                {post.branchPrompt?.trim() || "根帖子"}
              </p>

              {parentPost ? (
                <button
                  type="button"
                  className="mt-4 inline-flex h-10 w-full items-center justify-center rounded-md border border-line px-4 text-sm text-foreground transition hover:border-accent hover:text-accent"
                  onClick={() => switchPost(parentPost.id)}
                >
                  返回上级帖子
                </button>
              ) : null}

              <div className="mt-4 grid gap-3">
                {childPosts.length ? (
                  childPosts.map((child) => (
                    <button
                      key={child.id}
                      type="button"
                      className="rounded-md border border-line bg-soft p-3 text-left text-sm leading-6 text-foreground transition hover:border-accent hover:text-accent"
                      onClick={() => switchPost(child.id)}
                    >
                      {child.branchPrompt?.trim() || child.title?.trim() || "未命名分支"}
                    </button>
                  ))
                ) : (
                  <p className="rounded-md border border-line bg-soft p-3 text-sm text-muted">
                    当前帖子暂无子分支。
                  </p>
                )}
              </div>
            </div>
          ) : null}

          <div className="rounded-md border border-line bg-panel p-5 shadow-subtle">
            <p className="text-xs tracking-[0.24em] text-muted">可见性</p>
            <p className="mt-3 text-sm leading-7 text-muted">
              {post?.visibility === 2
                ? "这篇帖子仅当前账号可见。"
                : "这篇帖子会出现在公开内容流。"}
            </p>
            <p className="mt-3 text-sm leading-7 text-muted">
              {hasMedia
                ? "图片轮播按接口返回的 `sortOrder` 排序展示。"
                : "当前帖子没有图片，顶部保持默认展示样式。"}
            </p>
          </div>
        </aside>
      </div>
    </main>
  );
}
