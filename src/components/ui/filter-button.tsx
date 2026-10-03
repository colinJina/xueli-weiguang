import type { ButtonHTMLAttributes } from "react";
import { chipVariants } from "@/components/ui/chip";
import { cn } from "@/lib/utils";

export function FilterButton({
  active = false,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { active?: boolean }) {
  return (
    <button
      aria-pressed={active}
      className={cn(
        chipVariants({ variant: active ? "selected" : "default", size: "sm" }),
        className,
      )}
      type="button"
      {...props}
    />
  );
}
