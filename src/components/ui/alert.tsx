import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const alertVariants = cva(
  "flex items-start gap-2 rounded-md border px-4 py-3 text-sm",
  {
    variants: {
      variant: {
        default: "border-white/10 bg-white/[0.03] text-muted-foreground",
        destructive: "border-white/15 bg-white/[0.04] text-foreground",
      },
    },
    defaultVariants: { variant: "default" },
  },
);

export function Alert({
  className,
  variant,
  ...props
}: ComponentProps<"div"> & VariantProps<typeof alertVariants>) {
  return (
    <div
      role="alert"
      className={cn(alertVariants({ variant }), className)}
      data-slot="alert"
      {...props}
    />
  );
}

export function AlertDescription({
  className,
  ...props
}: ComponentProps<"div">) {
  return (
    <div
      className={cn("flex-1", className)}
      data-slot="alert-description"
      {...props}
    />
  );
}
