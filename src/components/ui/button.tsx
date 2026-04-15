import { ButtonHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary";
};

export function Button({
  className,
  variant = "primary",
  type = "button",
  ...props
}: ButtonProps) {
  return (
    <button
      type={type}
      className={cx(
        "inline-flex h-11 items-center justify-center rounded-md px-5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60",
        variant === "primary"
          ? "bg-foreground text-background hover:bg-accent-strong"
          : "border border-line bg-transparent text-foreground hover:border-accent hover:text-accent",
        className,
      )}
      {...props}
    />
  );
}
