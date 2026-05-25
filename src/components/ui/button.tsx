import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-md border text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary:
          "border-transparent bg-reverse px-5 py-3 text-black hover:-translate-y-px hover:bg-white",
        secondary:
          "border-border bg-surface px-5 py-3 text-foreground hover:border-borderStrong hover:bg-panelHover",
        ghost:
          "border-transparent bg-transparent px-3 py-2 text-muted hover:text-foreground",
      },
      size: {
        default: "min-h-11",
        sm: "min-h-9 px-3 py-2 text-xs",
        lg: "min-h-12 px-6 py-3.5",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);

Button.displayName = "Button";

export { Button, buttonVariants };
