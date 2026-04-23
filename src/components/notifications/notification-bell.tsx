"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { formatDate } from "@/components/posts/post-utils";
import { useToast } from "@/components/ui/toast";
import {
  getCommentNotifications,
  getLikeNotifications,
  getReplyNotifications,
  getUnreadCommentNotificationCount,
  getUnreadLikeNotificationCount,
  getUnreadReplyNotificationCount,
  markCommentNotificationsReadAll,
  markLikeNotificationsReadAll,
  markReplyNotificationsReadAll,
  type NotificationListItem,
} from "@/lib/api";
import { cx } from "@/lib/cx";

type NotificationMode = "like" | "comment" | "reply";

type NotificationMap = Record<NotificationMode, NotificationListItem[]>;
type CountMap = Record<NotificationMode, number>;
type NotificationModeConfig = {
  label: string;
  emptyText: string;
  actionText: string;
  previewFallback: string;
  contentFallback?: string;
  card: "compact" | "conversation";
  ariaLabel: string;
  list: () => Promise<NotificationListItem[]>;
  count: () => Promise<number>;
  markRead: () => Promise<null>;
};

const NOTIFICATION_MODES: NotificationMode[] = ["like", "comment", "reply"];

const INITIAL_NOTIFICATIONS: NotificationMap = {
  like: [],
  comment: [],
  reply: [],
};

const INITIAL_COUNTS: CountMap = {
  like: 0,
  comment: 0,
  reply: 0,
};

const NOTIFICATION_CONFIG: Record<NotificationMode, NotificationModeConfig> = {
  like: {
    label: "点赞",
    emptyText: "暂无点赞通知",
    actionText: "赞了你的帖子",
    previewFallback: "暂无帖子预览",
    card: "compact",
    ariaLabel: "查看点赞通知",
    list: getLikeNotifications,
    count: getUnreadLikeNotificationCount,
    markRead: markLikeNotificationsReadAll,
  },
  comment: {
    label: "评论",
    emptyText: "暂无评论通知",
    actionText: "评论了你的帖子",
    previewFallback: "暂无帖子预览",
    contentFallback: "暂无评论预览",
    card: "conversation",
    ariaLabel: "查看评论通知",
    list: getCommentNotifications,
    count: getUnreadCommentNotificationCount,
    markRead: markCommentNotificationsReadAll,
  },
  reply: {
    label: "回复",
    emptyText: "暂无回复通知",
    actionText: "回复了你的评论",
    previewFallback: "暂无被回复内容",
    contentFallback: "暂无回复预览",
    card: "conversation",
    ariaLabel: "查看回复通知",
    list: getReplyNotifications,
    count: getUnreadReplyNotificationCount,
    markRead: markReplyNotificationsReadAll,
  },
};

function getNotificationTime(notification: NotificationListItem) {
  return notification.createdAt ?? "";
}

function getNotificationPreview(notification: NotificationListItem) {
  return notification.entityPreview ?? notification.entityTitlePreview ?? "";
}

function getContentPreview(notification: NotificationListItem) {
  return notification.contentPreview ?? "";
}

function isUnread(notification: NotificationListItem) {
  return notification.isRead === 0;
}

function getNotificationHref(notification: NotificationListItem, mode: NotificationMode) {
  if (mode === "like") {
    return `/posts/me/${notification.entityId}`;
  }

  return `/posts/me/${notification.entityId}#comments`;
}

function NotificationModeIcon({ mode }: { mode: NotificationMode }) {
  if (mode === "comment") {
    return (
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
    );
  }

  if (mode === "reply") {
    return (
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
        <path d="M10.2 7.2 5.4 12l4.8 4.8" />
        <path d="M5.8 12H14c3.1 0 5.2 1.8 5.2 4.8v.6" />
      </svg>
    );
  }

  return (
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
  );
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
  const config = NOTIFICATION_CONFIG[mode];
  const displayCount = unreadCount > 99 ? "99+" : unreadCount ? String(unreadCount) : "";

  return (
    <button
      type="button"
      className={cx(
        "relative inline-flex h-9 min-w-20 items-center justify-center gap-1.5 rounded-md border border-line bg-soft px-2.5 text-sm text-foreground transition hover:border-accent hover:text-accent",
        active ? "border-accent text-accent" : "",
      )}
      onClick={onClick}
      aria-label={config.ariaLabel}
      aria-pressed={active}
    >
      <NotificationModeIcon mode={mode} />
      <span>{config.label}</span>
      {displayCount ? (
        <span className="absolute -right-1.5 -top-1.5 flex min-w-5 items-center justify-center rounded-full bg-danger px-1.5 text-[11px] font-semibold leading-5 text-white ring-2 ring-panel">
          {displayCount}
        </span>
      ) : null}
    </button>
  );
}

function NotificationCard({
  notification,
  mode,
  onClose,
}: {
  notification: NotificationListItem;
  mode: NotificationMode;
  onClose?: () => void;
}) {
  const config = NOTIFICATION_CONFIG[mode];
  const preview = getNotificationPreview(notification);
  const contentPreview = getContentPreview(notification);

  return (
    <Link
      href={getNotificationHref(notification, mode)}
      className={cx(
        "grid gap-2 rounded-md border border-line bg-soft/55 p-2.5 transition hover:border-accent",
        config.card === "compact" ? "gap-0" : "",
      )}
      onClick={onClose}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="min-w-0 break-all text-sm leading-5 text-foreground">
          <span className="text-accent">
            {notification.actorNickname || notification.actorUuid}
          </span>
          {` ${config.actionText}`}
        </p>
        <span className="inline-flex max-w-32 shrink-0 items-center rounded-full bg-accent/14 px-2.5 py-1 text-[11px] font-medium text-accent">
          <span className="line-clamp-1 break-words">
            {preview || config.previewFallback}
          </span>
        </span>
      </div>

      {config.card === "conversation" ? (
        <div className="rounded-md bg-background/72 px-3 py-2.5">
          <p className="line-clamp-3 break-words text-sm leading-5 text-foreground">
            {contentPreview || config.contentFallback}
          </p>
        </div>
      ) : null}

      <div className="flex items-center justify-end text-[11px] text-muted">
        <span>{formatDate(getNotificationTime(notification))}</span>
      </div>
    </Link>
  );
}

function NotificationList({
  mode,
  notifications,
  isLoading,
  onClose,
}: {
  mode: NotificationMode | null;
  notifications: NotificationListItem[];
  isLoading: boolean;
  onClose?: () => void;
}) {
  if (!mode) {
    return (
      <div className="rounded-md border border-dashed border-line bg-soft/45 px-3 py-7 text-sm text-muted">
        点击上方按钮查看对应通知。
      </div>
    );
  }

  const config = NOTIFICATION_CONFIG[mode];

  if (isLoading) {
    return <div className="px-3 py-5 text-sm text-muted">正在加载</div>;
  }

  if (!notifications.length) {
    return <div className="px-3 py-7 text-sm text-muted">{config.emptyText}</div>;
  }

  return (
    <div className="max-h-[28rem] overflow-y-auto divide-y divide-line">
      {notifications.map((notification) => (
        <div key={notification.id} className="px-3 py-2.5">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1" />
            {isUnread(notification) ? (
              <span className="mb-1.5 h-2 w-2 shrink-0 rounded-full bg-danger" />
            ) : null}
          </div>
          <NotificationCard notification={notification} mode={mode} onClose={onClose} />
        </div>
      ))}
    </div>
  );
}

function NotificationButtons({
  activeMode,
  unreadCounts,
  onModeClick,
}: {
  activeMode: NotificationMode | null;
  unreadCounts: CountMap;
  onModeClick: (mode: NotificationMode) => void;
}) {
  return (
    <div className="flex items-center gap-2">
      {NOTIFICATION_MODES.map((mode) => (
        <NotificationTypeButton
          key={mode}
          mode={mode}
          active={activeMode === mode}
          unreadCount={unreadCounts[mode]}
          onClick={() => onModeClick(mode)}
        />
      ))}
    </div>
  );
}

export function NotificationBell({ card = false }: { card?: boolean }) {
  const notify = useToast();
  const panelRef = useRef<HTMLDivElement>(null);
  const loadIdRef = useRef<Record<NotificationMode, number>>({
    like: 0,
    comment: 0,
    reply: 0,
  });
  const [activeMode, setActiveMode] = useState<NotificationMode | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [notificationsByMode, setNotificationsByMode] =
    useState<NotificationMap>(INITIAL_NOTIFICATIONS);
  const [unreadCounts, setUnreadCounts] = useState<CountMap>(INITIAL_COUNTS);
  const [loadingMode, setLoadingMode] = useState<NotificationMode | null>(null);

  const isLoading = activeMode !== null && loadingMode === activeMode;
  const activeNotifications = activeMode ? notificationsByMode[activeMode] : [];
  const totalUnreadCount = NOTIFICATION_MODES.reduce(
    (total, mode) => total + unreadCounts[mode],
    0,
  );

  const loadUnreadCounts = useCallback(async () => {
    try {
      const results = await Promise.all(
        NOTIFICATION_MODES.map(async (mode) => [
          mode,
          await NOTIFICATION_CONFIG[mode].count(),
        ] as const),
      );

      setUnreadCounts(Object.fromEntries(results) as CountMap);
    } catch (error) {
      notify(error instanceof Error ? error.message : "未读数量加载失败", "error");
    }
  }, [notify]);

  const loadNotifications = useCallback(
    async (mode: NotificationMode) => {
      const loadId = loadIdRef.current[mode] + 1;
      loadIdRef.current[mode] = loadId;
      setLoadingMode(mode);

      try {
        const config = NOTIFICATION_CONFIG[mode];
        const result = await config.list();
        if (loadIdRef.current[mode] !== loadId) {
          return;
        }

        setNotificationsByMode((current) => ({
          ...current,
          [mode]: result,
        }));

        if (result.some(isUnread)) {
          await config.markRead();
          if (loadIdRef.current[mode] !== loadId) {
            return;
          }
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
  }, [loadUnreadCounts]);

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
    void loadNotifications(mode);
  };

  if (card) {
    return (
      <div
        className="relative min-h-36 overflow-visible rounded-md border border-line bg-panel p-5 shadow-subtle"
        ref={panelRef}
      >
        <h2 className="text-lg font-semibold text-foreground">通知中心</h2>
        <div className="mt-4">
          <NotificationButtons
            activeMode={activeMode}
            unreadCounts={unreadCounts}
            onModeClick={openMode}
          />
        </div>

        {isOpen ? (
          <div className="absolute right-0 top-[calc(100%+0.5rem)] z-40 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-md border border-line bg-panel shadow-subtle">
            <NotificationList
              mode={activeMode}
              notifications={activeNotifications}
              isLoading={isLoading}
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
        onClick={() => setIsOpen((current) => !current)}
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
        <div className="absolute right-0 top-11 z-40 w-[min(22rem,calc(100vw-2rem))] overflow-hidden rounded-md border border-line bg-panel shadow-subtle">
          <div className="border-b border-line px-3 py-2.5">
            <p className="mb-2.5 text-sm font-semibold text-foreground">通知中心</p>
            <NotificationButtons
              activeMode={activeMode}
              unreadCounts={unreadCounts}
              onModeClick={openMode}
            />
          </div>
          <NotificationList
            mode={activeMode}
            notifications={activeNotifications}
            isLoading={isLoading}
            onClose={() => setIsOpen(false)}
          />
        </div>
      ) : null}
    </div>
  );
}
