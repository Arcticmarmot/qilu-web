import { HTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";

export function Card({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cx("rounded-md border border-line bg-panel shadow-subtle", className)}
      {...props}
    />
  );
}

type CardHeaderProps = {
  eyebrow?: string;
  title: string;
};

export function CardHeader({ eyebrow, title }: CardHeaderProps) {
  return (
    <div className="border-b border-line px-5 py-4">
      {eyebrow ? (
        <p className="mb-1 text-xs tracking-[0.24em] text-muted">{eyebrow}</p>
      ) : null}
      <h2 className="text-base font-semibold text-foreground">{title}</h2>
    </div>
  );
}

type CardContentProps = HTMLAttributes<HTMLDivElement> & {
  children: ReactNode;
};

export function CardContent({ className, ...props }: CardContentProps) {
  return <div className={cx("p-5", className)} {...props} />;
}
