"use client";

// Adapted from shadcn/ui; see docs/shadcn-ui.md for source and license.
import type { ComponentProps } from "react";
import { Progress as ProgressPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export function Progress({
  className,
  value = 0,
  max = 100,
  ...props
}: ComponentProps<typeof ProgressPrimitive.Root>) {
  const limit = max > 0 ? max : 100;
  const progress = value === null ? null : Math.max(0, Math.min(limit, value));
  return (
    <ProgressPrimitive.Root
      className={cn(
        "relative h-1.5 w-full overflow-hidden rounded-full bg-white/[0.08]",
        className,
      )}
      value={progress}
      max={limit}
      data-slot="progress"
      {...props}
    >
      <ProgressPrimitive.Indicator
        className="h-full w-full rounded-full bg-foreground transition-transform duration-200"
        style={{ transform: `translateX(-${100 - ((progress ?? 0) / limit) * 100}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}
