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
  return request<User>({
    url: "/users",
    method: "POST",
    data: input,
  });
}

export function login(input: { email: string; password: string }) {
  return request<LoginResponse>({
    url: "/auth/login",
    method: "POST",
    data: input,
  });
}

export function getCurrentUser() {
  return request<User>({
    url: "/users/me",
    method: "GET",
  });
}
