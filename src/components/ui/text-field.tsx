import * as React from "react";

import { cn } from "@/lib/utils";

export interface TextFieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  icon?: React.ReactNode;
  label: React.ReactNode;
  labelClassName?: string;
  wrapperClassName?: string;
}

const TextField = React.forwardRef<HTMLInputElement, TextFieldProps>(
  ({ className, icon, label, labelClassName, wrapperClassName, ...props }, ref) => {
    return (
      <label className={cn("block space-y-2", wrapperClassName)}>
        <span
          className={cn(
            "inline-flex items-center gap-1.5 font-sans text-[11px] uppercase tracking-[0.22em] text-muted",
            labelClassName,
          )}
        >
          {icon}
          {label}
        </span>
        <input
          className={cn(
            "h-12 w-full rounded-md border border-border bg-surface px-4 text-sm text-foreground outline-none transition placeholder:text-subtle focus:border-borderStrong focus:bg-panel",
            className,
          )}
          ref={ref}
          {...props}
        />
      </label>
    );
  },
);

TextField.displayName = "TextField";

export { TextField };
