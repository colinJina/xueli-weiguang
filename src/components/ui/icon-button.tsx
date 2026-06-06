import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const iconButtonVariants = cva(
  "inline-flex items-center justify-center rounded-full border font-semibold text-muted transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        ghost:
          "border-transparent bg-transparent hover:border-white/10 hover:bg-white/[0.04] hover:text-foreground",
        surface:
          "border-border bg-surface hover:border-borderStrong hover:bg-panelHover hover:text-foreground",
        soft:
          "border-white/[0.08] bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.06] hover:text-foreground",
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
  },
);

export interface IconButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof iconButtonVariants> {}

const IconButton = React.forwardRef<HTMLButtonElement, IconButtonProps>(
  ({ className, size, variant, ...props }, ref) => {
    return (
      <button
        className={cn(iconButtonVariants({ className, size, variant }))}
        ref={ref}
        type="button"
        {...props}
      />
    );
  },
);

IconButton.displayName = "IconButton";

export { IconButton, iconButtonVariants };
