import Link from "next/link";

import type { ArchiveVideoItem } from "@/components/archive/archive-data";
import { cn } from "@/lib/utils";

type VideoArchiveCardProps = {
  item: ArchiveVideoItem;
};

const coverHeights: Record<ArchiveVideoItem["cardSize"], string> = {
  short: "min-h-[260px]",
  medium: "min-h-[420px]",
  tall: "min-h-[620px]",
};

const sourceLabels: Record<ArchiveVideoItem["source"], string> = {
  bilibili: "Bilibili",
  youtube: "YouTube",
  native: "Native",
};

export function VideoArchiveCard({ item }: VideoArchiveCardProps) {
  return (
    <Link
      className="group block overflow-hidden rounded-[22px] border border-white/[0.07] bg-[#121214] transition duration-200 hover:-translate-y-0.5 hover:border-white/15"
      href={`/video/${item.id}`}
    >
      <div
        className={cn(
          "relative overflow-hidden border-b border-white/[0.04] bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.06),transparent_38%),linear-gradient(180deg,#171719_0%,#080808_100%)]",
          coverHeights[item.cardSize],
        )}
      >
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.015),rgba(0,0,0,0.1))]" />

        <div className="absolute inset-x-5 top-5 flex items-center justify-between gap-4">
          <span className="rounded-[10px] border border-white/[0.08] bg-black/40 px-2.5 py-1.5 text-[0.7rem] font-semibold text-subtle">
            {sourceLabels[item.source]}
          </span>
          <span className="rounded-[10px] border border-white/[0.08] bg-black/40 px-2.5 py-1.5 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-subtle">
            {item.metric}
          </span>
        </div>

        <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4">
          <span className="max-w-[112px] rounded-[10px] border border-white/[0.08] bg-black/50 px-2.5 py-[5px] text-[0.72rem] font-semibold leading-[1.35] text-muted">
            {item.chipLabel}
          </span>
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/20 bg-black/55">
            <span className="flex h-5 w-5 items-center justify-center rounded-full border border-white/55">
              <span className="h-1.5 w-1.5 rounded-full bg-white" />
            </span>
          </span>
        </div>
      </div>

      <div className="flex flex-col gap-[18px] bg-[#141415] p-[18px] pb-4 max-md:p-4">
        <div className="space-y-3">
          <h2 className="text-[1.1rem] font-bold leading-[1.18] tracking-[-0.04em] text-foreground transition duration-200 group-hover:text-white">
            {item.title}
          </h2>
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span
                className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-[5px] text-[0.72rem] text-subtle"
                key={tag}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/[0.05] pt-3">
          <span className="font-sans text-[0.72rem] uppercase tracking-[0.08em] text-subtle">
            {item.subtitle}
          </span>
          <div className="flex items-center gap-1.5">
            {Array.from({ length: 3 }).map((_, index) => (
              <span
                className={cn(
                  "h-2 w-2 rounded-full bg-white/30",
                  index === 0 && "bg-white",
                )}
                key={index}
              />
            ))}
          </div>
        </div>
      </div>
    </Link>
  );
}
