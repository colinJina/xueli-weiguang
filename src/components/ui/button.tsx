import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center border font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary:
          "rounded-md border-transparent bg-reverse text-black-soft hover:-translate-y-px hover:bg-white",
        secondary:
          "rounded-md border-border bg-surface text-foreground hover:border-borderStrong hover:bg-panelHover",
        ghost:
          "rounded-md border-transparent bg-transparent text-muted hover:text-foreground",
        pill:
          "rounded-full border-border bg-surface text-muted hover:border-borderStrong hover:bg-panelHover hover:text-foreground",
        pillActive:
          "rounded-full border-white/15 bg-reverse text-black-soft hover:bg-white",
      },
      size: {
        default: "min-h-11 px-5 py-3 text-sm",
        sm: "min-h-9 px-3.5 py-2 text-xs",
        md: "min-h-10 px-4 py-2 text-sm",
        lg: "min-h-12 px-6 py-3.5 text-base",
        hero: "min-h-14 px-8 py-3 text-[1.35rem] tracking-[-0.03em]",
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
