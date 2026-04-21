"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatDate } from "@/components/posts/post-utils";
import { useToast } from "@/components/ui/toast";
import {
  getCommentNotifications,
  getLikeNotifications,
  getUnreadCommentNotificationCount,
  getUnreadLikeNotificationCount,
  markCommentNotificationsReadAll,
  markLikeNotificationsReadAll,
  type NotificationListItem,
} from "@/lib/api";
import { cx } from "@/lib/cx";

type NotificationMode = "like" | "comment";

type NotificationMap = Record<NotificationMode, NotificationListItem[]>;
type CountMap = Record<NotificationMode, number>;

const INITIAL_NOTIFICATIONS: NotificationMap = {
  like: [],
  comment: [],
};

const INITIAL_COUNTS: CountMap = {
  like: 0,
  comment: 0,
};

function getNotificationTime(notification: NotificationListItem) {
  return notification.createdAt ?? "";
}

function getNotificationPreview(notification: NotificationListItem) {
  return notification.entityPreview ?? notification.entityTitlePreview ?? "";
}

function getCommentPreview(notification: NotificationListItem) {
  return notification.contentPreview ?? "";
}

function isUnread(notification: NotificationListItem) {
  return notification.isRead === 0;
}

function getModeLabel(mode: NotificationMode) {
  return mode === "comment" ? "评论" : "点赞";
}

function NotificationTypeButton({
  mode,
  active,
  unreadCount,
  onClick,
}: {
  mode: NotificationMode;
  active: boolean;
  unreadCount: number;
  onClick: () => void;
}) {
  const label = getModeLabel(mode);
  const displayCount = unreadCount > 99 ? "99+" : unreadCount ? String(unreadCount) : "";

  return (
    <button
      type="button"
      className={cx(
        "relative inline-flex h-9 min-w-20 items-center justify-center gap-1.5 rounded-md border border-line bg-soft px-2.5 text-sm text-foreground transition hover:border-accent hover:text-accent",
        active ? "border-accent text-accent" : "",
      )}
      onClick={onClick}
      aria-label={mode === "comment" ? "查看评论通知" : "查看点赞通知"}
      aria-expanded={active}
    >
      {mode === "comment" ? (
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.85"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M12 5.2c4.52 0 8.2 2.94 8.2 6.57S16.52 18.34 12 18.34c-1.04 0-2.05-.16-2.98-.47l-4.02 1.53 1.21-3.15c-1.49-1.14-2.41-2.72-2.41-4.48 0-3.63 3.68-6.57 8.2-6.57Z" />
          <path d="M9 11.77h.01" />
          <path d="M12 11.77h.01" />
          <path d="M15 11.77h.01" />
        </svg>
      ) : (
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.6l-1-1a5.5 5.5 0 0 0-7.8 7.8l1 1L12 21l7.8-7.6 1-1a5.5 5.5 0 0 0 0-7.8" />
        </svg>
      )}
      <span>{label}</span>
      {displayCount ? (
        <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-semibold leading-5 text-white ring-2 ring-panel">
          {displayCount}
        </span>
      ) : null}
    </button>
  );
}

function NotificationDropdown({
  isLoading,
  notifications,
  hasUnread,
  mode,
  unreadCounts,
  onModeChange,
  onClose,
}: {
  isLoading: boolean;
  notifications: NotificationListItem[];
  hasUnread: boolean;
  mode: NotificationMode;
  unreadCounts: CountMap;
  onModeChange: (mode: NotificationMode) => void;
  onClose: () => void;
}) {
  const emptyText = mode === "comment" ? "暂无评论通知" : "暂无点赞通知";

  return (
    <div className="overflow-hidden rounded-md border border-line bg-panel shadow-subtle">
      <div className="border-b border-line px-3 py-2.5">
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">通知中心</p>
          {hasUnread ? (
            <span className="rounded-md bg-danger/15 px-2 py-1 text-xs text-danger">
              未读
            </span>
          ) : null}
        </div>
        <div className="mt-2.5 flex items-center gap-2">
          <NotificationTypeButton
            mode="like"
            active={mode === "like"}
            unreadCount={unreadCounts.like}
            onClick={() => onModeChange("like")}
          />
          <NotificationTypeButton
            mode="comment"
            active={mode === "comment"}
            unreadCount={unreadCounts.comment}
            onClick={() => onModeChange("comment")}
          />
        </div>
      </div>

      <div className="max-h-[28rem] overflow-y-auto">
        {isLoading ? (
          <div className="px-3 py-5 text-sm text-muted">正在加载</div>
        ) : notifications.length ? (
          <div className="divide-y divide-line">
            {notifications.map((notification) => {
              const preview = getNotificationPreview(notification);
              const commentPreview = getCommentPreview(notification);
              const href =
                mode === "comment"
                  ? `/posts/me/${notification.entityId}#comments`
                  : `/posts/me/${notification.entityId}`;

              return (
                <div key={notification.id} className="px-3 py-2.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1" />
                    {isUnread(notification) ? (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-danger" />
                    ) : null}
                  </div>
                  {mode === "comment" ? (
                    <Link
                      href={href}
                      className="mt-2 grid gap-2 rounded-md border border-line bg-soft/55 p-2.5 transition hover:border-accent"
                      onClick={onClose}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 break-all text-sm leading-5 text-foreground">
                          <span className="text-accent">
                            {notification.actorNickname || notification.actorUuid}
                          </span>
                          {" 评论了你的帖子"}
                        </p>
                        <span className="inline-flex max-w-32 shrink-0 items-center rounded-full bg-accent/14 px-2.5 py-1 text-[11px] font-medium text-accent">
                          <span className="line-clamp-1 break-words">
                            {preview || "暂无帖子预览"}
                          </span>
                        </span>
                      </div>
                      <div className="rounded-md bg-background/72 px-3 py-2.5">
                        <p className="line-clamp-3 break-words text-sm leading-5 text-foreground">
                          {commentPreview || "暂无评论预览"}
                        </p>
                      </div>
                      <div className="flex items-center justify-end text-[11px] text-muted">
                        <span>{formatDate(getNotificationTime(notification))}</span>
                      </div>
                    </Link>
                  ) : (
                    <Link
                      href={href}
                      className="mt-2 block rounded-md border border-line bg-soft/55 p-2.5 transition hover:border-accent"
                      onClick={onClose}
                    >
                      <div className="flex items-start justify-between gap-2">
                        <p className="min-w-0 break-all text-sm leading-5 text-foreground">
                          <span className="text-accent">
                            {notification.actorNickname || notification.actorUuid}
                          </span>
                          {" 赞了你的帖子"}
                        </p>
                        <span className="inline-flex max-w-32 shrink-0 items-center rounded-full bg-accent/14 px-2.5 py-1 text-[11px] font-medium text-accent">
                          <span className="line-clamp-1 break-words">
                            {preview || "暂无帖子预览"}
                          </span>
                        </span>
                      </div>
                      <div className="mt-2 flex items-center justify-end text-[11px] text-muted">
                        <span>{formatDate(getNotificationTime(notification))}</span>
                      </div>
                    </Link>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="px-3 py-7 text-sm text-muted">{emptyText}</div>
        )}
      </div>
    </div>
  );
}

export function NotificationBell({ card = false }: { card?: boolean }) {
  const notify = useToast();
  const panelRef = useRef<HTMLDivElement>(null);
  const loadIdRef = useRef<Record<NotificationMode, number>>({
    like: 0,
    comment: 0,
  });
  const [activeMode, setActiveMode] = useState<NotificationMode>("like");
  const [isOpen, setIsOpen] = useState(false);
  const [notificationsByMode, setNotificationsByMode] =
    useState<NotificationMap>(INITIAL_NOTIFICATIONS);
  const [unreadCounts, setUnreadCounts] = useState<CountMap>(INITIAL_COUNTS);
  const [loadingMode, setLoadingMode] = useState<NotificationMode | null>(null);

  const isLoading = loadingMode === activeMode;
  const activeNotifications = notificationsByMode[activeMode];
  const activeHasUnread = unreadCounts[activeMode] > 0;
  const totalUnreadCount = unreadCounts.like + unreadCounts.comment;

  const loadUnreadCounts = useCallback(async () => {
    try {
      const [likeCount, commentCount] = await Promise.all([
        getUnreadLikeNotificationCount(),
        getUnreadCommentNotificationCount(),
      ]);

      setUnreadCounts({
        like: likeCount,
        comment: commentCount,
      });
    } catch (error) {
      notify(error instanceof Error ? error.message : "未读数量加载失败", "error");
    }
  }, [notify]);

  const loadNotifications = useCallback(
    async (mode: NotificationMode, { markRead }: { markRead: boolean }) => {
      const loadId = loadIdRef.current[mode] + 1;
      loadIdRef.current[mode] = loadId;
      setLoadingMode(mode);

      try {
        const listLoader =
          mode === "comment" ? getCommentNotifications : getLikeNotifications;
        const markReadLoader =
          mode === "comment"
            ? markCommentNotificationsReadAll
            : markLikeNotificationsReadAll;

        const result = await listLoader();
        if (loadIdRef.current[mode] !== loadId) {
          return;
        }

        setNotificationsByMode((current) => ({
          ...current,
          [mode]: result,
        }));

        if (markRead) {
          await markReadLoader();
          if (loadIdRef.current[mode] !== loadId) {
            return;
          }

          setUnreadCounts((current) => ({
            ...current,
            [mode]: 0,
          }));
          setNotificationsByMode((current) => ({
            ...current,
            [mode]: current[mode].map((notification) => ({
              ...notification,
              isRead: 1,
            })),
          }));
        } else {
          const nextUnreadCount = result.filter(isUnread).length;
          setUnreadCounts((current) => ({
            ...current,
            [mode]: nextUnreadCount,
          }));
        }
      } catch (error) {
        notify(error instanceof Error ? error.message : "通知加载失败", "error");
      } finally {
        if (loadIdRef.current[mode] === loadId) {
          setLoadingMode((current) => (current === mode ? null : current));
        }
      }
    },
    [notify],
  );

  useEffect(() => {
    void loadUnreadCounts();
    void Promise.all([
      loadNotifications("like", { markRead: false }),
      loadNotifications("comment", { markRead: false }),
    ]);
  }, [loadNotifications, loadUnreadCounts]);

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

  const openMode = (mode: NotificationMode) => {
    setActiveMode(mode);
    setIsOpen(true);
    void loadNotifications(mode, { markRead: true });
  };

  const toggleCardMode = (mode: NotificationMode) => {
    if (isOpen && activeMode === mode) {
      setIsOpen(false);
      return;
    }

    openMode(mode);
  };

  if (card) {
    return (
      <div
        className="relative min-h-36 overflow-visible rounded-md border border-line bg-panel p-5 shadow-subtle"
        ref={panelRef}
      >
        <div>
          <h2 className="text-lg font-semibold text-foreground">通知中心</h2>
          <div className="mt-4 flex items-center gap-2">
            <NotificationTypeButton
              mode="like"
              active={isOpen && activeMode === "like"}
              unreadCount={unreadCounts.like}
              onClick={() => toggleCardMode("like")}
            />
            <NotificationTypeButton
              mode="comment"
              active={isOpen && activeMode === "comment"}
              unreadCount={unreadCounts.comment}
              onClick={() => toggleCardMode("comment")}
            />
          </div>
        </div>

        {isOpen ? (
          <div className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-[min(22rem,calc(100vw-2rem))]">
            <NotificationDropdown
              isLoading={isLoading}
              notifications={activeNotifications}
              hasUnread={activeHasUnread}
              mode={activeMode}
              unreadCounts={unreadCounts}
              onModeChange={openMode}
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
        onClick={() => {
          if (isOpen) {
            setIsOpen(false);
            return;
          }

          openMode(activeMode);
        }}
        aria-label="通知"
        aria-expanded={isOpen}
      >
        <svg
          viewBox="0 0 24 24"
          className="h-4 w-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
          <path d="M13.7 21a2 2 0 0 1-3.4 0" />
        </svg>
        {totalUnreadCount > 0 ? (
          <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full bg-danger ring-2 ring-background" />
        ) : null}
      </button>

      {isOpen ? (
        <div className="absolute right-0 top-11 z-40 w-[min(22rem,calc(100vw-2rem))]">
          <NotificationDropdown
            isLoading={isLoading}
            notifications={activeNotifications}
            hasUnread={activeHasUnread}
            mode={activeMode}
            unreadCounts={unreadCounts}
            onModeChange={openMode}
            onClose={() => setIsOpen(false)}
          />
        </div>
      ) : null}
    </div>
  );
}
