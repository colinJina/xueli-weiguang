import type { ComponentProps, ReactNode } from "react";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

import { cn } from "@/lib/utils";

export interface TextFieldProps extends ComponentProps<"input"> {
  icon?: ReactNode;
  label: ReactNode;
  labelClassName?: string;
  wrapperClassName?: string;
}

function TextField({
  className,
  icon,
  label,
  labelClassName,
  wrapperClassName,
  ...props
}: TextFieldProps) {
  return (
    <Label className={cn("block space-y-2 font-normal", wrapperClassName)}>
      <span
        className={cn(
          "inline-flex items-center gap-1.5 font-sans text-[11px] uppercase tracking-[0.22em] text-muted-foreground",
          labelClassName,
        )}
      >
        {icon}
        {label}
      </span>
      <Input className={className} {...props} />
    </Label>
  );
}

export { TextField };
