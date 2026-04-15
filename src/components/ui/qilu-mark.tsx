import { cx } from "@/lib/cx";

type QiluMarkProps = {
  size?: "md" | "lg";
};

export function QiluMark({ size = "md" }: QiluMarkProps) {
  return (
    <div
      className={cx(
        "relative rounded-md border border-line bg-panel",
        size === "lg" ? "h-14 w-14" : "h-10 w-10",
      )}
      aria-hidden="true"
    >
      <span className="absolute left-1/2 top-2 bottom-2 w-px -translate-x-1/2 bg-accent" />
      <span className="absolute left-1/2 top-1/2 h-px w-1/3 bg-line" />
      <span className="absolute right-1/2 bottom-1/2 h-px w-1/3 bg-line" />
      <span className="absolute left-1/2 top-1/2 h-2 w-2 -translate-x-1/2 -translate-y-1/2 rounded-full bg-accent" />
    </div>
  );
}
