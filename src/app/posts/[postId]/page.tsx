"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppHeader, PageLoading } from "@/components/product-shell";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";
import { deletePost, getPost, type Post } from "@/lib/api";
import { useCurrentUser } from "@/lib/use-current-user";

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function formatDate(value: string) {
  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

function getPostTime(post: Post) {
  return post.createAt ?? post.createdAt ?? "";
}

export default function PostDetailPage() {
  const router = useRouter();
  const params = useParams();
  const postId = getParam(params.postId);
  const { error: userError, isLoading: isUserLoading } = useCurrentUser();
  const [post, setPost] = useState<Post | null>(null);
  const [error, setError] = useState("");
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

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
      router.replace("/");
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
            {error || userError ? (
              <div className="mb-5">
                <ErrorNotice message={error || userError} />
              </div>
            ) : null}

            {post ? (
              <>
                <div className="flex flex-wrap items-center gap-3 text-xs text-muted">
                  <span className="rounded-md border border-line bg-soft px-3 py-1">
                    #{post.id}
                  </span>
                  <span>{getPostTime(post) ? formatDate(getPostTime(post)) : "暂无"}</span>
                  <span>{post.visibility === 2 ? "私密" : "公开"}</span>
                </div>
                <h1 className="mt-5 break-words text-3xl font-semibold leading-tight tracking-tight text-foreground sm:text-4xl">
                  {post.title?.trim() || "未命名帖子"}
                </h1>
                <p className="mt-4 break-all text-xs text-muted">
                  作者 {post.userUuid}
                </p>
                <div className="mt-8 whitespace-pre-wrap break-words border-t border-line pt-8 text-base leading-8 text-foreground">
                  {post.content}
                </div>
              </>
            ) : (
              <p className="text-sm text-muted">没有找到这篇帖子。</p>
            )}
          </div>
        </article>

        <aside className="space-y-4 overflow-y-auto pr-1">
          <div className="rounded-md border border-line bg-panel p-5 shadow-subtle">
            <p className="text-xs tracking-[0.24em] text-muted">操作面板</p>
            <div className="mt-5 grid gap-3">
              <Link
                href={`/posts/${postId}/edit`}
                className="inline-flex h-11 items-center justify-center rounded-md bg-foreground px-5 text-sm font-medium text-background transition hover:bg-accent-strong"
              >
                编辑帖子
              </Link>
              <Button
                variant="secondary"
                className="w-full border-danger text-danger hover:border-danger hover:text-danger"
                disabled={isDeleting}
                onClick={handleDelete}
              >
                {isDeleting ? "正在删除" : "删除帖子"}
              </Button>
              <Link
                href="/"
                className="inline-flex h-11 items-center justify-center rounded-md border border-line px-5 text-sm text-foreground transition hover:border-accent hover:text-accent"
              >
                返回主页
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
