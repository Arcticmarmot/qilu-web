import { request, requestForm } from "@/lib/http";

export type User = {
  uuid: string;
  nickname: string;
  email: string;
  status: number;
  createAt?: string;
  createdAt?: string;
};

export type Post = {
  id: number;
  userUuid: string;
  nickname?: string;
  title?: string;
  branchPrompt?: string;
  parentId?: number | null;
  rootId?: number | null;
  mediaList?: PostMedia[];
  content: string;
  visibility?: 1 | 2;
  likeCount?: number;
  likedByMe?: boolean;
  createdAt?: string;
  createAt?: string;
};

type RawPost = Post & {
  branch_prompt?: string;
  parent_id?: number | string | null;
  root_id?: number | string | null;
  media_list?: RawPostMedia[];
  likeByMe?: boolean;
};

type RawPostMedia = PostMedia & {
  media_id?: number;
  sort_order?: number;
};

export type PostListItem = {
  id: number;
  userUuid: string;
  nickname: string;
  title?: string;
  coverUrl?: string;
  contentSnippet?: string;
  contentPreview?: string;
  visibility?: 1 | 2;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  createdAt: string;
};

export type PostMedia = {
  postId?: number;
  mediaId: number;
  url: string;
  sortOrder?: number;
};

export type PostComment = {
  id: number;
  postId: number;
  userUuid: string;
  nickname?: string;
  content: string;
  likeCount?: number;
  likedByMe?: boolean;
  replyCount?: number;
  createdAt?: string;
};

export type CommentReply = {
  id: number;
  rootCommentId: number;
  parentReplyId?: number | null;
  userUuid: string;
  nickname?: string;
  targetUserUuid?: string;
  targetNickname?: string;
  content: string;
  likeCount?: number;
  likedByMe?: boolean;
  createdAt?: string;
};

type LikeStatePayload = {
  likedByMe?: boolean;
  likeByMe?: boolean;
};

export type PageResult<T> = {
  current: number;
  size: number;
  total: number;
  records: T[];
};

export type NotificationListItem = {
  id: number;
  commentId?: number;
  replyId?: number;
  actorUuid: string;
  actorNickname?: string;
  postId?: number;
  creationType?: string;
  creationId?: number;
  creationSnippet?: string;
  postSnippet?: string;
  contentSnippet?: string;
  entityType?: string;
  entityId?: number;
  entityPreview?: string;
  entitySnippet?: string;
  contentPreview?: string;
  isRead: 0 | 1;
  createdAt?: string;
};

type LoginResponse = {
  token: string;
  uuid: string;
  nickname: string;
  email: string;
};

export function registerUser(input: {
  nickname: string;
  email: string;
  password: string;
}) {
  return request<User>("/users", {
    method: "POST",
    body: input,
    auth: false,
  });
}

export function login(input: { email: string; password: string }) {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: input,
    auth: false,
  });
}

export function getCurrentUser() {
  return request<User>("/users/me");
}

export type PostInput = {
  title?: string;
  branchPrompt?: string;
  content: string;
  visibility?: 1 | 2;
  mediaIds?: number[];
};

export type BranchPostInput = {
  branchPrompt?: string;
  title?: string;
  content: string;
  mediaIds?: number[];
};

export type PostParentUpdateInput = {
  parentId?: number | null;
  branchPrompt?: string;
};

export type MediaUpload = {
  mediaId: number;
  objectKey: string;
  url: string;
  originalFilename: string;
  contentType: string;
  size: number;
};

function normalizePostId(value: unknown) {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string" && value.trim()) {
    const parsed = Number(value);
    if (Number.isFinite(parsed)) {
      return parsed;
    }
  }

  return null;
}

function normalizeOptionalPostId(value: unknown) {
  if (value == null) {
    return null;
  }

  return normalizePostId(value);
}

function normalizeLikedState<T extends LikeStatePayload>(value: T) {
  return {
    ...value,
    likedByMe: value.likedByMe ?? value.likeByMe ?? false,
  };
}

function normalizePostListItem<T extends PostListItem>(value: T) {
  return {
    ...normalizeLikedState(value),
    contentSnippet: value.contentSnippet ?? value.contentPreview ?? "",
  };
}

function normalizePostMedia(value: RawPostMedia): PostMedia {
  return {
    ...value,
    mediaId: value.mediaId ?? value.media_id ?? 0,
    sortOrder: value.sortOrder ?? value.sort_order,
  };
}

function normalizePost<T extends Post>(value: T) {
  const raw = value as RawPost;
  const mediaList = raw.mediaList ?? raw.media_list ?? [];

  return {
    ...normalizeLikedState(value),
    branchPrompt: raw.branchPrompt ?? raw.branch_prompt,
    parentId: normalizeOptionalPostId(raw.parentId ?? raw.parent_id),
    rootId: normalizeOptionalPostId(raw.rootId ?? raw.root_id),
    mediaList: mediaList.map((item) => normalizePostMedia(item)).sort((left, right) => {
      const leftOrder = left.sortOrder ?? Number.MAX_SAFE_INTEGER;
      const rightOrder = right.sortOrder ?? Number.MAX_SAFE_INTEGER;

      if (leftOrder !== rightOrder) {
        return leftOrder - rightOrder;
      }

      return left.mediaId - right.mediaId;
    }),
  };
}

function normalizePostDetailList(value: Post | Post[]) {
  const posts = Array.isArray(value) ? value : [value];

  return posts.map((post) => normalizePost(post));
}

export function getRootPost(posts: Post[], requestedPostId?: number | string) {
  const requestedId = normalizePostId(requestedPostId);

  return (
    posts.find(
      (post) =>
        post.parentId == null &&
        post.rootId != null &&
        post.id === post.rootId,
    ) ??
    posts.find((post) => post.parentId == null) ??
    posts.find((post) => requestedId != null && post.id === requestedId) ??
    posts[0] ??
    null
  );
}

function getRequestedPost(posts: Post[], requestedPostId: number | string) {
  const requestedId = normalizePostId(requestedPostId);

  return (
    posts.find((post) => requestedId != null && post.id === requestedId) ??
    getRootPost(posts, requestedPostId)
  );
}

export async function createPost(input: PostInput) {
  const data = await request<number | string | null>("/posts", {
    method: "POST",
    body: input,
  });

  return normalizePostId(data);
}

export function createBranchPost(
  postId: number | string,
  input: BranchPostInput,
) {
  return request<null>(`/posts/${postId}/branches`, {
    method: "POST",
    body: input,
  });
}

export function uploadPostImage(file: File) {
  const formData = new FormData();
  formData.set("file", file);

  return requestForm<MediaUpload>("/media/images", formData);
}

export function getPostPage(input: { current?: number; size?: number } = {}) {
  const params = new URLSearchParams();

  if (input.current) {
    params.set("current", String(input.current));
  }

  if (input.size) {
    params.set("size", String(input.size));
  }

  const query = params.toString();

  return request<PageResult<PostListItem>>(`/posts${query ? `?${query}` : ""}`).then(
    (page) => ({
      ...page,
      records: page.records.map((post) => normalizePostListItem(post)),
    }),
  );
}

export function getHotPostList(input: {
  current?: number;
  size?: number;
} = {}) {
  const params = new URLSearchParams();

  if (input.current) {
    params.set("current", String(input.current));
  }

  if (input.size) {
    params.set("size", String(input.size));
  }

  const query = params.toString();

  return request<PostListItem[]>(`/hot/posts${query ? `?${query}` : ""}`).then((posts) =>
    posts.map((post) => normalizePostListItem(post)),
  );
}

export function searchPosts(keyword: string) {
  const normalizedKeyword = keyword.trim();

  if (!normalizedKeyword) {
    return Promise.resolve([]);
  }

  const params = new URLSearchParams({ keyword: normalizedKeyword });

  return request<PostListItem[]>(`/search/posts?${params.toString()}`).then((posts) =>
    posts.map((post) => normalizePostListItem(post)),
  );
}

export function getMyPostPage(input: { current?: number; size?: number } = {}) {
  const params = new URLSearchParams();

  if (input.current) {
    params.set("current", String(input.current));
  }

  if (input.size) {
    params.set("size", String(input.size));
  }

  const query = params.toString();

  return request<PageResult<PostListItem>>(
    `/posts/me${query ? `?${query}` : ""}`,
  ).then((page) => ({
    ...page,
    records: page.records.map((post) => normalizePostListItem(post)),
  }));
}

export function getPostDetailList(postId: number | string) {
  return request<Post | Post[]>(`/posts/${postId}`).then((post) =>
    normalizePostDetailList(post),
  );
}

export function getMyPostDetailList(postId: number | string) {
  return request<Post | Post[]>(`/posts/me/${postId}`).then((post) =>
    normalizePostDetailList(post),
  );
}

export function getPost(postId: number | string) {
  return getPostDetailList(postId).then((posts) => getRequestedPost(posts, postId));
}

export function getMyPost(postId: number | string) {
  return getMyPostDetailList(postId).then((posts) => getRequestedPost(posts, postId));
}

export function likePost(postId: number | string) {
  return request<null>(`/posts/${postId}/likes`, {
    method: "POST",
  });
}

export function unlikePost(postId: number | string) {
  return request<null>(`/posts/${postId}/likes`, {
    method: "DELETE",
  });
}

export function updatePost(postId: number | string, input: PostInput) {
  return request<null>(`/posts/${postId}`, {
    method: "PUT",
    body: input,
  });
}

export function updatePostParent(
  postId: number | string,
  input: PostParentUpdateInput,
) {
  return request<null>(`/posts/${postId}/parent`, {
    method: "PUT",
    body: input,
  });
}

export function deletePost(postId: number | string) {
  return request<null>(`/posts/${postId}`, {
    method: "DELETE",
  });
}

export function getPostComments(postId: number | string) {
  return request<PostComment[]>(`/posts/${postId}/comments`).then((comments) =>
    comments.map((comment) => normalizeLikedState(comment)),
  );
}

export function createPostComment(postId: number | string, input: { content: string }) {
  return request<null>(`/posts/${postId}/comments`, {
    method: "POST",
    body: input,
  });
}

export function deletePostComment(
  postId: number | string,
  commentId: number | string,
) {
  return request<null>(`/posts/${postId}/comments/${commentId}`, {
    method: "DELETE",
  });
}

export function likeComment(
  postId: number | string,
  commentId: number | string,
) {
  return request<null>(`/posts/${postId}/comments/${commentId}/likes`, {
    method: "POST",
  });
}

export function unlikeComment(
  postId: number | string,
  commentId: number | string,
) {
  return request<null>(`/posts/${postId}/comments/${commentId}/likes`, {
    method: "DELETE",
  });
}

export function getCommentReplies(
  postId: number | string,
  rootCommentId: number | string,
) {
  return request<CommentReply[]>(
    `/posts/${postId}/comments/${rootCommentId}/replies`,
  ).then((replies) => replies.map((reply) => normalizeLikedState(reply)));
}

export function createCommentReply(
  postId: number | string,
  rootCommentId: number | string,
  input: { parentReplyId: number | string | null; content: string },
) {
  return request<null>(`/posts/${postId}/comments/${rootCommentId}/replies`, {
    method: "POST",
    body: input,
  });
}

export function deleteCommentReply(
  postId: number | string,
  rootCommentId: number | string,
  replyId: number | string,
) {
  return request<null>(
    `/posts/${postId}/comments/${rootCommentId}/replies/${replyId}`,
    {
      method: "DELETE",
    },
  );
}

export function likeCommentReply(
  postId: number | string,
  rootCommentId: number | string,
  replyId: number | string,
) {
  return request<null>(
    `/posts/${postId}/comments/${rootCommentId}/replies/${replyId}/likes`,
    {
      method: "POST",
    },
  );
}

export function unlikeCommentReply(
  postId: number | string,
  rootCommentId: number | string,
  replyId: number | string,
) {
  return request<null>(
    `/posts/${postId}/comments/${rootCommentId}/replies/${replyId}/likes`,
    {
      method: "DELETE",
    },
  );
}

export function getLikeNotifications() {
  return request<NotificationListItem[]>("/like-notifications");
}

export function getUnreadLikeNotificationCount() {
  return request<number>("/like-notifications/unread-count");
}

export function markLikeNotificationsReadAll() {
  return request<null>("/like-notifications/read-all", {
    method: "PATCH",
  });
}

export function getCommentNotifications() {
  return request<NotificationListItem[]>("/comment-notifications");
}

export function getUnreadCommentNotificationCount() {
  return request<number>("/comment-notifications/unread-count");
}

export function markCommentNotificationsReadAll() {
  return request<null>("/comment-notifications/read-all", {
    method: "PATCH",
  });
}

export function getReplyNotifications() {
  return request<NotificationListItem[]>("/reply-notifications");
}

export function getUnreadReplyNotificationCount() {
  return request<number>("/reply-notifications/unread-count");
}

export function markReplyNotificationsReadAll() {
  return request<null>("/reply-notifications/read-all", {
    method: "PATCH",
  });
}

export type VoucherInput = {
  title: string;
  description: string;
};

export type VoucherSeckillInput = {
  voucherId: number;
  totalStock: number;
  startTime: string;
  endTime: string;
  redeemDeadline: string;
};

export type VoucherSeckill = {
  seckillId: number;
  voucherId: number;
  title: string;
  description?: string;
  totalStock: number;
  remainingStock: number;
  startTime?: string;
  endTime?: string;
  status?: number;
};

export type VoucherSeckillOrderResult = {
  status: string;
  orderNo?: string;
};

export type VoucherOrder = {
  orderNo: string;
  voucherId: number;
  seckillId: number;
  title: string;
  description?: string;
  redeemCode?: string;
  status: 1 | 2 | 3 | 4 | number;
  expireAt?: string;
  usedAt?: string;
  createdAt?: string;
};

export function getVoucherSeckills() {
  return request<VoucherSeckill[]>("/voucher-seckills");
}

export function getVoucherSeckillDetail(seckillId: number | string) {
  return request<VoucherSeckill>(`/voucher-seckills/${seckillId}`);
}

export function seckillVoucher(seckillId: number) {
  return request<VoucherSeckillOrderResult>(
    `/voucher-seckills/${seckillId}/orders`,
    {
      method: "POST",
    },
  );
}

export function getSeckillOrderResult(seckillId: number | string) {
  return request<VoucherSeckillOrderResult>(
    `/voucher-seckills/${seckillId}/orders/result`,
  );
}

export function getMyVoucherOrders() {
  return request<VoucherOrder[]>("/voucher-orders/me");
}

export function getVoucherOrderDetail(orderNo: string) {
  return request<VoucherOrder>(
    `/voucher-orders/${encodeURIComponent(orderNo)}`,
  );
}

export function createVoucher(input: VoucherInput) {
  return request<unknown>("/admin/vouchers", {
    method: "POST",
    body: input,
  });
}

export function createVoucherSeckill(input: VoucherSeckillInput) {
  return request<unknown>("/admin/voucher-seckills", {
    method: "POST",
    body: input,
  });
}

export function preheatVoucherSeckill(seckillId: number) {
  return request<unknown>(`/admin/voucher-seckills/${seckillId}/preheat`, {
    method: "POST",
  });
}

export function redeemVoucherOrder(redeemCode: string) {
  return request<unknown>("/admin/voucher-orders/redeem", {
    method: "PATCH",
    body: { redeemCode },
  });
}
