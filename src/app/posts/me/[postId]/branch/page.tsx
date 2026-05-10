"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { AppHeader, PageLoading } from "@/components/product-shell";
import { BranchPostForm } from "@/components/posts/branch-post-form";
import { selectMyPostDetail } from "@/components/posts/my-post-detail-cache";
import { useToastMessage } from "@/components/ui/toast";
import { useCurrentUser } from "@/lib/use-current-user";

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function CreateBranchPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = getParam(params.postId);
  const { error: userError, isLoading: isUserLoading } = useCurrentUser();
  const [error, setError] = useState("");

  useToastMessage(error || userError, "error");

  const returnHref = useMemo(() => {
    const selected = selectMyPostDetail(postId);
    const parentPost = selected?.post;
    const rootId =
      parentPost?.rootId ??
      selected?.posts.find((post) => post.parentId == null)?.id ??
      parentPost?.id;

    return rootId ? `/posts/me/${rootId}` : "/profile?tab=posts";
  }, [postId]);

  if (isUserLoading) {
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

          {postId ? (
            <div className="mt-5 max-w-2xl">
              <BranchPostForm
                parentPostId={postId}
                onError={setError}
                onCreated={() => router.replace(returnHref)}
              />
            </div>
          ) : (
            <p className="mt-5 text-sm text-muted">父节点缺失。</p>
          )}
        </section>

        <aside className="space-y-4 overflow-y-auto pr-1">
          <div className="rounded-md border border-line bg-panel p-5 shadow-subtle">
            <p className="text-xs tracking-[0.24em] text-muted">创建规则</p>
            <div className="mt-4 grid gap-2 text-sm text-muted">
              <p>分支会使用当前路径中的父节点 ID 提交。</p>
              <p>创建分支不提交可见性。</p>
              <p>可继续上传图片，提交前需等待图片上传完成。</p>
            </div>
          </div>

          <Link
            href={returnHref}
            className="inline-flex h-10 w-full items-center justify-center rounded-md border border-line px-4 text-sm text-foreground transition hover:border-accent hover:text-accent"
          >
            返回
          </Link>
        </aside>
      </div>
    </main>
  );
}
