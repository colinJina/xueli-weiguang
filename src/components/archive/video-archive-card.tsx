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
    <Link className="archive-card group block" href={`/video/${item.id}`}>
      <div
        className={cn(
          "archive-card__cover",
          coverHeights[item.cardSize],
        )}
      >
        <div className="archive-card__cover-overlay" />

        <div className="absolute inset-x-5 top-5 flex items-center justify-between gap-4">
          <span className="archive-card__meta-pill">
            {sourceLabels[item.source]}
          </span>
          <span className="archive-card__meta-pill archive-card__meta-pill--mono">
            {item.metric}
          </span>
        </div>

        <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4">
          <span className="archive-card__chip">
            {item.chipLabel}
          </span>
          <span className="archive-card__focus-ring">
            <span className="archive-card__focus-core">
              <span className="archive-card__focus-dot" />
            </span>
          </span>
        </div>
      </div>

      <div className="archive-card__body">
        <div className="space-y-3">
          <h2 className="archive-card__title">
            {item.title}
          </h2>
          <div className="archive-card__tags">
            {item.tags.map((tag) => (
              <span className="archive-card__tag" key={tag}>
                {tag}
              </span>
            ))}
          </div>
        </div>

        <div className="archive-card__footer">
          <span className="archive-card__subtitle">
            {item.subtitle}
          </span>
          <div className="archive-card__dots">
            {Array.from({ length: 3 }).map((_, index) => (
              <span
                className={cn(
                  "archive-card__dot",
                  index === 0 && "archive-card__dot--active",
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
