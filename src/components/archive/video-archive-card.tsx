import Link from "next/link";
import { Chip } from "@/components/ui/chip";
import { SourceBadge } from "@/components/video/source-badge";

import ArchiveCoverFallbackIcon from "@/components/icons/archive/cover-image-fallback.svg";
import { VideoToneSwatches } from "@/components/video/video-tone-swatches";
import type { ArchiveVideoItem } from "@/lib/videos/types";

type VideoArchiveCardProps = {
  item: ArchiveVideoItem;
};

function CoverFallback() {
  return (
    <div className="flex aspect-[16/9] h-full w-full items-center justify-center bg-surface">
      <ArchiveCoverFallbackIcon
        aria-hidden="true"
        className="h-12 w-12 text-subtle"
      />
    </div>
  );
}

export function VideoArchiveCard({ item }: VideoArchiveCardProps) {
  const visibleTags = item.tags.slice(0, 4);
  const hasVisibleTones = item.tones.some((tone) => tone.colorHex);
  const hasMetaGroup = visibleTags.length > 0 || hasVisibleTones;

  return (
    <Link
      className="group relative isolate flex h-full w-full min-w-0 flex-col rounded-lg border border-border bg-panel [--card-active-shadow:0_0_18px_rgb(255_255_255_/_0.1),0_6px_18px_rgb(0_0_0_/_0.22)] transition-[border-color,box-shadow,transform] duration-[240ms] ease-out hover:z-10 hover:-translate-y-0.5 hover:border-white/25 hover:shadow-[shadow:var(--card-active-shadow)] focus-visible:z-10 focus-visible:-translate-y-0.5 focus-visible:border-white/25 focus-visible:shadow-[shadow:var(--card-active-shadow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background motion-reduce:transform-none motion-reduce:transition-none"
      href={`/video/${item.id}`}
    >
      <div
        className="relative aspect-[16/9] overflow-hidden rounded-t-lg bg-surface [transform:translateZ(0)]"
        style={{
          WebkitBackfaceVisibility: "hidden",
          WebkitTransform: "translate3d(0, 0, 0)",
        }}
      >
        {item.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            className="block h-full w-full origin-bottom rounded-t-lg object-contain transform-gpu transition duration-300 will-change-transform group-hover:scale-[1.015] motion-reduce:transform-none motion-reduce:transition-none"
            loading="lazy"
            referrerPolicy="no-referrer"
            src={item.coverUrl}
          />
        ) : (
          <CoverFallback />
        )}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-surface"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[6px] bg-panel"
        />

        <div className="absolute inset-x-5 bottom-5 flex min-w-0 items-end justify-end gap-4">
          <SourceBadge platform={item.storageProvider} label={item.sourceLabel} />
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-4 rounded-b-lg bg-panel p-4">
        <div className="space-y-3">
          <h2 className="min-h-[2.6rem] line-clamp-2 text-[1.1rem] font-bold leading-[1.18] tracking-[-0.04em] text-foreground transition duration-200 group-hover:text-white">
            {item.title}
          </h2>
        </div>

        {hasMetaGroup ? (
          <div className="mt-auto flex flex-col items-end gap-2.5">
            {visibleTags.length > 0 ? (
              <div className="flex w-full flex-wrap gap-2">
                {visibleTags.map((tag) => (
                  <Chip size="xs" key={tag.id}>{tag.name}</Chip>
                ))}
              </div>
            ) : null}

            {hasVisibleTones ? (
              <VideoToneSwatches
                className="w-full pt-0.5"
                tones={item.tones}
              />
            ) : null}
          </div>
        ) : null}

        <div
          className={
            hasMetaGroup
              ? "flex items-center justify-between gap-3 border-t border-white/[0.05] pt-3"
              : "mt-auto flex items-center justify-between gap-3 border-t border-white/[0.05] pt-3"
          }
        >
          <span className="min-w-0 truncate font-sans text-[0.72rem] uppercase tracking-[0.08em] text-subtle">
            {item.authorName}
          </span>
          <div className="flex shrink-0 items-center gap-2 text-[0.72rem] text-subtle">
            <span>{item.likeCountLabel} 点赞</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
