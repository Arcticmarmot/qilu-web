"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { getCurrentUser, type User } from "@/lib/api";
import { getToken } from "@/lib/auth";
import { getErrorMessage, isAuthError } from "@/lib/error";

export function useCurrentUser() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = getToken();

    if (!token) {
      router.replace("/login");
      return;
    }

    // 路由只判断本地 token 是否存在，真实登录态以 /users/me 为准。
    getCurrentUser()
      .then((currentUser) => {
        setUser(currentUser);
      })
      .catch((err: unknown) => {
        if (isAuthError(err)) {
          setUser(null);
          setError("");
          return;
        }

        setError(getErrorMessage(err, "加载用户信息失败"));
      })
      .finally(() => {
        setIsLoading(false);
      });
  }, [router]);

  return { user, error, isLoading };
}
