import Link from "next/link";

import type { ArchiveVideoItem } from "@/lib/videos/serialize-video";

type VideoArchiveCardProps = {
  item: ArchiveVideoItem;
};

function CoverFallback() {
  return (
    <div className="flex aspect-[4/3] h-full w-full items-center justify-center bg-[linear-gradient(180deg,#171719_0%,#080808_100%)]">
      <svg aria-hidden="true" className="h-12 w-12 text-subtle" fill="none" viewBox="0 0 48 48">
        <rect height="26" rx="5" stroke="currentColor" strokeWidth="1.5" width="34" x="7" y="11" />
        <path d="m18 29 5-5 4 4 3-3 6 6" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" />
        <circle cx="18" cy="20" r="2" fill="currentColor" />
      </svg>
    </div>
  );
}

export function VideoArchiveCard({ item }: VideoArchiveCardProps) {
  return (
    <Link
      className="group block overflow-hidden rounded-[22px] border border-white/[0.07] bg-[#121214] transition duration-200 hover:-translate-y-0.5 hover:border-white/15"
      href={`/video/${item.id}`}
    >
      <div className="relative overflow-hidden border-b border-white/[0.04] bg-[#080808]">
        {item.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- Public archive cards do not store intrinsic dimensions yet, so a plain img preserves the source ratio without forced cropping.
          <img
            alt=""
            className="block h-auto w-full transition duration-300 group-hover:scale-[1.015]"
            loading="lazy"
            referrerPolicy="no-referrer"
            src={item.coverUrl}
          />
        ) : (
          <CoverFallback />
        )}

        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.015),rgba(0,0,0,0.12)_42%,rgba(0,0,0,0.56)_100%)]" />

        <div className="absolute inset-x-5 top-5 flex items-center justify-between gap-4">
          <span className="rounded-[10px] border border-white/[0.08] bg-black/50 px-2.5 py-1.5 text-[0.7rem] font-semibold text-subtle backdrop-blur-sm">
            {item.sourceLabel}
          </span>
          <span className="rounded-[10px] border border-white/[0.08] bg-black/50 px-2.5 py-1.5 font-sans text-[0.7rem] font-semibold uppercase tracking-[0.14em] text-subtle backdrop-blur-sm">
            {item.metricLabel}
          </span>
        </div>

        <div className="absolute inset-x-5 bottom-5 flex items-end justify-between gap-4">
          <span className="max-w-[148px] rounded-[10px] border border-white/[0.08] bg-black/55 px-2.5 py-[5px] text-[0.72rem] font-semibold leading-[1.35] text-muted backdrop-blur-sm">
            {item.category.name}
          </span>
          <span className="flex h-[34px] w-[34px] items-center justify-center rounded-full border border-white/20 bg-black/55 backdrop-blur-sm">
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
            {[...item.tags, ...item.tones].slice(0, 5).map((tag) => (
              <span
                className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-2.5 py-[5px] text-[0.72rem] text-subtle"
                key={`${tag.id}-${tag.name}`}
              >
                {tag.name}
              </span>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/[0.05] pt-3">
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
