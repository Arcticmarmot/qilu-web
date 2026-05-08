/* eslint-disable @next/next/no-img-element */

type ContentPart =
  | {
      type: "text";
      value: string;
    }
  | {
      type: "image";
      alt: string;
      url: string;
    };

const IMAGE_MARKDOWN_RE = /!\[([^\]]*)]\(([^)\s]+)\)/g;

function parseContent(content: string) {
  const parts: ContentPart[] = [];
  let lastIndex = 0;

  for (const match of content.matchAll(IMAGE_MARKDOWN_RE)) {
    const index = match.index ?? 0;
    const text = content.slice(lastIndex, index);

    if (text) {
      parts.push({ type: "text", value: text });
    }

    parts.push({
      type: "image",
      alt: match[1] || "帖子图片",
      url: match[2],
    });

    lastIndex = index + match[0].length;
  }

  const remaining = content.slice(lastIndex);
  if (remaining) {
    parts.push({ type: "text", value: remaining });
  }

  return parts;
}

export function PostContent({ content }: { content: string }) {
  const parts = parseContent(content);

  return (
    <div className="mt-8 border-t border-line pt-8 text-base leading-8 text-foreground">
      {parts.map((part, index) =>
        part.type === "text" ? (
          <div key={index} className="whitespace-pre-wrap break-words">
            {part.value}
          </div>
        ) : (
          <figure key={index} className="my-5 overflow-hidden rounded-md border border-line bg-soft">
            <img
              src={part.url}
              alt={part.alt}
              className="max-h-[560px] w-full object-contain"
              loading="lazy"
            />
          </figure>
        ),
      )}
    </div>
  );
}
