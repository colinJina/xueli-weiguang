import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export function Skeleton({ className, ...props }: ComponentProps<"div">) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "motion-safe:animate-pulse rounded-lg bg-white/[0.035]",
        className,
      )}
      data-slot="skeleton"
      {...props}
    />
  );
}
