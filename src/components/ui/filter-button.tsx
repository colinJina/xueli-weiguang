"use client";

import type { ComponentProps } from "react";
import { Toggle } from "@/components/ui/toggle";

export function FilterButton({
  active = false,
  className,
  ...props
}: Omit<ComponentProps<typeof Toggle>, "pressed"> & { active?: boolean }) {
  return (
    <Toggle pressed={active} className={className} type="button" {...props} />
  );
}
