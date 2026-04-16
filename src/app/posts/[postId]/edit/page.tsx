"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AppHeader, PageLoading } from "@/components/product-shell";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Input } from "@/components/ui/input";
import { getPost, updatePost } from "@/lib/api";
import { useCurrentUser } from "@/lib/use-current-user";

const MAX_TITLE_LENGTH = 128;
const MAX_CONTENT_LENGTH = 4096;

function getParam(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default function EditPostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = getParam(params.postId);
  const { error: userError, isLoading: isUserLoading } = useCurrentUser();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<1 | 2>(1);
  const [error, setError] = useState("");
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  const canSubmit = trimmedContent.length > 0 && title.length <= MAX_TITLE_LENGTH;
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
      setTitle(result.title ?? "");
      setContent(result.content);
      setVisibility(result.visibility === 2 ? 2 : 1);
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

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!postId) {
      setError("帖子不存在");
      return;
    }

    if (!trimmedContent) {
      setError("内容不能为空");
      return;
    }

    if (title.length > MAX_TITLE_LENGTH) {
      setError(`标题不能超过 ${MAX_TITLE_LENGTH} 个字符`);
      return;
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      setError(`内容不能超过 ${MAX_CONTENT_LENGTH} 个字符`);
      return;
    }

    setIsSubmitting(true);

    try {
      await updatePost(postId, {
        title: trimmedTitle || undefined,
        content: trimmedContent,
        visibility,
      });
      router.replace(`/posts/${postId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "更新失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading || isLoadingPost) {
    return <PageLoading />;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <AppHeader />

      <div className="mx-auto grid max-w-7xl gap-7 px-5 py-7 sm:px-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0">
          <form
            className="rounded-md border border-line bg-panel p-5 shadow-subtle sm:p-7"
            onSubmit={handleSubmit}
          >
            <p className="text-sm tracking-[0.24em] text-accent">EDIT POST</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              编辑帖子
            </h1>
            <p className="mt-3 text-sm leading-7 text-muted">
              当前所有登录用户都可以进入编辑和删除流程。
            </p>

            <div className="mt-7 grid gap-5">
              <Input
                label="标题"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={MAX_TITLE_LENGTH}
                placeholder="updated title"
              />

              <div>
                <span className="mb-2 block text-sm font-medium text-foreground">
                  可见性
                </span>
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { value: 1 as const, label: "公开", description: "进入最新发布" },
                    { value: 2 as const, label: "私密", description: "仅保留给自己" },
                  ].map((item) => (
                    <button
                      key={item.value}
                      type="button"
                      className={`rounded-md border p-4 text-left transition ${
                        visibility === item.value
                          ? "border-accent bg-soft text-foreground"
                          : "border-line bg-transparent text-muted hover:border-accent"
                      }`}
                      onClick={() => setVisibility(item.value)}
                    >
                      <span className="block text-sm font-medium">{item.label}</span>
                      <span className="mt-1 block text-xs">{item.description}</span>
                    </button>
                  ))}
                </div>
              </div>

              <label className="block" htmlFor="post-content">
                <span className="mb-2 block text-sm font-medium text-foreground">
                  内容
                </span>
                <textarea
                  id="post-content"
                  className="min-h-72 w-full resize-y rounded-md border border-line bg-soft px-3 py-3 text-sm leading-7 text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:bg-panel"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  maxLength={MAX_CONTENT_LENGTH}
                  placeholder="updated content"
                  required
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
              <div className="text-xs text-muted">
                标题 {title.length}/{MAX_TITLE_LENGTH}，正文 {content.length}/
                {MAX_CONTENT_LENGTH}
              </div>
              <div className="flex gap-3">
                <Link
                  href={`/posts/${postId}`}
                  className="inline-flex h-11 items-center justify-center rounded-md border border-line px-5 text-sm text-foreground transition hover:border-accent hover:text-accent"
                >
                  取消
                </Link>
                <Button type="submit" disabled={isSubmitting || !canSubmit}>
                  {isSubmitting ? "正在保存" : "保存修改"}
                </Button>
              </div>
            </div>

            {error || userError ? (
              <div className="mt-5">
                <ErrorNotice message={error || userError} />
              </div>
            ) : null}
          </form>
        </section>

        <aside className="space-y-5">
          <div className="rounded-md border border-line bg-panel p-5 shadow-subtle">
            <p className="text-xs tracking-[0.24em] text-muted">LIMITS</p>
            <div className="mt-4 grid gap-3 text-sm text-muted">
              <p>标题最多 {MAX_TITLE_LENGTH} 个字符。</p>
              <p>内容最多 {MAX_CONTENT_LENGTH} 个字符。</p>
              <p>{visibility === 1 ? "公开内容会进入列表。" : "当前选择为私密保存。"}</p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
