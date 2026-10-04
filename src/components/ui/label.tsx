"use client";

import type { ComponentProps } from "react";
import { Label as LabelPrimitive } from "radix-ui";

import { cn } from "@/lib/utils";

export function Label({
  className,
  ...props
}: ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      className={cn("text-sm font-medium", className)}
      data-slot="label"
      {...props}
    />
  );
}
