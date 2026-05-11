"use client";

import { useEffect } from "react";
import {
  AUTH_TOKEN_CHANGED_EVENT,
  getToken,
  type AuthTokenChangedDetail,
} from "@/lib/auth";
import {
  connectNotificationSse,
  disconnectNotificationSse,
} from "@/lib/notification-sse";

export function NotificationSseHandler() {
  useEffect(() => {
    const connectFromCurrentToken = () => {
      const token = getToken();
      if (token) {
        connectNotificationSse(token);
      } else {
        disconnectNotificationSse();
      }
    };

    const handleTokenChanged = (event: Event) => {
      const detail = (event as CustomEvent<AuthTokenChangedDetail>).detail;
      if (detail?.token) {
        connectNotificationSse(detail.token);
      } else {
        disconnectNotificationSse();
      }
    };

    connectFromCurrentToken();
    window.addEventListener(AUTH_TOKEN_CHANGED_EVENT, handleTokenChanged);

    return () => {
      window.removeEventListener(AUTH_TOKEN_CHANGED_EVENT, handleTokenChanged);
      disconnectNotificationSse();
    };
  }, []);

  return null;
}
