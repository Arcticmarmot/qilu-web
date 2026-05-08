"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { AppHeader, PageLoading } from "@/components/product-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast, useToastMessage } from "@/components/ui/toast";
import { createPost, uploadPostImage } from "@/lib/api";
import { getErrorMessage, isAuthError } from "@/lib/error";
import { useCurrentUser } from "@/lib/use-current-user";

const MAX_TITLE_LENGTH = 128;
const MAX_CONTENT_LENGTH = 4096;

type UploadItem = {
  id: string;
  name: string;
  previewUrl: string;
  status: "uploading" | "done" | "error";
  error?: string;
  imageUrl?: string;
  markdown?: string;
};

function createImageMarkdown(name: string, url: string) {
  return `\n\n![${name.replaceAll("]", "")}](${url})`;
}

export default function NewPostPage() {
  const router = useRouter();
  const { user, error: userError, isLoading } = useCurrentUser();
  const notify = useToast();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<1 | 2>(1);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const previewUrlsRef = useRef<string[]>([]);

  useToastMessage(error || userError, "error");

  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  const isUploading = uploads.some((item) => item.status === "uploading");
  const canSubmit =
    trimmedContent.length > 0 &&
    title.length <= MAX_TITLE_LENGTH &&
    content.length <= MAX_CONTENT_LENGTH &&
    !isUploading;

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  const updateUpload = (id: string, next: Partial<UploadItem>) => {
    setUploads((current) =>
      current.map((item) => (item.id === id ? { ...item, ...next } : item)),
    );
  };

  const appendUploadedImage = (name: string, url: string) => {
    const markdown = createImageMarkdown(name, url);

    setContent((current) => {
      const next = `${current}${markdown}`;
      if (next.length > MAX_CONTENT_LENGTH) {
        setError("图片链接已上传，但正文长度会超过限制，请手动精简后再插入");
        return current;
      }

      return next;
    });

    return markdown;
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!files.length) {
      return;
    }

    setError("");

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length !== files.length) {
      setError("只能上传图片文件");
    }

    imageFiles.forEach((file) => {
      const id = `${file.name}-${file.size}-${crypto.randomUUID()}`;
      const previewUrl = URL.createObjectURL(file);
      previewUrlsRef.current.push(previewUrl);

      setUploads((current) => [
        ...current,
        {
          id,
          name: file.name,
          previewUrl,
          status: "uploading",
        },
      ]);

      void uploadPostImage(file)
        .then((result) => {
          const markdown = appendUploadedImage(
            result.originalFilename || file.name,
            result.url,
          );
          updateUpload(id, {
            status: "done",
            imageUrl: result.url,
            markdown,
          });
          notify(`${file.name} 上传成功`, "success");
        })
        .catch((err) => {
          updateUpload(id, {
            status: "error",
            error: getErrorMessage(err, "图片上传失败"),
          });
          if (!isAuthError(err)) {
            setError(getErrorMessage(err, "图片上传失败"));
          }
        });
    });
  };

  const removeUpload = (id: string) => {
    setUploads((current) => {
      const target = current.find((item) => item.id === id);
      if (target) {
        URL.revokeObjectURL(target.previewUrl);
        previewUrlsRef.current = previewUrlsRef.current.filter(
          (url) => url !== target.previewUrl,
        );
        const markdown = target.markdown;
        if (markdown) {
          setContent((value) => value.replace(markdown, ""));
        }
      }

      return current.filter((item) => item.id !== id);
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

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

    if (isUploading) {
      setError("图片还在上传，请稍后再发布");
      return;
    }

    setIsSubmitting(true);

    try {
      const postId = await createPost({
        title: trimmedTitle || undefined,
        content: trimmedContent,
        visibility,
      });
      notify("发布成功", "success");
      router.replace(postId ? `/posts/me/${postId}` : "/posts/me");
    } catch (err) {
      if (!isAuthError(err)) {
        setError(getErrorMessage(err, "发布失败，请稍后重试"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return <PageLoading />;
  }

  return (
    <main className="h-screen overflow-hidden bg-background text-foreground">
      <AppHeader />

      <div className="mx-auto grid h-[calc(100vh-3.5rem)] max-w-7xl gap-5 overflow-hidden px-5 pb-4 pt-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 overflow-y-auto pr-1">
          <div className="mb-4 overflow-hidden rounded-md border border-line bg-panel shadow-subtle">
            <div className="relative min-h-36">
              <div className="absolute inset-0 bg-[linear-gradient(135deg,#f4d35e_0%,#74c69d_46%,#4cc9f0_100%)] opacity-80" />
              <div className="absolute inset-0 bg-gradient-to-r from-background via-background/76 to-background/18" />
              <div className="relative max-w-2xl p-4 sm:p-5">
                <p className="text-sm tracking-[0.24em] text-accent">创建帖子</p>
                <h1 className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
                  写下新的分支
                </h1>
                <p className="mt-2 text-sm leading-6 text-muted">
                  标题给路径一个入口，正文负责把想法落到页面上。
                </p>
              </div>
            </div>
          </div>

          <form
            className="rounded-md border border-line bg-panel p-4 shadow-subtle sm:p-5"
            onSubmit={handleSubmit}
          >
            <div className="grid gap-4">
              <Input
                label="标题"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={MAX_TITLE_LENGTH}
                placeholder="first post"
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
                      className={`rounded-md border p-3 text-left transition ${
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
                  className="min-h-48 w-full resize-y rounded-md border border-line bg-soft px-3 py-3 text-sm leading-7 text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:bg-panel"
                  value={content}
                  onChange={(event) => setContent(event.target.value)}
                  maxLength={MAX_CONTENT_LENGTH}
                  placeholder="hello qilu, this is my first post"
                  required
                />
              </label>

              <div>
                <span className="mb-2 block text-sm font-medium text-foreground">
                  图片
                </span>
                <label
                  className="flex min-h-28 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-line bg-soft px-4 py-5 text-center transition hover:border-accent hover:bg-panel"
                  htmlFor="post-images"
                >
                  <span className="text-sm font-medium text-foreground">
                    选择图片上传
                  </span>
                  <span className="mt-2 text-xs leading-5 text-muted">
                    可一次选择多张，上传成功后会自动插入正文
                  </span>
                  <input
                    id="post-images"
                    className="sr-only"
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    disabled={isSubmitting}
                  />
                </label>

                {uploads.length ? (
                  <div className="mt-3 grid gap-3 sm:grid-cols-2">
                    {uploads.map((item) => (
                      <div
                        key={item.id}
                        className="overflow-hidden rounded-md border border-line bg-soft"
                      >
                        <div className="aspect-[4/3] bg-background">
                          <img
                            src={item.previewUrl}
                            alt={item.name}
                            className="h-full w-full object-cover"
                          />
                        </div>
                        <div className="grid gap-2 p-3">
                          <div className="flex items-start justify-between gap-3">
                            <p className="min-w-0 truncate text-sm text-foreground">
                              {item.name}
                            </p>
                            <button
                              type="button"
                              className="shrink-0 text-xs text-muted transition hover:text-danger"
                              onClick={() => removeUpload(item.id)}
                            >
                              移除
                            </button>
                          </div>
                          <p
                            className={`text-xs ${
                              item.status === "error"
                                ? "text-danger"
                                : item.status === "done"
                                  ? "text-accent"
                                  : "text-muted"
                            }`}
                          >
                            {item.status === "uploading"
                              ? "上传中"
                              : item.status === "done"
                                ? "已插入正文"
                                : item.error || "上传失败"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : null}
              </div>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <div className="text-xs text-muted">
                标题 {title.length}/{MAX_TITLE_LENGTH}，正文 {content.length}/
                {MAX_CONTENT_LENGTH}
              </div>
              <div className="flex gap-3">
                <Link
                  href="/posts"
                  className="inline-flex h-10 items-center justify-center rounded-md border border-line px-4 text-sm text-foreground transition hover:border-accent hover:text-accent"
                >
                  返回主页
                </Link>
                <Button type="submit" disabled={isSubmitting || !canSubmit}>
                  {isSubmitting ? "正在发布" : isUploading ? "图片上传中" : "发布帖子"}
                </Button>
              </div>
            </div>

          </form>
        </section>

        <aside className="space-y-4 overflow-y-auto pr-1">
          <div className="rounded-md border border-line bg-panel p-5 shadow-subtle">
            <p className="text-xs tracking-[0.24em] text-muted">作者信息</p>
            <h2 className="mt-2 text-lg font-semibold text-foreground">
              {user?.nickname}
            </h2>
            <p className="mt-2 break-all text-sm leading-6 text-muted">
              {user?.email}
            </p>
          </div>

          <div className="rounded-md border border-line bg-panel p-5 shadow-subtle">
            <p className="text-xs tracking-[0.24em] text-muted">发布限制</p>
            <div className="mt-3 grid gap-2 text-sm text-muted">
              <p>标题最多 {MAX_TITLE_LENGTH} 个字符。</p>
              <p>内容最多 {MAX_CONTENT_LENGTH} 个字符。</p>
              <p>{visibility === 1 ? "公开发布后会进入列表。" : "当前选择为私密保存。"}</p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
