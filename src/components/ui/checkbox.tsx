"use client";

// Adapted from shadcn/ui; see docs/shadcn-ui.md for source and license.
import type { ComponentProps } from "react";
import { Checkbox as CheckboxPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export function Checkbox({
  className,
  ...props
}: ComponentProps<typeof CheckboxPrimitive.Root>) {
  return (
    <CheckboxPrimitive.Root
      className={cn(
        "peer inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-sm border border-borderStrong bg-surface text-primary-foreground transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=indeterminate]:bg-primary",
        className,
      )}
      data-slot="checkbox"
      {...props}
    >
      <CheckboxPrimitive.Indicator className="flex items-center justify-center">
        <svg
          aria-hidden="true"
          className="h-3 w-3"
          viewBox="0 0 16 16"
          fill="none"
        >
          <path
            d={props.checked === "indeterminate" ? "M3 8h10" : "m3 8 3 3 7-7"}
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </CheckboxPrimitive.Indicator>
    </CheckboxPrimitive.Root>
  );
}
