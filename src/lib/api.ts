import { request } from "@/lib/http";

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
