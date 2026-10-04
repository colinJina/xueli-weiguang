"use client";

import {
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import {
  formatTonePercentage,
  getToneSwatchDiameter,
  getVisibleVideoTones,
} from "@/lib/videos/tone-swatches";
import type { VideoToneItem } from "@/lib/videos/types";
import { cn } from "@/lib/utils";

export function VideoToneSwatches({
  tones,
  className,
}: {
  tones: readonly VideoToneItem[];
  className?: string;
}) {
  const visible = getVisibleVideoTones(tones);
  if (!visible.length) {
    return null;
  }
  return (
    <div
      aria-label="视频色调"
      className={cn("flex items-center gap-1.5", className)}
    >
      {visible.map((tone) => (
        <ToneSwatch key={tone.id} tone={tone} />
      ))}
    </div>
  );
}

function ToneSwatch({ tone }: { tone: VideoToneItem }) {
  if (!tone.colorHex) {
    return null;
  }

  const diameter = getToneSwatchDiameter(tone.percentage);
  const colorLabel = tone.colorHex.toLowerCase();
  const percentageLabel = formatTonePercentage(tone.percentage);
  const label =
    percentageLabel === null
      ? colorLabel
      : `${colorLabel} · ${percentageLabel}`;

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          aria-label={label}
          className="group/tone relative inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-foreground"
          role="img"
          tabIndex={0}
        >
          <span
            aria-hidden="true"
            className="rounded-full border border-white/15 transition-transform duration-150 group-hover/tone:scale-125 group-focus/tone:scale-125 motion-reduce:transition-none"
            style={{
              backgroundColor: tone.colorHex,
              height: diameter,
              width: diameter,
            }}
          />
        </span>
      </TooltipTrigger>
      <TooltipContent className="font-mono font-medium" side="top">
        {label}
      </TooltipContent>
    </Tooltip>
  );
}
