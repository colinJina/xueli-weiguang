import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type PageShellProps = {
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
  className?: string;
};

export function PageShell({
  eyebrow,
  title,
  description,
  children,
  className,
}: PageShellProps) {
  return (
    <section className={cn("page-container py-12 sm:py-16", className)}>
      <div className="mb-10 space-y-4 border-b border-white/8 pb-8">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          {title}
        </h1>
        <p className="section-copy">{description}</p>
      </div>
      {children}
    </section>
  );
}
