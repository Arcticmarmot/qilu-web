import { getToken, notifyAuthInvalid } from "@/lib/auth";
import {
  API_SUCCESS_CODE,
  API_SYSTEM_ERROR_CODE,
  API_UNAUTHORIZED_CODE,
  ApiError,
  logErrorInDev,
} from "@/lib/error";

export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ??
  "http://localhost/api";
const REQUEST_TIMEOUT_MS = 12000;

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T | null;
};

type RequestOptions = {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  auth?: boolean;
};

async function parseApiResponse<T>(response: Response, auth: boolean) {
  const text = await response.text();

  if (!text.trim()) {
    throw new ApiError("响应解析失败，请稍后重试", {
      type: "parse",
    });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(text);
  } catch (error) {
    throw new ApiError("响应解析失败，请稍后重试", {
      type: "parse",
      cause: error,
    });
  }

  if (
    !payload ||
    typeof payload !== "object" ||
    !("code" in payload) ||
    !("message" in payload) ||
    !("data" in payload)
  ) {
    throw new ApiError("响应格式无效，请稍后重试", {
      type: "parse",
    });
  }

  const wrapped = payload as ApiResponse<T>;
  if (wrapped.code === API_SUCCESS_CODE) {
    return wrapped.data as T;
  }

  const message =
    wrapped.message ||
    (wrapped.code === API_SYSTEM_ERROR_CODE
      ? "server internal error"
      : "request failed");
  const error = new ApiError(message, {
    code: wrapped.code,
    type: wrapped.code === API_UNAUTHORIZED_CODE ? "auth" : "business",
  });

  if (auth && wrapped.code === API_UNAUTHORIZED_CODE) {
    notifyAuthInvalid("登录状态已失效，请重新登录");
  }

  throw error;
}

function handleRequestError(error: unknown): never {
  if (error instanceof DOMException && error.name === "AbortError") {
    const timeoutError = new ApiError("请求超时，请稍后重试", {
      type: "timeout",
      cause: error,
    });
    logErrorInDev(timeoutError);
    throw timeoutError;
  }

  if (error instanceof ApiError) {
    if (error.type !== "business" && error.type !== "auth") {
      logErrorInDev(error);
    }

    throw error;
  }

  const networkError = new ApiError("网络异常，请稍后重试", {
    type: "network",
    cause: error,
  });
  logErrorInDev(networkError);
  throw networkError;
}

function getAuthHeaders(auth: boolean) {
  const headers = new Headers({
    Accept: "application/json",
  });

  if (auth) {
    const token = getToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  return headers;
}

export async function request<T>(path: string, options: RequestOptions = {}) {
  const { method = "GET", body, auth = true } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    const headers = getAuthHeaders(auth);
    headers.set("Content-Type", "application/json");

    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: controller.signal,
    });

    return parseApiResponse<T>(response, auth);
  } catch (error) {
    return handleRequestError(error);
  } finally {
    clearTimeout(timeoutId);
  }
}

export async function requestForm<T>(
  path: string,
  formData: FormData,
  options: Omit<RequestOptions, "body"> = {},
) {
  const { method = "POST", auth = true } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS,
  );

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers: getAuthHeaders(auth),
      body: formData,
      signal: controller.signal,
    });

    return parseApiResponse<T>(response, auth);
  } catch (error) {
    return handleRequestError(error);
  } finally {
    clearTimeout(timeoutId);
  }
}
