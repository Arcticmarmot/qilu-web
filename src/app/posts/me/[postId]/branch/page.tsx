"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { AppHeader, PageLoading } from "@/components/product-shell";
import { BranchPostForm } from "@/components/posts/branch-post-form";
import { formatDate, getPostTime } from "@/components/posts/post-utils";
import { useToastMessage } from "@/components/ui/toast";
import { getMyPost, type Post } from "@/lib/api";
import { getErrorMessage, isAuthError } from "@/lib/error";
import { useCurrentUser } from "@/lib/use-current-user";

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function CreateBranchPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = getParam(params.postId);
  const { error: userError, isLoading: isUserLoading } = useCurrentUser();
  const [parentPost, setParentPost] = useState<Post | null>(null);
  const [error, setError] = useState("");
  const [parentNotice, setParentNotice] = useState("");
  const [isLoadingPost, setIsLoadingPost] = useState(true);

  useToastMessage(error || userError, "error");

  const loadPost = useCallback(async () => {
    if (!postId) {
      setError("帖子不存在");
      setIsLoadingPost(false);
      return;
    }

    setIsLoadingPost(true);
    setError("");
    setParentNotice("");

    try {
      const result = await getMyPost(postId);
      if (!result) {
        setParentNotice("父帖子详情暂时不可用，但仍可按当前父帖子 ID 创建分支。");
        return;
      }

      setParentPost(result);
    } catch (err) {
      if (!isAuthError(err)) {
        setParentNotice(
          getErrorMessage(err, "父帖子详情暂时不可用，但仍可按当前父帖子 ID 创建分支。"),
        );
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

      <div className="mx-auto grid h-[calc(100vh-3.5rem)] max-w-7xl gap-5 overflow-hidden px-5 pb-4 pt-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section className="min-w-0 overflow-y-auto rounded-md border border-line bg-panel p-4 shadow-subtle sm:p-5">
          <p className="text-sm tracking-[0.24em] text-accent">创建分支</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            新分支帖子
          </h1>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-muted">
            分支会挂在当前父帖子下面，提交后回到我的帖子详情页查看分支路径。
          </p>

          {parentNotice ? (
            <p className="mt-4 rounded-md border border-line bg-soft p-3 text-sm leading-6 text-muted">
              {parentNotice}
            </p>
          ) : null}

          {postId ? (
            <div className="mt-5 max-w-2xl">
              <BranchPostForm
                parentPostId={postId}
                parentTitle={parentPost?.title}
                onError={setError}
                onCreated={() =>
                  router.replace(
                    parentPost
                      ? `/posts/me/${parentPost.rootId ?? parentPost.id}`
                      : "/profile?tab=posts",
                  )
                }
              />
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted">父帖子 ID 缺失。</p>
          )}
        </section>

        <aside className="space-y-4 overflow-y-auto pr-1">
          <div className="rounded-md border border-line bg-panel p-5 shadow-subtle">
            <p className="text-xs tracking-[0.24em] text-muted">父帖子</p>
            <h2 className="mt-3 break-words text-lg font-semibold leading-7">
              {parentPost?.title?.trim() || "未命名帖子"}
            </h2>
            <div className="mt-4 grid gap-2 text-sm text-muted">
              <p>父帖子 ID：{postId || "-"}</p>
              <p>创建时间：{parentPost ? formatDate(getPostTime(parentPost)) : "-"}</p>
              <p>父分支：{parentPost?.branchPrompt?.trim() || "根帖子"}</p>
            </div>
          </div>

          <Link
            href={parentPost ? `/posts/me/${parentPost.rootId ?? parentPost.id}` : "/profile?tab=posts"}
            className="inline-flex h-10 w-full items-center justify-center rounded-md border border-line px-4 text-sm text-foreground transition hover:border-accent hover:text-accent"
          >
            {parentPost ? "返回父帖子" : "返回我的帖子"}
          </Link>
        </aside>
      </div>
    </main>
  );
}
