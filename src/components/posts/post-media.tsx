"use client";

/* eslint-disable @next/next/no-img-element */

import { useMemo, useState } from "react";
import type { PostMedia } from "@/lib/api";
import { cx } from "@/lib/cx";

function isNonEmptyUrl(value?: string | null) {
  return typeof value === "string" && value.trim().length > 0;
}

export function sortPostMedia(mediaList?: PostMedia[] | null) {
  return [...(mediaList ?? [])].sort((left, right) => {
    const leftOrder = left.sortOrder ?? Number.MAX_SAFE_INTEGER;
    const rightOrder = right.sortOrder ?? Number.MAX_SAFE_INTEGER;

    if (leftOrder !== rightOrder) {
      return leftOrder - rightOrder;
    }

    return left.mediaId - right.mediaId;
  });
}

export function getPostCoverUrl(input: {
  coverUrl?: string | null;
}) {
  if (isNonEmptyUrl(input.coverUrl)) {
    return input.coverUrl!.trim();
  }

  return "";
}

function MediaPlaceholder({
  className,
  title,
}: {
  className?: string;
  title?: string;
}) {
  return (
    <div
      className={cx(
        "flex h-full w-full items-end bg-[linear-gradient(135deg,#2a3531_0%,#1f2724_48%,#171d1b_100%)] p-5",
        className,
      )}
    >
      <div className="max-w-[18rem]">
        <p className="text-xs tracking-[0.24em] text-accent">QILU POST</p>
        <p className="mt-2 line-clamp-2 text-base font-semibold text-foreground">
          {title?.trim() || "未命名帖子"}
        </p>
      </div>
    </div>
  );
}

export function PostCover({
  coverUrl,
  title,
  className,
  imageClassName,
  priority = false,
  badge,
  fallbackClassName,
}: {
  coverUrl?: string | null;
  title?: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
  badge?: string;
  fallbackClassName?: string;
}) {
  const resolvedCoverUrl = isNonEmptyUrl(coverUrl) ? coverUrl!.trim() : "";

  return (
    <div className={cx("relative overflow-hidden bg-soft", className)}>
      {resolvedCoverUrl ? (
        <>
          <img
            src={resolvedCoverUrl}
            alt={title?.trim() || "帖子封面"}
            className={cx("h-full w-full object-cover", imageClassName)}
            loading={priority ? "eager" : "lazy"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/82 via-background/16 to-transparent" />
        </>
      ) : (
        <MediaPlaceholder title={title} className={fallbackClassName} />
      )}
      {badge ? (
        <div className="absolute right-3 top-3 rounded-md border border-white/15 bg-background/74 px-3 py-1 text-xs text-foreground backdrop-blur">
          {badge}
        </div>
      ) : null}
    </div>
  );
}

export function PostMediaCarousel({
  mediaList,
  title,
}: {
  mediaList?: PostMedia[] | null;
  title?: string;
}) {
  const orderedMedia = useMemo(() => sortPostMedia(mediaList), [mediaList]);
  const [activeIndex, setActiveIndex] = useState(0);

  if (!orderedMedia.length) {
    return null;
  }

  const safeActiveIndex = Math.min(activeIndex, orderedMedia.length - 1);
  const canNavigate = orderedMedia.length > 1;

  const moveTo = (nextIndex: number) => {
    if (!orderedMedia.length) {
      return;
    }

    const boundedIndex =
      ((nextIndex % orderedMedia.length) + orderedMedia.length) % orderedMedia.length;
    setActiveIndex(boundedIndex);
  };

  return (
    <section className="mt-8">
      <div className="overflow-hidden rounded-md border border-line bg-panel shadow-subtle">
        <div className="relative min-h-[20rem] bg-soft sm:min-h-[24rem]">
          <div
            className="flex h-full transition-transform duration-500 ease-out"
            style={{ transform: `translateX(-${safeActiveIndex * 100}%)` }}
          >
            {orderedMedia.map((media) => (
              <div
                key={media.mediaId}
                className="flex h-full min-h-[20rem] w-full shrink-0 items-center justify-center bg-soft p-4 sm:min-h-[24rem] sm:p-5"
              >
                <img
                  src={media.url}
                  alt={`${title?.trim() || "帖子"} 图片 ${media.sortOrder ?? media.mediaId}`}
                  className="max-h-[70vh] w-auto max-w-full object-contain"
                  loading="lazy"
                />
              </div>
            ))}
          </div>

          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-28 bg-gradient-to-t from-background/78 to-transparent" />

          {canNavigate ? (
            <>
              <button
                type="button"
                className="absolute left-4 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-background/70 text-lg text-foreground backdrop-blur transition hover:bg-background/88"
                onClick={() => moveTo(activeIndex - 1)}
                aria-label="上一张"
              >
                ‹
              </button>
              <button
                type="button"
                className="absolute right-4 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-background/70 text-lg text-foreground backdrop-blur transition hover:bg-background/88"
                onClick={() => moveTo(activeIndex + 1)}
                aria-label="下一张"
              >
                ›
              </button>
            </>
          ) : null}

          <div className="absolute bottom-4 left-4">
            <div className="rounded-md border border-white/12 bg-background/72 px-3 py-2 text-xs text-foreground backdrop-blur">
              {safeActiveIndex + 1} / {orderedMedia.length}
            </div>
          </div>
        </div>

        {canNavigate ? (
          <div className="grid gap-3 border-t border-line p-4">
            <div className="flex gap-3 overflow-x-auto pb-1">
              {orderedMedia.map((media, index) => (
                <button
                  key={media.mediaId}
                  type="button"
                  className={cx(
                    "relative h-16 w-24 shrink-0 overflow-hidden rounded-md border transition",
                    index === safeActiveIndex
                      ? "border-accent"
                      : "border-line hover:border-accent/70",
                  )}
                  onClick={() => moveTo(index)}
                  aria-label={`查看第 ${index + 1} 张图片`}
                >
                  <img
                    src={media.url}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                  <div
                    className={cx(
                      "absolute inset-0 bg-background/10",
                      index === safeActiveIndex ? "ring-1 ring-inset ring-accent" : "",
                    )}
                  />
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}
