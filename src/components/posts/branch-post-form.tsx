"use client";

/* eslint-disable @next/next/no-img-element */

import { ChangeEvent, FormEvent, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/toast";
import { createBranchPost, uploadPostImage } from "@/lib/api";
import { getErrorMessage, isAuthError } from "@/lib/error";

const MAX_BRANCH_PROMPT_LENGTH = 128;
const MAX_TITLE_LENGTH = 128;
const MAX_CONTENT_LENGTH = 4096;

type UploadItem = {
  id: string;
  name: string;
  previewUrl: string;
  status: "uploading" | "done" | "error";
  mediaId?: number;
  error?: string;
};

type BranchPostFormProps = {
  parentPostId: number | string;
  parentTitle?: string;
  onError: (message: string) => void;
  onCreated?: () => void;
};

export function BranchPostForm({
  parentPostId,
  parentTitle,
  onError,
  onCreated,
}: BranchPostFormProps) {
  const notify = useToast();
  const [branchPrompt, setBranchPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<1 | 2>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploads, setUploads] = useState<UploadItem[]>([]);
  const previewUrlsRef = useRef<string[]>([]);
  const uploadQueueRef = useRef(Promise.resolve());

  const trimmedBranchPrompt = branchPrompt.trim();
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  const isUploading = uploads.some((item) => item.status === "uploading");
  const canSubmit =
    trimmedContent.length > 0 &&
    branchPrompt.length <= MAX_BRANCH_PROMPT_LENGTH &&
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

  const clearUploads = () => {
    previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    previewUrlsRef.current = [];
    setUploads([]);
  };

  const enqueueUpload = (file: File, id: string) => {
    uploadQueueRef.current = uploadQueueRef.current
      .catch(() => undefined)
      .then(async () => {
        try {
          const result = await uploadPostImage(file);
          updateUpload(id, {
            status: "done",
            mediaId: result.mediaId,
          });
          notify(`${file.name} 上传成功`, "success");
        } catch (err) {
          updateUpload(id, {
            status: "error",
            error: getErrorMessage(err, "图片上传失败"),
          });
          if (!isAuthError(err)) {
            onError(getErrorMessage(err, "图片上传失败"));
          }
        }
      });
  };

  const handleImageChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);
    event.target.value = "";

    if (!files.length) {
      return;
    }

    onError("");

    const imageFiles = files.filter((file) => file.type.startsWith("image/"));
    if (imageFiles.length !== files.length) {
      onError("只能上传图片文件");
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

      enqueueUpload(file, id);
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
      }

      return current.filter((item) => item.id !== id);
    });
  };

  const resetForm = () => {
    setBranchPrompt("");
    setTitle("");
    setContent("");
    setVisibility(1);
    clearUploads();
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onError("");

    if (!trimmedContent) {
      onError("内容不能为空");
      return;
    }

    if (branchPrompt.length > MAX_BRANCH_PROMPT_LENGTH) {
      onError(`分支对话不能超过 ${MAX_BRANCH_PROMPT_LENGTH} 个字符`);
      return;
    }

    if (title.length > MAX_TITLE_LENGTH) {
      onError(`标题不能超过 ${MAX_TITLE_LENGTH} 个字符`);
      return;
    }

    if (content.length > MAX_CONTENT_LENGTH) {
      onError(`内容不能超过 ${MAX_CONTENT_LENGTH} 个字符`);
      return;
    }

    if (isUploading) {
      onError("图片还在上传，请稍后再提交");
      return;
    }

    setIsSubmitting(true);

    try {
      const mediaIds = uploads.flatMap((item) =>
        item.status === "done" && typeof item.mediaId === "number"
          ? [item.mediaId]
          : [],
      );

      await createBranchPost(parentPostId, {
        branchPrompt: trimmedBranchPrompt || undefined,
        title: trimmedTitle || undefined,
        content: trimmedContent,
        visibility,
        mediaIds,
      });
      resetForm();
      notify("分支创建成功", "success");
      onCreated?.();
    } catch (err) {
      if (!isAuthError(err)) {
        onError(getErrorMessage(err, "创建分支失败，请稍后重试"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form className="grid gap-4" onSubmit={handleSubmit}>
      <div className="rounded-md border border-line bg-soft p-3 text-xs leading-6 text-muted">
        <p>父帖子 ID：{parentPostId}</p>
        <p className="mt-1 break-words">
          父帖子标题：{parentTitle?.trim() || "未命名帖子"}
        </p>
      </div>

      <Input
        label="分支对话"
        value={branchPrompt}
        onChange={(event) => setBranchPrompt(event.target.value)}
        maxLength={MAX_BRANCH_PROMPT_LENGTH}
        placeholder="这条分支想从哪里继续"
      />

      <Input
        label="标题"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        maxLength={MAX_TITLE_LENGTH}
        placeholder="给分支起个名字"
      />

      <div>
        <span className="mb-2 block text-sm font-medium text-foreground">可见性</span>
        <div className="grid gap-3">
          {[
            { value: 1 as const, label: "公开", description: "进入公开内容流" },
            { value: 2 as const, label: "私密", description: "仅自己可见" },
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

      <label className="block" htmlFor={`branch-content-${parentPostId}`}>
        <span className="mb-2 block text-sm font-medium text-foreground">内容</span>
        <textarea
          id={`branch-content-${parentPostId}`}
          className="min-h-40 w-full resize-y rounded-md border border-line bg-soft px-3 py-3 text-sm leading-7 text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:bg-panel"
          value={content}
          onChange={(event) => setContent(event.target.value)}
          maxLength={MAX_CONTENT_LENGTH}
          placeholder="写下这个分支的正文"
          required
        />
      </label>

      <div>
        <span className="mb-2 block text-sm font-medium text-foreground">图片</span>
        <label
          className="flex min-h-24 cursor-pointer flex-col items-center justify-center rounded-md border border-dashed border-line bg-soft px-4 py-4 text-center transition hover:border-accent hover:bg-panel"
          htmlFor={`branch-images-${parentPostId}`}
        >
          <span className="text-sm font-medium text-foreground">选择图片上传</span>
          <span className="mt-2 text-xs leading-5 text-muted">
            上传成功后会随分支帖子一起提交
          </span>
          <input
            id={`branch-images-${parentPostId}`}
            className="sr-only"
            type="file"
            accept="image/*"
            multiple
            onChange={handleImageChange}
            disabled={isSubmitting}
          />
        </label>

        {uploads.length ? (
          <div className="mt-3 grid gap-3">
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
                        ? "已上传"
                        : item.error || "上传失败"}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <div className="border-t border-line pt-4">
        <div className="text-xs text-muted">
          分支对话 {branchPrompt.length}/{MAX_BRANCH_PROMPT_LENGTH}，标题 {title.length}/
          {MAX_TITLE_LENGTH}，正文 {content.length}/{MAX_CONTENT_LENGTH}
        </div>
        <Button
          type="submit"
          className="mt-3 w-full"
          disabled={isSubmitting || !canSubmit}
        >
          {isSubmitting ? "正在创建分支" : isUploading ? "图片上传中" : "创建分支"}
        </Button>
      </div>
    </form>
  );
}
