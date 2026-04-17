import { request } from "@/lib/http";

export type User = {
  uuid: string;
  nickname: string;
  email: string;
  status: number;
  createdAt: string;
};

export type Post = {
  id: number;
  userUuid: string;
  title?: string;
  content: string;
  visibility?: 1 | 2;
  createdAt?: string;
  createAt?: string;
};

export type PostListItem = {
  id: number;
  userUuid: string;
  nickname: string;
  title?: string;
  contentPreview?: string;
  createdAt: string;
};

export type PageResult<T> = {
  current: number;
  size: number;
  total: number;
  records: T[];
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
  visibility?: 1 | 2;
};

export function createPost(input: PostInput) {
  return request<number>("/posts", {
    method: "POST",
    body: input,
  });
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

  return request<PageResult<PostListItem>>(`/posts${query ? `?${query}` : ""}`);
}

export function getPost(postId: number | string) {
  return request<Post>(`/posts/${postId}`);
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
