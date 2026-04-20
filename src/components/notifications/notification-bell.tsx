"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatDate } from "@/components/posts/post-utils";
import { useToast } from "@/components/ui/toast";
import {
  getLikeNotifications,
  getUnreadLikeNotificationCount,
  markLikeNotificationsReadAll,
  type NotificationListItem,
} from "@/lib/api";
import { cx } from "@/lib/cx";

type NotificationMode = "like" | "comment";

function getNotificationTime(notification: NotificationListItem) {
  return notification.createdAt ?? "";
}

function isUnread(notification: NotificationListItem) {
  return notification.isRead === 0;
}

function NotificationDropdown({
  isLoading,
  notifications,
  hasUnread,
  mode,
  onClose,
}: {
  isLoading: boolean;
  notifications: NotificationListItem[];
  hasUnread: boolean;
  mode: NotificationMode;
  onClose: () => void;
}) {
  const emptyText = mode === "comment" ? "暂无评论" : "暂无点赞";

  return (
    <div className="overflow-hidden rounded-md border border-line bg-panel shadow-subtle">
      <div className="flex items-center justify-between gap-3 border-b border-line px-4 py-3">
        <p className="text-sm font-semibold text-foreground">通知中心</p>
        {hasUnread ? (
          <span className="rounded-md bg-danger/15 px-2 py-1 text-xs text-danger">
            未读
          </span>
        ) : null}
      </div>

      <div className="max-h-[28rem] overflow-y-auto">
        {isLoading ? (
          <div className="px-4 py-6 text-sm text-muted">正在加载</div>
        ) : notifications.length ? (
          <div className="divide-y divide-line">
            {notifications.map((notification) => (
              <div key={notification.id} className="px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="break-all text-sm leading-6 text-foreground">
                      <span className="text-accent">
                        {notification.actorNickname || notification.actorUuid}
                      </span>
                      {" 赞了你的帖子"}
                    </p>
                    {notification.entityTitlePreview ? (
                      <p className="mt-1 line-clamp-2 break-words text-xs leading-5 text-muted">
                        {notification.entityTitlePreview}
                      </p>
                    ) : null}
                  </div>
                  {isUnread(notification) ? (
                    <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-danger" />
                  ) : null}
                </div>
                <div className="mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
                  <Link
                    href={`/posts/me/${notification.entityId}`}
                    className="rounded-md border border-line px-2 py-1 text-foreground transition hover:border-accent hover:text-accent"
                    onClick={onClose}
                  >
                    帖子 #{notification.entityId}
                  </Link>
                  <span>时间 {formatDate(getNotificationTime(notification))}</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="px-4 py-8 text-sm text-muted">{emptyText}</div>
        )}
      </div>
    </div>
  );
}

function NotificationIcon({
  mode,
  active,
  hasUnread,
  unreadCount,
  onClick,
}: {
  mode: NotificationMode;
  active: boolean;
  hasUnread: boolean;
  unreadCount?: number;
  onClick: () => void;
}) {
  const label = mode === "comment" ? "评论" : "点赞";
  const displayCount =
    unreadCount && unreadCount > 99 ? "99+" : unreadCount ? String(unreadCount) : "";

  return (
    <button
      type="button"
      className={cx(
        "relative inline-flex h-11 min-w-24 items-center justify-center gap-2 rounded-md border border-line bg-soft px-3 text-sm text-foreground transition hover:border-accent hover:text-accent",
        active ? "border-accent text-accent" : "",
      )}
      onClick={onClick}
      aria-label={mode === "comment" ? "查看评论通知" : "查看点赞通知"}
      aria-expanded={active}
    >
      {mode === "comment" ? (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4z" />
        </svg>
      ) : (
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8" />
        </svg>
      )}
      <span>{label}</span>
      {displayCount ? (
        <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-semibold leading-5 text-white ring-2 ring-panel">
          {displayCount}
        </span>
      ) : hasUnread ? (
        <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-danger ring-2 ring-panel" />
      ) : null}
    </button>
  );
}

export function NotificationBell({ card = false }: { card?: boolean }) {
  const notify = useToast();
  const panelRef = useRef<HTMLDivElement>(null);
  const likeLoadIdRef = useRef(0);
  const [activeMode, setActiveMode] = useState<NotificationMode>("like");
  const [isOpen, setIsOpen] = useState(false);
  const [notifications, setNotifications] = useState<NotificationListItem[]>([]);
  const [hasUnread, setHasUnread] = useState(false);
  const [unreadLikeCount, setUnreadLikeCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  const loadUnreadLikeCount = useCallback(async () => {
    try {
      const count = await getUnreadLikeNotificationCount();
      setUnreadLikeCount(count);
      setHasUnread(count > 0);
    } catch (error) {
      notify(error instanceof Error ? error.message : "未读数量加载失败", "error");
    }
  }, [notify]);

  const loadLikeNotifications = useCallback(
    async ({ markRead }: { markRead: boolean }) => {
      const loadId = likeLoadIdRef.current + 1;
      likeLoadIdRef.current = loadId;
      setIsLoading(true);

      try {
        const result = await getLikeNotifications();
        if (likeLoadIdRef.current !== loadId) {
          return;
        }

        setNotifications(result);
        if (!markRead) {
          setHasUnread(result.some(isUnread));
        }

        if (markRead) {
          await markLikeNotificationsReadAll();
          if (likeLoadIdRef.current !== loadId) {
            return;
          }

          setHasUnread(false);
          setUnreadLikeCount(0);
          setNotifications((current) =>
            current.map((notification) => ({ ...notification, isRead: 1 })),
          );
        }
      } catch (error) {
        notify(error instanceof Error ? error.message : "通知加载失败", "error");
      } finally {
        if (likeLoadIdRef.current === loadId) {
          setIsLoading(false);
        }
      }
    },
    [notify],
  );

  useEffect(() => {
    void loadUnreadLikeCount();
    void loadLikeNotifications({ markRead: false });
  }, [loadLikeNotifications, loadUnreadLikeCount]);

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

  const handleToggle = (mode: NotificationMode = activeMode) => {
    const nextOpen = mode !== activeMode || !isOpen;
    setActiveMode(mode);
    setIsOpen(nextOpen);

    if (mode === "comment") {
      likeLoadIdRef.current += 1;
      setNotifications([]);
      setIsLoading(false);
      return;
    }

    if (nextOpen) {
      setHasUnread(false);
      void loadLikeNotifications({ markRead: true });
    }
  };

  if (card) {
    return (
      <div className="relative min-h-36 overflow-visible rounded-md border border-line bg-panel p-5 shadow-subtle" ref={panelRef}>
        <div>
          <h2 className="text-lg font-semibold text-foreground">通知中心</h2>
          <div className="mt-4 flex items-center gap-2">
            <NotificationIcon
              mode="like"
              active={isOpen && activeMode === "like"}
              hasUnread={hasUnread}
              unreadCount={unreadLikeCount}
              onClick={() => handleToggle("like")}
            />
            <NotificationIcon
              mode="comment"
              active={isOpen && activeMode === "comment"}
              hasUnread={false}
              onClick={() => handleToggle("comment")}
            />
          </div>
        </div>

        {isOpen ? (
          <div className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-[min(22rem,calc(100vw-2rem))]">
            <NotificationDropdown
              isLoading={isLoading}
              notifications={notifications}
              hasUnread={activeMode === "like" && hasUnread}
              mode={activeMode}
              onClose={() => setIsOpen(false)}
            />
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        className={cx(
          "relative inline-flex h-9 min-w-9 items-center justify-center rounded-md border border-line px-2 text-sm text-foreground transition hover:border-accent hover:text-accent",
          isOpen ? "border-accent text-accent" : "",
        )}
        onClick={() => handleToggle()}
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
        <div className="absolute right-0 top-11 z-40 w-[min(22rem,calc(100vw-2rem))]">
          <NotificationDropdown
            isLoading={isLoading}
            notifications={notifications}
            hasUnread={activeMode === "like" && hasUnread}
            mode={activeMode}
            onClose={() => setIsOpen(false)}
          />
        </div>
      ) : null}
    </div>
  );
}
