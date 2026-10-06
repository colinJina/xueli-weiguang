import { VideoArchiveCard } from "@/components/archive/video-archive-card";
import { ArchiveVirtualGrid } from "@/components/archive/archive-virtual-grid";
import { StatePanel } from "@/components/ui/state-panel";
import { Button } from "@/components/ui/button";
import type { ArchiveVideoItem } from "@/lib/videos/types";

type ArchiveGridProps = {
  items: ArchiveVideoItem[];
  hasMore?: boolean;
  query?: string;
  onClearSearch?: () => void;
};

export function ArchiveGrid({ items, hasMore = false, query = "", onClearSearch }: ArchiveGridProps) {
  if (items.length === 0) {
    return (
      <StatePanel title="暂无符合条件的 PV" description={query ? "尝试调整关键词、分类、标签或颜色筛选" : "尝试调整分类、标签或色调筛选"}>
        {query && onClearSearch ? <Button variant="secondary" onClick={onClearSearch}>清除搜索</Button> : null}
      </StatePanel>
    );
  }

  if (items.length > 72) {
    return <ArchiveVirtualGrid items={items} hasMore={hasMore} />;
  }

  return (
    <div
      className="grid grid-cols-1 items-start gap-4 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 xl:gap-6"
      role="list"
    >
      {items.map((item) => (
        <div className="h-full w-full min-w-0" key={item.id} role="listitem">
          <VideoArchiveCard item={item} />
        </div>
      ))}
    </div>
  );
}
