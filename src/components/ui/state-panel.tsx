import type { ReactNode } from "react";
import EmptyIcon from "@/components/icons/shared/empty.svg";
import AlertIcon from "@/components/icons/shared/alert-circle.svg";
import { cn } from "@/lib/utils";

type StatePanelProps = {
  title: string;
  description?: string;
  kind?: "empty" | "error" | "info";
  align?: "left" | "center";
  compact?: boolean;
  className?: string;
  id?: string;
  headingLevel?: 1 | 2;
  children?: ReactNode;
};

export function StatePanel({ title, description, kind = "empty", align = "left", compact = false, className, id, headingLevel = 2, children }: StatePanelProps) {
  const Icon = kind === "error" ? AlertIcon : EmptyIcon;
  const Heading = headingLevel === 1 ? "h1" : "h2";
  return (
    <section id={id} role={kind === "error" ? "alert" : "status"}
      className={cn("flex flex-col justify-center rounded-lg border border-border bg-panel p-6 text-foreground sm:p-8", compact ? "min-h-0" : "min-h-[280px]", align === "center" && "items-center text-center", className)}>
      <Icon aria-hidden="true" className={cn("text-subtle", compact ? "h-5 w-5" : "h-10 w-10")} />
      <Heading className={cn("mt-4 font-bold tracking-tight", compact ? "text-base" : "text-2xl")}>{title}</Heading>
      {description ? <p className="mt-3 max-w-xl text-sm leading-6 text-muted-foreground">{description}</p> : null}
      {children ? <div className="mt-6 flex flex-wrap gap-3">{children}</div> : null}
    </section>
  );
}
