"use client";

// Adapted from shadcn/ui; see docs/shadcn-ui.md for source and license.
import type { ComponentProps } from "react";
import { Dialog as SheetPrimitive } from "radix-ui";
import { cva, type VariantProps } from "class-variance-authority";
import { DialogOverlay } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export const Sheet = SheetPrimitive.Root;
export const SheetTrigger = SheetPrimitive.Trigger;
export const SheetClose = SheetPrimitive.Close;
export const SheetTitle = SheetPrimitive.Title;
export const SheetDescription = SheetPrimitive.Description;

const sheetVariants = cva(
  "fixed z-[100] flex flex-col border-border bg-panel text-foreground shadow-overlay outline-none",
  {
    variants: {
      side: {
        left: "inset-y-0 left-0 h-dvh w-[min(88vw,320px)] border-r p-5",
        right: "inset-y-0 right-0 h-dvh w-[min(88vw,320px)] border-l p-5",
        bottom:
          "inset-x-0 bottom-0 max-h-[90dvh] overflow-y-auto rounded-t-xl border-t p-5 pb-[max(20px,env(safe-area-inset-bottom))]",
      },
    },
    defaultVariants: { side: "right" },
  },
);

export function SheetContent({
  className,
  side,
  ...props
}: ComponentProps<typeof SheetPrimitive.Content> &
  VariantProps<typeof sheetVariants>) {
  return (
    <SheetPrimitive.Portal>
      <DialogOverlay className="bg-black/60 backdrop-blur-none" />
      <SheetPrimitive.Content
        className={cn(sheetVariants({ side }), className)}
        data-slot="sheet-content"
        {...props}
      />
    </SheetPrimitive.Portal>
  );
}
