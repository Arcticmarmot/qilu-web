import { cx } from "@/lib/cx";

type QiluMarkProps = {
  size?: "md" | "lg";
};

export function QiluMark({ size = "md" }: QiluMarkProps) {
  const svgSize = size === "lg" ? 56 : 40;

  return (
    <div
      className={cx(
        "flex items-center justify-center rounded-md border border-line bg-panel",
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
        <path
          d="M8 28H24M24 28L39 16M24 28L39 40M39 16H48M39 40H48"
          stroke="currentColor"
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="text-accent"
        />
        <circle cx="8" cy="28" r="3" className="fill-muted" />
        <circle cx="24" cy="28" r="3.5" className="fill-accent" />
        <circle cx="48" cy="16" r="3" className="fill-muted" />
        <circle cx="48" cy="40" r="3" className="fill-muted" />
      </svg>
    </div>
  );
}
