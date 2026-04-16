import { cx } from "@/lib/cx";

type QiluMarkProps = {
  size?: "md" | "lg";
};

export function QiluMark({ size = "md" }: QiluMarkProps) {
  const svgSize = size === "lg" ? 56 : 40;

  return (
    <div
      className={cx(
        "flex items-center justify-center rounded-md border border-line bg-foreground text-foreground shadow-subtle",
        size === "lg" ? "h-14 w-14" : "h-10 w-10",
      )}
      aria-hidden="true"
    >
      <svg
        width={svgSize}
        height={svgSize}
        viewBox="0 0 56 56"
        fill="none"
        className="h-full w-full p-2.5"
      >
        <rect x="8" y="8" width="40" height="40" rx="8" className="fill-background" />
        <path
          d="M28 43V30"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M28 30L17 17"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <path
          d="M28 30L39 17"
          stroke="currentColor"
          strokeWidth="5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="28" cy="30" r="3.5" className="fill-accent-strong" />
      </svg>
    </div>
  );
}
