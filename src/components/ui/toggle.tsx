"use client";

import type { ComponentProps } from "react";
import { Toggle as TogglePrimitive } from "radix-ui";
import { chipVariants } from "@/components/ui/chip";
import { cn } from "@/lib/utils";

export function Toggle({
  className,
  ...props
}: ComponentProps<typeof TogglePrimitive.Root>) {
  return (
    <TogglePrimitive.Root
      className={cn(
        chipVariants({ size: "sm" }),
        "disabled:pointer-events-none disabled:opacity-50 data-[state=on]:border-white/15 data-[state=on]:bg-primary data-[state=on]:text-primary-foreground",
        className,
      )}
      data-slot="toggle"
      {...props}
    />
  );
}
