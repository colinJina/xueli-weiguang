import type { VideoToneItem } from "@/lib/videos/types";
import { cn } from "@/lib/utils";

export function VideoToneSwatches({
  tones,
  className,
}: {
  tones: VideoToneItem[];
  className?: string;
}) {
  const visible = tones.filter((tone) => tone.colorHex).slice(0, 5);
  if (!visible.length) {
    return null;
  }
  return (
    <div
      aria-label="视频色调"
      className={cn("flex items-center gap-2", className)}
    >
      {visible.map((tone) => {
        const description = `${tone.name} ${tone.colorHex}${tone.percentage !== null ? `，占比 ${Math.round(tone.percentage * 100)}%` : ""}`;
        return (
          <span
            aria-label={description}
            className="h-3 w-3 rounded-full ring-1 ring-white/10"
            key={tone.id}
            role="img"
            style={{ backgroundColor: tone.colorHex }}
            title={description}
          />
        );
      })}
    </div>
  );
}
