"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useCallback, useEffect, useState } from "react";
import { AppHeader, PageLoading } from "@/components/product-shell";
import {
  cacheMyPostDetail,
  selectMyPostDetail,
} from "@/components/posts/my-post-detail-cache";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast, useToastMessage } from "@/components/ui/toast";
import {
  updatePost,
  type Post,
} from "@/lib/api";
import { getErrorMessage, isAuthError } from "@/lib/error";
import { useCurrentUser } from "@/lib/use-current-user";

const MAX_BRANCH_PROMPT_LENGTH = 128;
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
  const notify = useToast();
  const [branchPrompt, setBranchPrompt] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [visibility, setVisibility] = useState<1 | 2>(1);
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [sourcePosts, setSourcePosts] = useState<Post[]>([]);
  const [error, setError] = useState("");
  const [isLoadingPost, setIsLoadingPost] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useToastMessage(error || userError, "error");

  const isBranchPost = editingPost?.parentId != null;
  const returnRootId =
    editingPost?.rootId ??
    sourcePosts.find((post) => post.parentId == null)?.id ??
    (editingPost?.parentId == null ? editingPost?.id : null);
  const returnHref =
    isBranchPost && returnRootId
      ? `/posts/me/${returnRootId}?selectedPostId=${editingPost?.id}`
      : `/posts/me/${postId}`;
  const trimmedBranchPrompt = branchPrompt.trim();
  const trimmedTitle = title.trim();
  const trimmedContent = content.trim();
  const canSubmit =
    trimmedContent.length > 0 &&
    (!isBranchPost ||
      (trimmedBranchPrompt.length > 0 &&
        branchPrompt.length <= MAX_BRANCH_PROMPT_LENGTH)) &&
    title.length <= MAX_TITLE_LENGTH &&
    content.length <= MAX_CONTENT_LENGTH;
  const loadPost = useCallback(async () => {
    if (!postId) {
      setError("帖子不存在");
      setIsLoadingPost(false);
      return;
    }

    setIsLoadingPost(true);
    setError("");

    const selected = selectMyPostDetail(postId);

    if (!selected) {
      setError("没有本地帖子详情数据，请先从我的帖子详情页进入编辑");
      setIsLoadingPost(false);
      return;
    }

    setEditingPost(selected.post);
    setSourcePosts(selected.posts);
    setBranchPrompt(selected.post.branchPrompt ?? "");
    setTitle(selected.post.title ?? "");
    setContent(selected.post.content);
    setVisibility(selected.post.visibility === 2 ? 2 : 1);
    setIsLoadingPost(false);
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

    if (!editingPost) {
      setError("没有可编辑的帖子数据");
      return;
    }

    if (!trimmedContent) {
      setError("内容不能为空");
      return;
    }

    if (isBranchPost && !trimmedBranchPrompt) {
      setError("分支对话不能为空");
      return;
    }

    if (isBranchPost && branchPrompt.length > MAX_BRANCH_PROMPT_LENGTH) {
      setError(`分支对话不能超过 ${MAX_BRANCH_PROMPT_LENGTH} 个字符`);
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
      if (isBranchPost) {
        await updatePost(postId, {
          branchPrompt: trimmedBranchPrompt || undefined,
          title: trimmedTitle || undefined,
          content: trimmedContent,
        });
      } else {
        await updatePost(postId, {
          branchPrompt: "",
          title: trimmedTitle || undefined,
          content: trimmedContent,
          visibility,
        });
      }

      if (editingPost) {
        const nextPosts = sourcePosts.map((post) =>
          post.id === editingPost.id
            ? {
                ...post,
                branchPrompt: isBranchPost
                  ? trimmedBranchPrompt || undefined
                  : "",
                title: trimmedTitle || undefined,
                content: trimmedContent,
                visibility: isBranchPost ? post.visibility : visibility,
              }
            : post,
        );
        cacheMyPostDetail(nextPosts);
      }

      notify("保存成功", "success");
      router.replace(returnHref);
    } catch (err) {
      if (!isAuthError(err)) {
        setError(getErrorMessage(err, "更新失败，请稍后重试"));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading || isLoadingPost) {
    return <PageLoading />;
  }

  if (!editingPost) {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <AppHeader />

        <div className="mx-auto max-w-3xl px-5 py-8 sm:px-8">
          <div className="rounded-md border border-line bg-panel p-6 shadow-subtle">
            <p className="text-sm tracking-[0.24em] text-danger">无法编辑</p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">
              未找到本地帖子详情
            </h1>
            <p className="mt-3 text-sm leading-7 text-muted">
              {error || "请先从我的帖子详情页进入编辑，使用已经加载好的帖子数组。"}
            </p>
            <div className="mt-5 flex flex-wrap gap-3">
              <Link
                href="/profile?tab=posts"
                className="inline-flex h-10 items-center justify-center rounded-md bg-foreground px-4 text-sm font-medium text-background transition hover:bg-accent-strong"
              >
                返回我的帖子
              </Link>
              <Link
                href="/posts/me/tree"
                className="inline-flex h-10 items-center justify-center rounded-md border border-line px-4 text-sm text-foreground transition hover:border-accent hover:text-accent"
              >
                打开树结构
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen overflow-hidden bg-background text-foreground">
      <AppHeader />

      <div className="mx-auto grid h-[calc(100vh-3.5rem)] max-w-7xl gap-5 overflow-hidden px-5 pb-4 pt-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0 overflow-y-auto pr-1">
          <form
            className="rounded-md border border-line bg-panel p-4 shadow-subtle sm:p-5"
            onSubmit={handleSubmit}
          >
            <p className="text-sm tracking-[0.24em] text-accent">
              {isBranchPost ? "编辑分支" : "编辑内容"}
            </p>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              {isBranchPost ? "编辑分支帖子" : "编辑帖子"}
            </h1>
            <p className="mt-3 text-sm leading-7 text-muted">
              {isBranchPost
                ? "分支帖子可以修改分支对话、标题和正文，不提交可见性。"
                : "只有自己的帖子可以在这里修改标题、正文和可见性。"}
            </p>

            <div className="mt-5 grid gap-4">
              {isBranchPost ? (
                <Input
                  label="分支对话"
                  value={branchPrompt}
                  onChange={(event) => setBranchPrompt(event.target.value)}
                  maxLength={MAX_BRANCH_PROMPT_LENGTH}
                  placeholder="这条分支想从哪里继续"
                  required
                />
              ) : null}

              <Input
                label="标题"
                value={title}
                onChange={(event) => setTitle(event.target.value)}
                maxLength={MAX_TITLE_LENGTH}
                placeholder="updated title"
              />

              {!isBranchPost ? (
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
              ) : null}

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
                  placeholder="updated content"
                  required
                />
              </label>
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
              <div className="text-xs text-muted">
                {isBranchPost
                  ? `分支对话 ${branchPrompt.length}/${MAX_BRANCH_PROMPT_LENGTH}，`
                  : ""}
                标题 {title.length}/{MAX_TITLE_LENGTH}，正文 {content.length}/
                {MAX_CONTENT_LENGTH}
              </div>
              <div className="flex gap-3">
                <Link
                  href={returnHref}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-line px-4 text-sm text-foreground transition hover:border-accent hover:text-accent"
                >
                  取消
                </Link>
                <Button type="submit" disabled={isSubmitting || !canSubmit}>
                  {isSubmitting ? "正在保存" : "保存修改"}
                </Button>
              </div>
            </div>

          </form>
        </section>

        <aside className="space-y-4 overflow-y-auto pr-1">
          <div className="rounded-md border border-line bg-panel p-5 shadow-subtle">
            <p className="text-xs tracking-[0.24em] text-muted">编辑限制</p>
            <div className="mt-4 grid gap-3 text-sm text-muted">
              {isBranchPost ? (
                <p>分支对话最多 {MAX_BRANCH_PROMPT_LENGTH} 个字符。</p>
              ) : null}
              <p>标题最多 {MAX_TITLE_LENGTH} 个字符。</p>
              <p>内容最多 {MAX_CONTENT_LENGTH} 个字符。</p>
              {isBranchPost ? (
                <p>分支更新会提交分支对话，不提交可见性。</p>
              ) : (
                <p>
                  根节点更新会提交可见性，分支对话保持为空。
                  {visibility === 1 ? "公开内容会进入列表。" : "当前选择为私密保存。"}
                </p>
              )}
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}
