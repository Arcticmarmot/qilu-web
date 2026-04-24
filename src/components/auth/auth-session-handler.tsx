"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useToast } from "@/components/ui/toast";
import {
  AUTH_INVALID_EVENT,
  type AuthInvalidDetail,
} from "@/lib/auth";

const AUTH_TOAST_THROTTLE_MS = 1500;

export function AuthSessionHandler() {
  const router = useRouter();
  const pathname = usePathname();
  const notify = useToast();
  const lastHandledAtRef = useRef(0);

  useEffect(() => {
    const handleAuthInvalid = (event: Event) => {
      const now = Date.now();
      if (now - lastHandledAtRef.current < AUTH_TOAST_THROTTLE_MS) {
        return;
      }

      lastHandledAtRef.current = now;

      const detail = (event as CustomEvent<AuthInvalidDetail>).detail;
      const message = detail?.message || "登录状态已失效，请重新登录";
      notify(message, "error");

      if (pathname !== "/login") {
        router.replace("/login");
      }
    };

    window.addEventListener(AUTH_INVALID_EVENT, handleAuthInvalid);
    return () => window.removeEventListener(AUTH_INVALID_EVENT, handleAuthInvalid);
  }, [notify, pathname, router]);

  return null;
}
