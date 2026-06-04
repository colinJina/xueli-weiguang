import { VideoArchiveCard } from "@/components/archive/video-archive-card";
import type { ArchiveVideoItem } from "@/lib/videos/serialize-video";

type ArchiveGridProps = {
  items: ArchiveVideoItem[];
};

function EmptyArchiveIcon() {
  return (
    <svg aria-hidden="true" className="h-12 w-12 text-subtle" fill="none" viewBox="0 0 48 48">
      <rect height="26" rx="5" stroke="currentColor" strokeWidth="1.5" width="34" x="7" y="11" />
      <path d="M16 20h16M16 27h10" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path d="M12 37h24" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

export function ArchiveGrid({ items }: ArchiveGridProps) {
  if (items.length === 0) {
    return (
      <div className="flex min-h-[420px] flex-col justify-center rounded-3xl border border-white/[0.06] bg-white/[0.02] px-11 py-10 max-md:min-h-[320px] max-md:px-6 max-md:py-7">
        <EmptyArchiveIcon />
        <p className="mt-5 font-sans text-[0.72rem] tracking-[0.18em] text-subtle">NO MATCH</p>
        <h2 className="mt-[18px] text-3xl font-bold tracking-[-0.04em] text-foreground">
          当前筛选下没有可展示的作品
        </h2>
        <p className="mt-3.5 max-w-[560px] text-base leading-[1.8] text-muted">
          调整类型、标签或色调后，这里会重新排列聚合页卡片。
        </p>
      </div>
    );
  }

  return (
    <div
      className="grid grid-cols-1 items-start gap-[18px] md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 xl:gap-6"
      role="list"
    >
      {items.map((item) => (
        <div key={item.id} role="listitem">
          <VideoArchiveCard item={item} />
        </div>
      ))}
    </div>
  );
}
