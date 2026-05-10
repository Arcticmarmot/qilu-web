"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import type { FormEvent, ReactNode } from "react";
import { AppHeader, PageLoading } from "@/components/product-shell";
import { cacheMyPostDetail } from "@/components/posts/my-post-detail-cache";
import {
  formatDate,
  getPostTime,
  getVisibilityLabel,
} from "@/components/posts/post-utils";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { useToast, useToastMessage } from "@/components/ui/toast";
import {
  getMyPostDetailList,
  getMyPostPage,
  updatePostParent,
  type Post,
} from "@/lib/api";
import { cx } from "@/lib/cx";
import { getErrorMessage, isAuthError } from "@/lib/error";
import { useCurrentUser } from "@/lib/use-current-user";

const ROOT_VALUE = "__root__";
const TREE_PAGE_SIZE = 100;
const MAX_BRANCH_PROMPT_LENGTH = 128;

type TreePostNode = Post & {
  children: TreePostNode[];
};

type ParentOption = {
  post: Post;
  depth: number;
};

function readPostId(value: string | null) {
  const postId = Number(value);

  if (!Number.isFinite(postId) || postId < 1) {
    return null;
  }

  return Math.floor(postId);
}

function getPostLabel(post: Post) {
  return post.title?.trim() || post.branchPrompt?.trim() || `帖子 #${post.id}`;
}

function getPostStamp(post: Post) {
  const time = new Date(getPostTime(post)).getTime();

  return Number.isNaN(time) ? 0 : time;
}

function sortPosts(left: Post, right: Post) {
  const leftTime = getPostStamp(left);
  const rightTime = getPostStamp(right);

  if (leftTime !== rightTime) {
    return leftTime - rightTime;
  }

  return left.id - right.id;
}

function getValidParentId(post: Post, postMap: Map<number, Post>) {
  if (post.parentId == null || post.parentId === post.id) {
    return null;
  }

  return postMap.has(post.parentId) ? post.parentId : null;
}

function buildChildMap(posts: Post[]) {
  const postMap = new Map(posts.map((post) => [post.id, post]));
  const childMap = new Map<number | null, Post[]>();

  posts.forEach((post) => {
    const parentId = getValidParentId(post, postMap);
    const children = childMap.get(parentId) ?? [];
    children.push(post);
    childMap.set(parentId, children);
  });

  childMap.forEach((children) => {
    children.sort(sortPosts);
  });

  return childMap;
}

function buildForest(posts: Post[]) {
  const childMap = buildChildMap(posts);
  const visited = new Set<number>();

  const makeNode = (post: Post, stack: Set<number>): TreePostNode => {
    visited.add(post.id);

    if (stack.has(post.id)) {
      return { ...post, children: [] };
    }

    const nextStack = new Set(stack);
    nextStack.add(post.id);
    const children = (childMap.get(post.id) ?? [])
      .filter((child) => !nextStack.has(child.id))
      .map((child) => makeNode(child, nextStack));

    return { ...post, children };
  };

  const roots = (childMap.get(null) ?? []).map((post) => makeNode(post, new Set()));

  posts
    .slice()
    .sort(sortPosts)
    .forEach((post) => {
      if (!visited.has(post.id)) {
        roots.push(makeNode(post, new Set()));
      }
    });

  return roots;
}

function flattenForest(nodes: TreePostNode[], depth = 0): ParentOption[] {
  return nodes.flatMap((node) => [
    { post: node, depth },
    ...flattenForest(node.children, depth + 1),
  ]);
}

function getDescendantIds(posts: Post[], postId: number) {
  const childMap = buildChildMap(posts);
  const descendantIds = new Set<number>();

  const walk = (parentId: number) => {
    (childMap.get(parentId) ?? []).forEach((child) => {
      if (descendantIds.has(child.id)) {
        return;
      }

      descendantIds.add(child.id);
      walk(child.id);
    });
  };

  walk(postId);

  return descendantIds;
}

async function loadAllMyPostDetails() {
  const firstPage = await getMyPostPage({ current: 1, size: TREE_PAGE_SIZE });
  const totalPages = Math.max(1, Math.ceil(firstPage.total / TREE_PAGE_SIZE));
  const pages = [firstPage];

  if (totalPages > 1) {
    const restPages = await Promise.all(
      Array.from({ length: totalPages - 1 }, (_, index) =>
        getMyPostPage({ current: index + 2, size: TREE_PAGE_SIZE }),
      ),
    );
    pages.push(...restPages);
  }

  const entryIds = Array.from(
    new Set(pages.flatMap((page) => page.records.map((post) => post.id))),
  );
  const postMap = new Map<number, Post>();

  for (const entryId of entryIds) {
    if (postMap.has(entryId)) {
      continue;
    }

    const details = await getMyPostDetailList(entryId);
    details.forEach((post) => {
      postMap.set(post.id, post);
    });
  }

  const posts = Array.from(postMap.values()).sort(sortPosts);
  cacheMyPostDetail(posts);

  return posts;
}

function buildOptionLabel(option: ParentOption) {
  const indent = "  ".repeat(option.depth);
  const prefix = option.depth > 0 ? "- " : "";

  return `${indent}${prefix}${getPostLabel(option.post)} (#${option.post.id})`;
}

function TreeNodeCard({
  node,
  depth,
  selectedPostId,
  onSelect,
  renderControls,
}: {
  node: TreePostNode;
  depth: number;
  selectedPostId: number | null;
  onSelect: (postId: number) => void;
  renderControls: (node: TreePostNode) => ReactNode;
}) {
  const isSelected = selectedPostId === node.id;
  const isRoot = node.parentId == null;

  return (
    <div className={cx(depth > 0 ? "ml-5 border-l border-line pl-4" : "")}>
      <button
        type="button"
        className={cx(
          "group w-full rounded-md border p-4 text-left transition",
          isSelected
            ? "border-accent bg-panel"
            : "border-line bg-soft hover:border-accent",
        )}
        onClick={() => onSelect(node.id)}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="break-words text-base font-semibold leading-6 text-foreground group-hover:text-accent">
              {getPostLabel(node)}
            </p>
            <p className="mt-2 break-words text-sm leading-6 text-muted">
              {isRoot ? "根节点" : node.branchPrompt?.trim() || "未填写分支对话"}
            </p>
          </div>
          <span className="shrink-0 rounded-md border border-line bg-background px-2 py-1 text-xs text-muted">
            #{node.id}
          </span>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-muted">
          <span>{getVisibilityLabel(node.visibility)}</span>
          <span>子节点 {node.children.length}</span>
          <span>{formatDate(getPostTime(node))}</span>
        </div>
      </button>

      {isSelected ? renderControls(node) : null}

      {node.children.length ? (
        <div className="mt-3 grid gap-3">
          {node.children.map((child) => (
            <TreeNodeCard
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedPostId={selectedPostId}
              onSelect={onSelect}
              renderControls={renderControls}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}

function PostTreeEditorContent() {
  const searchParams = useSearchParams();
  const requestedPostId = readPostId(searchParams.get("postId"));
  const { error: userError, isLoading: isUserLoading } = useCurrentUser();
  const notify = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPostId, setSelectedPostId] = useState<number | null>(null);
  const [targetParentValue, setTargetParentValue] = useState(ROOT_VALUE);
  const [branchPrompt, setBranchPrompt] = useState("");
  const [error, setError] = useState("");
  const [isLoadingTrees, setIsLoadingTrees] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useToastMessage(error || userError, "error");

  const loadTrees = useCallback(async (preferredPostId?: number | null) => {
    setIsLoadingTrees(true);
    setError("");

    try {
      const nextPosts = await loadAllMyPostDetails();
      setPosts(nextPosts);
      setSelectedPostId((current) => {
        const preferred = preferredPostId ?? current;

        if (preferred && nextPosts.some((post) => post.id === preferred)) {
          return preferred;
        }

        return nextPosts[0]?.id ?? null;
      });
    } catch (err) {
      if (!isAuthError(err)) {
        setError(getErrorMessage(err, "树结构加载失败"));
      }
    } finally {
      setIsLoadingTrees(false);
    }
  }, []);

  useEffect(() => {
    if (!isUserLoading) {
      void loadTrees(requestedPostId);
    }
  }, [isUserLoading, loadTrees, requestedPostId]);

  const forest = useMemo(() => buildForest(posts), [posts]);
  const parentOptions = useMemo(() => flattenForest(forest), [forest]);
  const selectedPost = useMemo(
    () => posts.find((post) => post.id === selectedPostId) ?? null,
    [posts, selectedPostId],
  );
  const invalidParentIds = useMemo(() => {
    if (!selectedPost) {
      return new Set<number>();
    }

    return new Set([
      selectedPost.id,
      ...Array.from(getDescendantIds(posts, selectedPost.id)),
    ]);
  }, [posts, selectedPost]);
  const targetParentPost = useMemo(() => {
    const targetParentId = Number(targetParentValue);

    if (targetParentValue === ROOT_VALUE || !Number.isFinite(targetParentId)) {
      return null;
    }

    return posts.find((post) => post.id === targetParentId) ?? null;
  }, [posts, targetParentValue]);

  useEffect(() => {
    if (!selectedPost) {
      setTargetParentValue(ROOT_VALUE);
      setBranchPrompt("");
      return;
    }

    setTargetParentValue(
      selectedPost.parentId == null ? ROOT_VALUE : String(selectedPost.parentId),
    );
    setBranchPrompt(selectedPost.branchPrompt ?? "");
  }, [selectedPost]);

  const handleTreeSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError("");

    if (!selectedPost) {
      setError("请先选择帖子节点");
      return;
    }

    let nextParentId: number | null = null;

    if (targetParentValue !== ROOT_VALUE) {
      const parsedParentId = Number(targetParentValue);

      if (!Number.isFinite(parsedParentId) || invalidParentIds.has(parsedParentId)) {
        setError("不能迁移到当前节点或它的子节点下");
        return;
      }

      nextParentId = parsedParentId;
    }

    const trimmedBranchPrompt = branchPrompt.trim();

    if (nextParentId != null && !trimmedBranchPrompt) {
      setError("迁移到父节点下时需要填写分支对话");
      return;
    }

    if (branchPrompt.length > MAX_BRANCH_PROMPT_LENGTH) {
      setError(`分支对话不能超过 ${MAX_BRANCH_PROMPT_LENGTH} 个字符`);
      return;
    }

    setIsSaving(true);

    try {
      await updatePostParent(
        selectedPost.id,
        nextParentId == null
          ? { parentId: null }
          : { parentId: nextParentId, branchPrompt: trimmedBranchPrompt },
      );
      notify("树结构已更新", "success");
      await loadTrees(selectedPost.id);
    } catch (err) {
      if (!isAuthError(err)) {
        setError(getErrorMessage(err, "更新树结构失败，请稍后重试"));
      }
    } finally {
      setIsSaving(false);
    }
  };

  const renderMoveControls = (node: TreePostNode) => (
    <form
      className="mt-3 rounded-md border border-accent bg-panel p-4 shadow-subtle"
      onSubmit={handleTreeSubmit}
    >
      <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <label className="block" htmlFor={`parent-${node.id}`}>
          <span className="mb-2 block text-sm font-medium text-foreground">
            迁移到
          </span>
          <select
            id={`parent-${node.id}`}
            className="h-11 w-full rounded-md border border-line bg-soft px-3 text-sm text-foreground outline-none transition focus:border-accent focus:bg-panel"
            value={targetParentValue}
            onChange={(event) => setTargetParentValue(event.target.value)}
          >
            <option value={ROOT_VALUE}>独立为根节点</option>
            {parentOptions.map((option) => (
              <option
                key={option.post.id}
                value={option.post.id}
                disabled={invalidParentIds.has(option.post.id)}
              >
                {buildOptionLabel(option)}
              </option>
            ))}
          </select>
        </label>

        <Input
          id={`branch-prompt-${node.id}`}
          label="分支对话"
          value={branchPrompt}
          onChange={(event) => setBranchPrompt(event.target.value)}
          maxLength={MAX_BRANCH_PROMPT_LENGTH}
          placeholder="挂到父节点下时填写"
          disabled={targetParentValue === ROOT_VALUE}
        />
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="text-xs leading-5 text-muted">
          {targetParentPost
            ? `新父节点：${getPostLabel(targetParentPost)}`
            : "保存后该帖子会成为根节点。"}
          <span className="ml-2">
            分支对话 {branchPrompt.length}/{MAX_BRANCH_PROMPT_LENGTH}
          </span>
        </div>
        <div className="flex gap-3">
          <Button
            type="button"
            variant="secondary"
            disabled={isSaving}
            onClick={() => {
              setTargetParentValue(
                node.parentId == null ? ROOT_VALUE : String(node.parentId),
              );
              setBranchPrompt(node.branchPrompt ?? "");
            }}
          >
            还原
          </Button>
          <Button type="submit" disabled={isSaving}>
            {isSaving ? "正在更新" : "更新结构"}
          </Button>
        </div>
      </div>
    </form>
  );

  if (isUserLoading || isLoadingTrees) {
    return <PageLoading />;
  }

  return (
    <main className="min-h-screen bg-background text-foreground">
      <AppHeader />

      <div className="mx-auto grid max-w-7xl gap-5 px-5 pb-6 pt-6 sm:px-8 lg:grid-cols-[minmax(0,1fr)_340px]">
        <section className="min-w-0">
          <div className="mb-5 flex flex-col justify-between gap-4 rounded-md border border-line bg-panel p-5 shadow-subtle sm:flex-row sm:items-center">
            <div>
              <p className="text-xs tracking-[0.24em] text-accent">内容结构</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-tight">
                帖子树结构
              </h1>
              <p className="mt-3 text-sm leading-7 text-muted">
                共 {posts.length} 个节点，{forest.length} 棵根树。
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button
                type="button"
                variant="secondary"
                disabled={isSaving}
                onClick={() => void loadTrees(selectedPostId)}
              >
                刷新
              </Button>
              <Link
                href="/profile?tab=posts"
                className="inline-flex h-11 items-center justify-center rounded-md border border-line px-5 text-sm font-medium text-foreground transition hover:border-accent hover:text-accent"
              >
                返回我的帖子
              </Link>
            </div>
          </div>

          {forest.length ? (
            <div className="grid gap-3 rounded-md border border-line bg-panel p-4 shadow-subtle sm:p-5">
              {forest.map((node) => (
                <TreeNodeCard
                  key={node.id}
                  node={node}
                  depth={0}
                  selectedPostId={selectedPostId}
                  onSelect={setSelectedPostId}
                  renderControls={renderMoveControls}
                />
              ))}
            </div>
          ) : (
            <EmptyState
              title="还没有帖子"
              description="发布帖子后，可以在这里调整根节点与分支节点关系。"
            />
          )}
        </section>

        <aside className="space-y-4 lg:sticky lg:top-20 lg:h-fit">
          <div className="rounded-md border border-line bg-panel p-5 shadow-subtle">
            <p className="text-xs tracking-[0.24em] text-muted">当前节点</p>
            {selectedPost ? (
              <div className="mt-4 grid gap-3 text-sm leading-6">
                <div className="rounded-md border border-line bg-soft p-3">
                  <p className="break-words font-medium text-foreground">
                    {getPostLabel(selectedPost)}
                  </p>
                  <p className="mt-2 text-xs text-muted">#{selectedPost.id}</p>
                </div>
                <p className="text-muted">
                  当前父节点：
                  {selectedPost.parentId == null ? "根节点" : `#${selectedPost.parentId}`}
                </p>
                <p className="text-muted">
                  分支对话：{selectedPost.branchPrompt?.trim() || "未填写"}
                </p>
                <Link
                  href={`/posts/me/${selectedPost.id}`}
                  className="inline-flex h-10 items-center justify-center rounded-md border border-line px-4 text-sm text-foreground transition hover:border-accent hover:text-accent"
                >
                  查看详情
                </Link>
              </div>
            ) : (
              <p className="mt-4 text-sm leading-7 text-muted">暂无选中节点。</p>
            )}
          </div>

          <div className="rounded-md border border-line bg-panel p-5 shadow-subtle">
            <p className="text-xs tracking-[0.24em] text-muted">迁移规则</p>
            <div className="mt-4 grid gap-3 text-sm leading-7 text-muted">
              <p>选择“独立为根节点”时会发送空父节点。</p>
              <p>迁移到父节点下时需要填写分支对话。</p>
              <p>下拉菜单会排除当前节点和它的子节点。</p>
            </div>
          </div>
        </aside>
      </div>
    </main>
  );
}

export default function PostTreeEditorPage() {
  return (
    <Suspense fallback={<PageLoading />}>
      <PostTreeEditorContent />
    </Suspense>
  );
}
