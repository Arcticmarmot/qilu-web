import type { Post } from "@/lib/api";

const MY_POST_DETAIL_CACHE_PREFIX = "qilu.myPostDetail.";

type MyPostDetailCache = {
  posts: Post[];
};

function normalizePostId(value: number | string | undefined | null) {
  const postId = Number(value);

  if (!Number.isFinite(postId) || postId < 1) {
    return null;
  }

  return Math.floor(postId);
}

function getCacheKey(postId: number | string) {
  return `${MY_POST_DETAIL_CACHE_PREFIX}${postId}`;
}

export function cacheMyPostDetail(posts: Post[]) {
  if (typeof window === "undefined" || !posts.length) {
    return;
  }

  const payload = JSON.stringify({ posts } satisfies MyPostDetailCache);

  posts.forEach((post) => {
    window.sessionStorage.setItem(getCacheKey(post.id), payload);
  });
}

export function selectMyPostDetail(postId: number | string | undefined | null) {
  if (typeof window === "undefined") {
    return null;
  }

  const normalizedPostId = normalizePostId(postId);

  if (normalizedPostId == null) {
    return null;
  }

  const raw = window.sessionStorage.getItem(getCacheKey(normalizedPostId));

  if (!raw) {
    return null;
  }

  try {
    const cached = JSON.parse(raw) as Partial<MyPostDetailCache>;
    const posts = Array.isArray(cached.posts) ? cached.posts : [];
    const post = posts.find((item) => item.id === normalizedPostId);

    return post ? { post, posts } : null;
  } catch {
    window.sessionStorage.removeItem(getCacheKey(normalizedPostId));
    return null;
  }
}
