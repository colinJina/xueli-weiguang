import type { ComponentProps } from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { Button } from "@/components/ui/button";

import { cn } from "@/lib/utils";

const iconButtonVariants = cva("rounded-full text-muted-foreground", {
  variants: {
    variant: {
      ghost:
        "border-transparent bg-transparent hover:border-white/10 hover:bg-white/[0.04] hover:text-foreground",
      surface:
        "border-border bg-surface hover:border-borderStrong hover:bg-panelHover hover:text-foreground",
      soft: "border-white/[0.08] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.06] hover:text-foreground",
    },
    size: {
      sm: "h-9 w-9",
      default: "h-10 w-10",
      lg: "h-11 w-11",
    },
  },
  defaultVariants: {
    variant: "soft",
    size: "default",
  },
});

export interface IconButtonProps
  extends ComponentProps<"button">, VariantProps<typeof iconButtonVariants> {}

function IconButton({ className, size, variant, ...props }: IconButtonProps) {
  return (
    <Button
      className={cn(iconButtonVariants({ className, size, variant }))}
      data-slot="icon-button"
      size="icon"
      type="button"
      variant="ghost"
      {...props}
    />
  );
}

export { IconButton, iconButtonVariants };
