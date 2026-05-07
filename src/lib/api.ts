import { request } from "@/lib/http";

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
  content: string;
  visibility?: 1 | 2;
  likeCount?: number;
  likedByMe?: boolean;
  createdAt?: string;
  createAt?: string;
};

export type PostListItem = {
  id: number;
  userUuid: string;
  nickname: string;
  title?: string;
  contentSnippet?: string;
  contentPreview?: string;
  visibility?: 1 | 2;
  likeCount: number;
  likedByMe: boolean;
  commentCount: number;
  createdAt: string;
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
  content: string;
  visibility: 1 | 2;
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

export async function createPost(input: PostInput) {
  const data = await request<number | string | null>("/posts", {
    method: "POST",
    body: input,
  });

  return normalizePostId(data);
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
  range?: string;
  current?: number;
  size?: number;
} = {}) {
  const params = new URLSearchParams();

  if (input.range) {
    params.set("range", input.range);
  }

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

export function getPost(postId: number | string) {
  return request<Post>(`/posts/${postId}`);
}

export function getMyPost(postId: number | string) {
  return request<Post>(`/posts/me/${postId}`);
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
