"use client";

// Adapted from shadcn/ui; see docs/shadcn-ui.md for source and license.
import type { ComponentProps, CSSProperties } from "react";
import { Slider as SliderPrimitive } from "radix-ui";
import { cn } from "@/lib/utils";

export function Slider({
  className,
  value,
  defaultValue,
  trackStyle,
  "aria-label": ariaLabel,
  "aria-valuetext": ariaValueText,
  "aria-labelledby": ariaLabelledBy,
  "aria-describedby": ariaDescribedBy,
  ...props
}: ComponentProps<typeof SliderPrimitive.Root> & {
  trackStyle?: CSSProperties;
}) {
  const values = value ?? defaultValue ?? [props.min ?? 0];
  return (
    <SliderPrimitive.Root
      className={cn(
        "relative flex h-7 w-full touch-none select-none items-center data-[disabled]:opacity-50",
        className,
      )}
      data-slot="slider"
      value={value}
      defaultValue={defaultValue}
      {...props}
    >
      <SliderPrimitive.Track
        className="relative h-2 w-full grow overflow-hidden rounded-full bg-borderStrong"
        style={trackStyle}
      >
        <SliderPrimitive.Range
          className={cn("absolute h-full", !trackStyle && "bg-foreground")}
        />
      </SliderPrimitive.Track>
      {values.map((_, index) => (
        <SliderPrimitive.Thumb
          aria-label={ariaLabel}
          aria-valuetext={ariaValueText}
          aria-labelledby={ariaLabelledBy}
          aria-describedby={ariaDescribedBy}
          key={index}
          className="block h-4 w-4 rounded-full border border-black-soft bg-white-soft shadow-sm transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none"
        />
      ))}
    </SliderPrimitive.Root>
  );
}
