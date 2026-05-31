import type { ArchiveVideoItem } from "@/components/archive/archive-data";
import { VideoArchiveCard } from "@/components/archive/video-archive-card";
import { cn } from "@/lib/utils";

type ArchiveGridProps = {
  items: readonly ArchiveVideoItem[];
};

const slotClasses = [
  "xl:col-start-1 xl:row-start-1 xl:row-span-2",
  "xl:col-start-2 xl:row-start-1 xl:row-span-3",
  "xl:col-start-3 xl:row-start-1 xl:row-span-2",
  "xl:col-start-4 xl:row-start-1 xl:row-span-2",
  "xl:col-start-3 xl:row-start-3 xl:row-span-3",
  "xl:col-start-4 xl:row-start-3 xl:row-span-2",
];

export function ArchiveGrid({ items }: ArchiveGridProps) {
  const orderedItems = [...items].sort((left, right) => left.order - right.order);

  if (orderedItems.length === 0) {
    return (
      <div className="flex min-h-[420px] flex-col justify-center rounded-3xl border border-white/[0.06] bg-white/[0.02] px-11 py-10 max-md:min-h-[320px] max-md:px-6 max-md:py-7">
        <p className="font-sans text-[0.72rem] tracking-[0.18em] text-subtle">NO MATCH</p>
        <h2 className="mt-[18px] text-3xl font-bold tracking-[-0.04em] text-foreground">
          当前筛选下没有可展示的作品
        </h2>
        <p className="mt-3.5 max-w-[560px] text-base leading-[1.8] text-muted">
          调整分类或色调范围后，这里会重新排列聚合页卡片。
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 items-start gap-[18px] md:grid-cols-2 xl:grid-cols-4 xl:grid-rows-[repeat(6,minmax(92px,auto))] xl:gap-x-7 xl:gap-y-6">
      {orderedItems.map((item, index) => (
        <div
          className={cn("min-w-0", slotClasses[index])}
          key={item.id}
        >
          <VideoArchiveCard item={item} />
        </div>
      ))}
    </div>
  );
}
