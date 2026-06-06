import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type FormMessageVariant = "error" | "success" | "info" | "loading";

type FormMessageProps = {
  children: ReactNode;
  className?: string;
  icon: ReactNode;
  variant?: FormMessageVariant;
};

const messageClassByVariant: Record<FormMessageVariant, string> = {
  error: "border-white/15 bg-white/[0.04] text-foreground",
  success: "border-white/10 bg-white/[0.03] text-muted",
  info: "border-white/10 bg-white/[0.03] text-muted",
  loading: "border-white/10 bg-white/[0.03] text-muted",
};

export function FormMessage({
  children,
  className,
  icon,
  variant = "info",
}: FormMessageProps) {
  return (
    <p
      className={cn(
        "flex items-start gap-2 rounded-md border px-4 py-3 text-sm",
        messageClassByVariant[variant],
        className,
      )}
    >
      <span className="mt-0.5 text-foreground">{icon}</span>
      <span className="flex-1">{children}</span>
    </p>
  );
}
