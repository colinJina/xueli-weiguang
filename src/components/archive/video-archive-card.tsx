import Link from "next/link";

import { VideoSourceIcon } from "@/components/ui/video-source-icon";
import type { ArchiveVideoItem, VideoDictionaryItem } from "@/lib/videos/types";

type VideoArchiveCardProps = {
  item: ArchiveVideoItem;
};

function CoverFallback() {
  return (
    <div className="flex aspect-[4/3] h-full w-full items-center justify-center bg-[linear-gradient(180deg,#171719_0%,#080808_100%)]">
      <svg
        aria-hidden="true"
        className="h-12 w-12 text-subtle"
        fill="none"
        viewBox="0 0 48 48"
      >
        <rect
          height="26"
          rx="5"
          stroke="currentColor"
          strokeWidth="1.5"
          width="34"
          x="7"
          y="11"
        />
        <path
          d="m18 29 5-5 4 4 3-3 6 6"
          stroke="currentColor"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="1.5"
        />
        <circle cx="18" cy="20" r="2" fill="currentColor" />
      </svg>
    </div>
  );
}

export function VideoArchiveCard({ item }: VideoArchiveCardProps) {
  const visibleTags = item.tags.slice(0, 4);
  const visibleTones = item.tones.filter((tone) => tone.colorHex).slice(0, 4);

  return (
    <Link
      className="group isolate flex h-full w-full min-w-0 flex-col overflow-hidden rounded-[22px] border border-white/[0.07] bg-[#121214] transition duration-200 hover:-translate-y-0.5"
      href={`/video/${item.id}`}
    >
      <div
        className="relative overflow-hidden rounded-t-[22px] bg-[#080808] [transform:translateZ(0)]"
        style={{
          WebkitBackfaceVisibility: "hidden",
          WebkitTransform: "translate3d(0, 0, 0)",
        }}
      >
        {item.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            className="block h-auto w-full origin-bottom rounded-t-[22px] transform-gpu transition duration-300 will-change-transform group-hover:scale-[1.015]"
            loading="lazy"
            referrerPolicy="no-referrer"
            src={item.coverUrl}
          />
        ) : (
          <CoverFallback />
        )}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-[#080808]"
        />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[6px]——#141415 bg-[#141415]"
        />

        <div className="absolute inset-x-5 bottom-5 flex min-w-0 items-end justify-end gap-4">
          <span className="inline-flex h-[34px] max-w-full items-center gap-2 rounded-full border border-white/20 bg-black/55 px-3 text-[0.72rem] font-medium tracking-[0.04em] text-foreground backdrop-blur-sm">
            <VideoSourceIcon
              className="h-[18px] w-[18px]"
              platform={item.storageProvider}
            />
            <span className="min-w-0 truncate">{item.sourceLabel}</span>
          </span>
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-[18px] bg-[#141415] p-[18px] pb-4 max-md:p-4">
        <div className="space-y-3">
          <h2 className="min-h-[2.6rem] line-clamp-2 text-[1.1rem] font-bold leading-[1.18] tracking-[-0.04em] text-foreground transition duration-200 group-hover:text-white">
            {item.title}
          </h2>
          <div className="flex items-center justify-between gap-4 max-sm:flex-col max-sm:items-stretch">
            <div className="flex min-w-0 flex-1 flex-wrap gap-2">
              {visibleTags.map((tag) => (
                <span
                  className="inline-flex items-center rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-[5px] text-[0.72rem] text-subtle"
                  key={`${tag.id}-${tag.name}`}
                >
                  {tag.name}
                </span>
              ))}
            </div>

            {visibleTones.length > 0 ? (
              <div
                className="flex shrink-0 items-center gap-2 pt-0.5"
                aria-label="视频色调"
              >
                {visibleTones.map((tone) => (
                  <ToneSwatch item={tone} key={`${tone.id}-${tone.name}`} />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-auto flex items-center justify-between gap-3 border-t border-white/[0.05] pt-3">
          <span className="min-w-0 truncate font-sans text-[0.72rem] uppercase tracking-[0.08em] text-subtle">
            {item.authorName}
          </span>
          <div className="flex shrink-0 items-center gap-2 text-[0.72rem] text-subtle">
            <span>{item.likeCountLabel} 喜欢</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function ToneSwatch({ item }: { item: VideoDictionaryItem }) {
  if (!item.colorHex) {
    return null;
  }

  return (
    <span
      aria-hidden="true"
      className="h-2.5 w-2.5 rounded-full"
      style={{ backgroundColor: item.colorHex }}
    />
  );
}
