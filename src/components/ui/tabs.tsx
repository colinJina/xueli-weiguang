"use client";

// Adapted from shadcn/ui; see docs/shadcn-ui.md for source and license.
import type { ComponentProps } from "react";
import { Tabs as TabsPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

export function Tabs(props: ComponentProps<typeof TabsPrimitive.Root>) {
  return <TabsPrimitive.Root data-slot="tabs" {...props} />;
}

export function TabsList({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      className={cn("flex items-center gap-2", className)}
      data-slot="tabs-list"
      {...props}
    />
  );
}

const tabVariants = cva(
  "inline-flex items-center justify-center gap-1.5 border font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        pill: "min-h-10 rounded-full border-border bg-surface px-4 py-2 text-sm text-muted-foreground hover:border-borderStrong hover:text-foreground data-[state=active]:border-white/15 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground",
        line: "min-h-11 flex-1 border-transparent border-b-2 px-4 py-4 text-sm text-muted-foreground hover:text-foreground data-[state=active]:border-b-foreground data-[state=active]:text-foreground",
      },
    },
    defaultVariants: { variant: "pill" },
  },
);

export function TabsTrigger({
  className,
  variant,
  ...props
}: ComponentProps<typeof TabsPrimitive.Trigger> &
  VariantProps<typeof tabVariants>) {
  return (
    <TabsPrimitive.Trigger
      className={cn(tabVariants({ variant }), className)}
      data-slot="tabs-trigger"
      {...props}
    />
  );
}

export function TabsContent({
  className,
  ...props
}: ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      className={cn(
        "outline-none focus-visible:ring-2 focus-visible:ring-ring",
        className,
      )}
      data-slot="tabs-content"
      {...props}
    />
  );
}
