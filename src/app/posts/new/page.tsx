"use client";

import Image from "next/image";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { AppHeader, PageLoading } from "@/components/product-shell";
import { Button } from "@/components/ui/button";
import { ErrorNotice } from "@/components/ui/error-notice";
import { Input } from "@/components/ui/input";
import { createPost } from "@/lib/api";
import { useCurrentUser } from "@/lib/use-current-user";

const MAX_TITLE_LENGTH = 80;
const MAX_CONTENT_LENGTH = 5000;

export default function NewPostPage() {
  const { user, error: userError, isLoading } = useCurrentUser();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  const canSubmit = trimmedTitle.length > 0 && trimmedContent.length > 0;
  const contentPreview = useMemo(() => {
    if (!trimmedContent) {
      return "正文会在这里形成第一段预览。";
    }

    return trimmedContent.length > 180
      ? `${trimmedContent.slice(0, 180)}...`
      : trimmedContent;
  }, [trimmedContent]);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");
    setSuccessMessage("");

    if (!canSubmit) {
      setError("标题和内容都不能为空");
      return;
    }

    setIsSubmitting(true);

    try {
      await createPost({
        title: trimmedTitle,
        content: trimmedContent,
      });
      setTitle("");
      setContent("");
      setSuccessMessage("帖子已发布");
    } catch (err) {
      setError(err instanceof Error ? err.message : "发布失败，请稍后重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <AppHeader />

      <div className="mx-auto grid max-w-7xl gap-7 px-5 py-7 sm:px-8 lg:grid-cols-[minmax(0,1fr)_360px]">
        <section className="min-w-0">
          <div className="mb-7 overflow-hidden rounded-md border border-line bg-panel shadow-subtle">
            <div className="relative min-h-64">
              <Image
                src="https://images.unsplash.com/photo-1455390582262-044cdead277a?auto=format&fit=crop&w=1400&q=80"
                alt=""
                fill
                unoptimized
                sizes="(min-width: 1024px) 68vw, 100vw"
                className="object-cover opacity-62"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/72 to-background/12" />
              <div className="relative max-w-2xl p-6 sm:p-8">
                <p className="text-sm tracking-[0.24em] text-accent">NEW POST</p>
                <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                  写下新的分支
                </h1>
                <p className="mt-4 text-sm leading-7 text-muted">
                  标题给路径一个入口，正文负责把想法落到页面上。
                </p>
              </div>
            </div>
          </div>

          <form
            className="rounded-md border border-line bg-panel p-5 shadow-subtle sm:p-7"
            onSubmit={handleSubmit}
          >
            <div className="grid gap-5">
              <Input
                label="标题"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={MAX_TITLE_LENGTH}
                placeholder="first post"
                required
              />

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
                  placeholder="hello qilu, this is my first post"
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
                  href="/"
                  className="inline-flex h-11 items-center justify-center rounded-md border border-line px-5 text-sm text-foreground transition hover:border-accent hover:text-accent"
                >
                  返回主页
                </Link>
                <Button type="submit" disabled={isSubmitting || !canSubmit}>
                  {isSubmitting ? "正在发布" : "发布帖子"}
                </Button>
              </div>
            </div>

            {error ? (
              <div className="mt-5">
                <ErrorNotice message={error} />
              </div>
            ) : null}

            {userError ? (
              <div className="mt-5">
                <ErrorNotice message={userError} />
              </div>
            ) : null}

            {successMessage ? (
              <div className="mt-5 rounded-md border border-accent bg-soft p-4 text-sm text-accent-strong">
                {successMessage}
              </div>
            ) : null}
          </form>
        </section>

        <aside className="space-y-5">
          <div className="rounded-md border border-line bg-panel p-5 shadow-subtle">
            <p className="text-xs tracking-[0.24em] text-muted">AUTHOR</p>
            <h2 className="mt-2 text-lg font-semibold text-foreground">
              {user?.nickname}
            </h2>
            <p className="mt-2 break-all text-sm leading-6 text-muted">
              {user?.email}
            </p>
          </div>

          <article className="rounded-md border border-line bg-panel p-5 shadow-subtle">
            <p className="text-xs tracking-[0.24em] text-muted">PREVIEW</p>
            <h2 className="mt-3 text-xl font-semibold leading-8 text-foreground">
              {trimmedTitle || "帖子标题"}
            </h2>
            <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-muted">
              {contentPreview}
            </p>
            <div className="mt-5 border-t border-line pt-4 text-xs text-accent">
              发布到 /posts
            </div>
          </article>
        </aside>
      </div>
    </main>
  );
}
