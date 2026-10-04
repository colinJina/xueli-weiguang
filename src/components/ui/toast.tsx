"use client";

// Adapted from shadcn/ui; see docs/shadcn-ui.md for source and license.
import type { ComponentProps } from "react";
import { Toast as ToastPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export const ToastProvider = ToastPrimitive.Provider;
export const Toast = ToastPrimitive.Root;
export const ToastTitle = ToastPrimitive.Title;
export const ToastClose = ToastPrimitive.Close;

export function ToastViewport({
  className,
  ...props
}: ComponentProps<typeof ToastPrimitive.Viewport>) {
  return (
    <ToastPrimitive.Viewport
      className={cn(
        "pointer-events-none fixed inset-x-0 top-4 z-[120] flex list-none flex-col items-center gap-2 px-4 outline-none sm:top-5",
        className,
      )}
      data-slot="toast-viewport"
      {...props}
    />
  );
}
