import type { HomeCardItem, HomeCardLayout } from "@/components/home/home-content";
import { HomeMediaCard } from "@/components/home/home-media-card";
import { cn } from "@/lib/utils";

type HomeFeaturedGridProps = {
  items: readonly HomeCardItem[];
};

const layoutClasses: Record<HomeCardLayout, string> = {
  standard: "lg:mt-3",
  compact: "lg:mt-1",
  feature: "lg:-mt-4",
  ghost: "lg:mt-10",
};

export function HomeFeaturedGrid({ items }: HomeFeaturedGridProps) {
  return (
    <div
      id="featured-grid"
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:items-start lg:gap-5"
    >
      {items.map((item) => (
        <div className={cn("min-w-0", layoutClasses[item.layout])} key={item.id}>
          <HomeMediaCard item={item} />
        </div>
      ))}
    </div>
  );
}
