import { clearToken, getToken } from "@/lib/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost:8080";
const REQUEST_TIMEOUT_MS = 12000;

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

export async function request<T>(path: string, options: RequestOptions = {}) {
  const { method = "GET", body, auth = true } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    const headers = new Headers({
      Accept: "application/json",
      "Content-Type": "application/json",
    });

    // 公开接口显式关闭鉴权，其余请求统一携带本地 JWT。
    if (auth) {
      const token = getToken();
      if (token) {
        headers.set("Authorization", `Bearer ${token}`);
      }
    }

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    if (response.status === 401) {
      clearToken();
    }

    const text = await response.text();

    if (!text.trim()) {
      if (!response.ok) {
        throw new Error("请求失败");
      }

      return null as T;
    }

    const payload = JSON.parse(text) as ApiResponse<T> | T;

    // 兼容两种响应结构：
    // 1) 统一包裹：{ code, message, data }
    // 2) 直接返回业务数据：T
    if (
      payload &&
      typeof payload === "object" &&
      "code" in payload &&
      "message" in payload &&
      "data" in payload
    ) {
      const wrapped = payload as ApiResponse<T>;

      if (!response.ok || (wrapped.code !== 0 && wrapped.code !== 200)) {
        throw new Error(wrapped.message || "请求失败");
      }

      return wrapped.data;
    }

    if (!response.ok) {
      throw new Error("请求失败");
    }

    return payload as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error("请求超时，请稍后重试");
    }

    if (error instanceof Error) {
      throw error;
    }

    throw new Error("网络异常，请稍后重试");
  } finally {
    clearTimeout(timeoutId);
  }
}
