import { ReactNode } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { QiluMark } from "@/components/ui/qilu-mark";

type AuthShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
  footer,
}: AuthShellProps) {
  return (
    <main className="relative flex h-screen items-center justify-center overflow-hidden bg-background px-5 py-6 text-foreground">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-line" />
      <div className="pointer-events-none absolute left-1/2 top-0 h-full w-px bg-line/70" />
      <div className="pointer-events-none absolute left-[calc(50%-112px)] top-1/2 h-px w-56 bg-line/70" />

      <section className="relative w-full max-w-md overflow-y-auto">
        <div className="mb-6 flex flex-col items-center text-center">
          <QiluMark size="lg" />
          <p className="mt-4 text-sm tracking-[0.32em] text-muted">{eyebrow}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-foreground">
            {title}
          </h1>
          <p className="mt-2 max-w-sm text-sm leading-6 text-muted">
            {description}
          </p>
        </div>

        <Card>
          <CardContent className="p-5 sm:p-6">{children}</CardContent>
        </Card>

        <p className="mt-4 text-center text-sm text-muted">{footer}</p>
      </section>
    </main>
  );
}
