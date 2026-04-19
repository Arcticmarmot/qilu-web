"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatDate } from "@/components/posts/post-utils";
import { useToast } from "@/components/ui/toast";
import {
  getNotifications,
  markNotificationsReadAll,
  type NotificationListItem,
} from "@/lib/api";
import { cx } from "@/lib/cx";

function getNotificationTime(notification: NotificationListItem) {
  return notification.createdAt ?? notification.createAt ?? "";
}

function isUnread(notification: NotificationListItem) {
  return notification.isRead === 0;
}

export function NotificationBell() {
  const notify = useToast();
  const panelRef = useRef<HTMLDivElement>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationListItem[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const loadNotifications = useCallback(
    async ({ markRead }: { markRead: boolean }) => {
      setIsLoading(true);

      try {
        const result = await getNotifications("POST_LIKED");
        setNotifications(result);
        setHasUnread(result.some(isUnread));

        if (markRead) {
          await markNotificationsReadAll("POST_LIKED");
          setHasUnread(false);
          setNotifications((current) =>
            current.map((notification) => ({ ...notification, isRead: 1 })),
          );
        }
      } catch (error) {
        notify(error instanceof Error ? error.message : "通知加载失败", "error");
      } finally {
        setIsLoading(false);
      }
    },
    [notify],
  );

  useEffect(() => {
    void loadNotifications({ markRead: false });
  }, [loadNotifications]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleClickOutside = (event: MouseEvent) => {
      if (
        panelRef.current &&
        event.target instanceof Node &&
        !panelRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleToggle = () => {
    const nextOpen = !isOpen;
    setIsOpen(nextOpen);

    if (nextOpen) {
      setHasUnread(false);
      void loadNotifications({ markRead: true });
    }
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className={cx(
          "relative inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-line px-2 text-sm text-foreground transition hover:border-accent hover:text-accent",
          isOpen ? "border-accent text-accent" : "",
        )}
        onClick={handleToggle}
        aria-label="通知"
        aria-expanded={isOpen}
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {hasUnread ? (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-background" />
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-11 z-40 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-md border border-line bg-panel shadow-subtle">
          <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
            <div>
              <p className="text-sm font-semibold text-foreground">点赞通知</p>
              <p className="mt-0.5 text-xs text-muted">POST_LIKED</p>
            </div>
            {hasUnread ? (
              <span className="rounded-md bg-danger/15 px-2 py-1 text-xs text-danger">
                未读
              </span>
            ) : null}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {isLoading ? (
              <div className="px-4 py-6 text-sm text-muted">正在加载通知</div>
            ) : notifications.length ? (
              <div className="divide-y divide-line">
                {notifications.map((notification) => (
                  <div key={notification.id} className="px-4 py-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="break-all text-sm leading-6 text-foreground">
                          <span className="text-accent">{notification.actorUuid}</span>
                          {" 赞了你的帖子"}
                        </p>
                        <p className="mt-1 text-xs text-muted">
                          类型 {notification.type}
                        </p>
                      </div>
                      {isUnread(notification) ? (
                        <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-danger" />
                      ) : null}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                      <Link
                        href={`/posts/me/${notification.entityId}`}
                        className="rounded-md border border-line px-2 py-1 text-foreground transition hover:border-accent hover:text-accent"
                        onClick={() => setIsOpen(false)}
                      >
                        帖子 #{notification.entityId}
                      </Link>
                      <span>{formatDate(getNotificationTime(notification))}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="px-4 py-8 text-sm text-muted">暂无点赞通知</div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
