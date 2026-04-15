import { InputHTMLAttributes } from "react";
import { cx } from "@/lib/cx";

type InputProps = InputHTMLAttributes<HTMLInputElement> & {
  label: string;
};

export function Input({ className, id, label, ...props }: InputProps) {
  const inputId = id ?? label.toLowerCase();

  return (
    <label className="block" htmlFor={inputId}>
      <span className="mb-2 block text-sm font-medium text-foreground">{label}</span>
      <input
        id={inputId}
        className={cx(
          "h-11 w-full rounded-md border border-line bg-soft px-3 text-sm text-foreground outline-none transition placeholder:text-muted focus:border-accent focus:bg-panel",
          className,
        )}
        {...props}
      />
    </label>
  );
}
