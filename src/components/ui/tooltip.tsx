"use client";

// Adapted from shadcn/ui; see docs/shadcn-ui.md for source and license.
import type { ComponentProps } from "react";
import { Tooltip as TooltipPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
  className,
  sideOffset = 6,
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        className={cn(
          "z-[110] rounded-lg border border-border bg-black-soft px-2.5 py-1.5 text-xs text-foreground shadow-overlay",
          className,
        )}
        sideOffset={sideOffset}
        data-slot="tooltip-content"
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}
