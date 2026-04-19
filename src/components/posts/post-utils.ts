import type { Post } from "@/lib/api";

export const POST_PAGE_SIZE = 6;

export function readPage(value: string | null) {
  const page = Number(value);

  if (!Number.isFinite(page) || page < 1) {
    return 1;
  }

  return Math.floor(page);
}

export function formatDate(value?: string) {
  if (!value) {
    return "暂无";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  const pad = (number: number) => String(number).padStart(2, "0");

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  ].join(" ");
}

export function getPostTime(post: Post) {
  return post.createAt ?? post.createdAt ?? "";
}

export function getVisibilityLabel(visibility?: 1 | 2) {
  return visibility === 2 ? "仅自己" : "公开";
}

export function getPageItems(current: number, totalPages: number) {
  const items: Array<number | "..."> = [];

  for (let page = 1; page <= totalPages; page += 1) {
    const nearCurrent = Math.abs(page - current) <= 1;
    const nearEdge = page <= 2 || page > totalPages - 2;

    if (nearCurrent || nearEdge) {
      items.push(page);
      continue;
    }

    if (items[items.length - 1] !== "...") {
      items.push("...");
    }
  }

  return items;
}

