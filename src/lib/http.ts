import axios, {
  AxiosError,
  AxiosHeaders,
  type AxiosRequestConfig,
  type InternalAxiosRequestConfig,
} from "axios";
import { clearToken, getToken } from "@/lib/auth";

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL?.replace(/\/$/, "") ?? "/api/backend";

type ApiResponse<T> = {
  code: number;
  message: string;
  data: T;
};

const PUBLIC_REQUESTS = [
  { method: "POST", url: "/auth/login" },
  { method: "POST", url: "/users" },
];

export const http = axios.create({
  baseURL: API_BASE_URL,
  timeout: 12000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

function isPublicRequest(config: InternalAxiosRequestConfig) {
  const method = config.method?.toUpperCase() ?? "GET";
  const url = config.url ?? "";

  return PUBLIC_REQUESTS.some(
    (requestConfig) =>
      requestConfig.method === method && requestConfig.url === url,
  );
}

http.interceptors.request.use((config) => {
  const headers = AxiosHeaders.from(config.headers);

  if (!isPublicRequest(config)) {
    const token = getToken();

    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  }

  config.headers = headers;
  return config;
});

http.interceptors.response.use(
  (response) => {
    const payload = response.data as ApiResponse<unknown>;

    if (payload.code !== 200) {
      return Promise.reject(new Error(payload.message || "请求失败"));
    }

    response.data = payload.data;
    return response;
  },
  (error: AxiosError<ApiResponse<unknown>>) => {
    if (error.response?.status === 401) {
      clearToken();
    }

    const message =
      error.response?.data?.message ||
      error.message ||
      "网络异常，请稍后重试";

    return Promise.reject(new Error(message));
  },
);

export function request<T>(config: AxiosRequestConfig) {
  return http.request<T>(config).then((response) => response.data);
}
