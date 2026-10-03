import type { CSSProperties, InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type RangeFieldProps = Omit<
  InputHTMLAttributes<HTMLInputElement>,
  "type" | "value"
> & {
  label: string;
  value: number;
  valueLabel?: string;
  trackStyle?: CSSProperties;
};

export function RangeField({
  label,
  value,
  valueLabel,
  trackStyle,
  className,
  ...props
}: RangeFieldProps) {
  return (
    <label className="block space-y-2 text-xs text-muted">
      <span className="flex justify-between">
        <span>{label}</span>
        <span>{valueLabel ?? value}</span>
      </span>
      <span className="relative flex h-7 items-center">
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 h-2 rounded-full bg-borderStrong"
          style={trackStyle}
        />
        <input
          aria-label={label}
          className={cn(
            "relative h-7 w-full cursor-pointer appearance-none bg-transparent focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white [&::-webkit-slider-runnable-track]:h-2 [&::-webkit-slider-runnable-track]:rounded-full [&::-webkit-slider-runnable-track]:bg-transparent [&::-webkit-slider-thumb]:-mt-1 [&::-webkit-slider-thumb]:h-4 [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:border [&::-webkit-slider-thumb]:border-black-soft [&::-webkit-slider-thumb]:bg-white-soft [&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-full [&::-moz-range-track]:bg-transparent [&::-moz-range-thumb]:h-4 [&::-moz-range-thumb]:w-4 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:border-black-soft [&::-moz-range-thumb]:bg-white-soft",
            className,
          )}
          type="range"
          value={value}
          {...props}
        />
      </span>
    </label>
  );
}
