import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const chipVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-full border font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20",
  {
    variants: {
      variant: {
        default:
          "border-white/[0.08] bg-white/[0.03] text-muted hover:border-white/15 hover:bg-white/[0.055] hover:text-foreground",
        selected: "border-white/15 bg-reverse text-black-soft",
        strong:
          "border-white/10 bg-white/[0.06] text-foreground hover:border-white/16",
        count: "border-transparent bg-white/[0.06] text-muted",
        overlay:
          "border-white/10 bg-black/55 text-muted backdrop-blur-sm hover:border-white/16 hover:text-foreground",
      },
      size: {
        xs: "min-h-6 gap-1.5 px-2.5 py-1 text-[0.7rem]",
        sm: "min-h-9 gap-2 px-3.5 py-1.5 text-xs",
        md: "min-h-10 gap-2 px-4 py-2 text-sm",
        count: "min-h-0 px-[7px] py-[3px] font-sans text-[0.72rem] leading-none",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "sm",
    },
  },
);

export interface ChipProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof chipVariants> {}

function Chip({ className, size, variant, ...props }: ChipProps) {
  return <span className={cn(chipVariants({ className, size, variant }))} {...props} />;
}

export { Chip, chipVariants };
