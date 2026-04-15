import Image from "next/image";
import { cx } from "@/lib/cx";

type ContentCardProps = {
  title: string;
  excerpt: string;
  author: string;
  tag: string;
  image: string;
  height: "short" | "medium" | "tall";
};

const imageHeights = {
  short: "h-40",
  medium: "h-52",
  tall: "h-72",
};

export function ContentCard({
  title,
  excerpt,
  author,
  tag,
  image,
  height,
}: ContentCardProps) {
  return (
    <article className="break-inside-avoid overflow-hidden rounded-md border border-line bg-panel shadow-subtle">
      <div className={cx("relative", imageHeights[height])}>
        <Image
          src={image}
          alt=""
          fill
          unoptimized
          sizes="(min-width: 1280px) 28vw, (min-width: 640px) 44vw, 90vw"
          className="object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/70 to-transparent" />
        <span className="absolute left-4 top-4 rounded-md border border-line bg-background/72 px-3 py-1 text-xs text-accent backdrop-blur">
          {tag}
        </span>
      </div>
      <div className="p-5">
        <h2 className="text-lg font-semibold leading-7 text-foreground">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-muted">{excerpt}</p>
        <div className="mt-5 flex items-center justify-between border-t border-line pt-4">
          <span className="text-xs text-muted">{author}</span>
          <span className="flex items-center gap-2 text-xs text-accent">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            延展中
          </span>
        </div>
      </div>
    </article>
  );
}
