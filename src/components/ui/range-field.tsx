"use client";

import type { ComponentProps } from "react";
import { Slider } from "@/components/ui/slider";

type RangeFieldProps = Omit<
  ComponentProps<typeof Slider>,
  "value" | "defaultValue" | "onValueChange" | "onValueCommit"
> & {
  label: string;
  value: number;
  valueLabel?: string;
  onValueChange: (value: number) => void;
  onValueCommit?: (value: number) => void;
};

export function RangeField({
  label,
  value,
  valueLabel,
  onValueChange,
  onValueCommit,
  ...props
}: RangeFieldProps) {
  return (
    <div className="space-y-2 text-xs text-muted-foreground">
      <span className="flex justify-between">
        <span>{label}</span>
        <span>{valueLabel ?? value}</span>
      </span>
      <Slider
        aria-label={label}
        aria-valuetext={valueLabel}
        value={[value]}
        onValueChange={([next]) => onValueChange(next)}
        onValueCommit={([next]) => onValueCommit?.(next)}
        {...props}
      />
    </div>
  );
}
