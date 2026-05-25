import type { ArchiveVideoItem } from "@/components/archive/archive-data";
import { VideoArchiveCard } from "@/components/archive/video-archive-card";

type ArchiveGridProps = {
  items: readonly ArchiveVideoItem[];
};

export function ArchiveGrid({ items }: ArchiveGridProps) {
  const orderedItems = [...items].sort((left, right) => left.order - right.order);

  if (orderedItems.length === 0) {
    return (
      <div className="archive-grid-empty">
        <p className="archive-grid-empty__eyebrow">NO MATCH</p>
        <h2 className="archive-grid-empty__title">当前筛选下没有可展示的作品</h2>
        <p className="archive-grid-empty__copy">
          调整分类或色调范围后，这里会重新排列聚合页卡片。
        </p>
      </div>
    );
  }

  return (
    <div className="archive-grid">
      {orderedItems.map((item, index) => (
        <div
          className={`archive-grid__item archive-grid__item--slot-${index + 1}`}
          key={item.id}
        >
          <VideoArchiveCard item={item} />
        </div>
      ))}
    </div>
  );
}
