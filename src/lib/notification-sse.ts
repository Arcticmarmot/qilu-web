import { fetchEventSource } from "@microsoft/fetch-event-source";
import { notifyAuthInvalid } from "@/lib/auth";
import { API_BASE_URL } from "@/lib/http";

export const NOTIFICATION_CREATED_EVENT = "qilu:notification-created";
export const NOTIFICATION_UNREAD_CHANGED_EVENT = "qilu:notification-unread-changed";

export type NotificationSsePayload = {
  eventType?: string;
  [key: string]: unknown;
};

type NotificationCreatedHandler = (data: NotificationSsePayload) => void;

let tabSseAbortController: AbortController | null = null;
let tabConnectedToken: string | null = null;
let tabConnectionSeq = 0;

class FatalSseError extends Error {}

function dispatchNotificationCreated(data: NotificationSsePayload) {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(
    new CustomEvent<NotificationSsePayload>(NOTIFICATION_CREATED_EVENT, {
      detail: data,
    }),
  );
}

export function notifyNotificationUnreadChanged() {
  if (typeof window === "undefined") {
    return;
  }

  window.dispatchEvent(new Event(NOTIFICATION_UNREAD_CHANGED_EVENT));
}

function parseSseData(data: string) {
  try {
    return JSON.parse(data) as NotificationSsePayload;
  } catch (error) {
    console.error("notification sse message parse error", error);
    return null;
  }
}

export function connectNotificationSse(
  token: string | null,
  onNotificationCreated: NotificationCreatedHandler = dispatchNotificationCreated,
) {
  if (!token) {
    return;
  }

  if (tabSseAbortController && tabConnectedToken === token) {
    return;
  }

  disconnectNotificationSse();

  const controller = new AbortController();
  const connectionId = tabConnectionSeq + 1;
  tabConnectionSeq = connectionId;
  tabSseAbortController = controller;
  tabConnectedToken = token;

  void fetchEventSource(`${API_BASE_URL}/notification-sse/connect`, {
    method: "GET",
    openWhenHidden: true,
    headers: {
      Authorization: `Bearer ${token}`,
    },
    signal: controller.signal,
    async onopen(response) {
      if (response.status === 401 || response.status === 403) {
        notifyAuthInvalid("登录状态已失效，请重新登录");
        throw new FatalSseError("notification sse unauthorized");
      }

      if (!response.ok) {
        throw new Error(`notification sse failed: ${response.status}`);
      }
    },
    onmessage(event) {
      console.log("[notification-sse] message", {
        connectionId,
        event: event.event,
        data: event.data,
      });

      if (!event.data) {
        return;
      }

      const data = parseSseData(event.data);
      if (data?.eventType === "notification_created") {
        onNotificationCreated(data);
      }
    },
    onerror(error) {
      console.error("notification sse error", error);
      throw error;
    },
  }).catch((error) => {
    if (!controller.signal.aborted) {
      console.error("notification sse closed", error);
    }
  }).finally(() => {
    if (tabSseAbortController === controller) {
      tabSseAbortController = null;
      tabConnectedToken = null;
    }
  });
}

export function disconnectNotificationSse() {
  if (!tabSseAbortController) {
    return;
  }

  tabSseAbortController.abort();
  tabSseAbortController = null;
  tabConnectedToken = null;
}
