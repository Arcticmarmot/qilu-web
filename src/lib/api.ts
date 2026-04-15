import { getToken } from "@/lib/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:3000";

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

export type User = {
  uuid: string;
  nickname: string;
  email: string;
  status: number;
  createdAt: string;
};

type LoginResponse = {
  token: string;
  uuid: string;
  nickname: string;
  email: string;
};

type RequestOptions = RequestInit & {
  auth?: boolean;
};

async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const headers = new Headers(options.headers);
  headers.set("Accept", "application/json");

  if (options.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  if (options.auth) {
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });

  let payload: ApiResponse<T> | null = null;

  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    throw new Error("服务响应格式异常");
  }

  if (!response.ok || payload.code !== 200) {
    throw new Error(payload.message || "请求失败");
  }

  return payload.data;
}

export function registerUser(input: {
  nickname: string;
  email: string;
  password: string;
}) {
  return apiRequest<User>("/users", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function login(input: { email: string; password: string }) {
  return apiRequest<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function getCurrentUser() {
  return apiRequest<User>("/users/me", {
    method: "GET",
    auth: true,
  });
}
