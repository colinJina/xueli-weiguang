import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type ArchiveFilterBarProps = {
  categories: readonly string[];
  activeCategory: string;
  onCategoryChange: (category: string) => void;
  toneControl?: ReactNode;
};

export function ArchiveFilterBar({
  categories,
  activeCategory,
  onCategoryChange,
  toneControl,
}: ArchiveFilterBarProps) {
  const hasCategories = categories.length > 0;
  const normalizedActiveCategory =
    hasCategories && categories.includes(activeCategory) ? activeCategory : categories[0];

  return (
    <div className="archive-filter-row">
      <div className="archive-filter-row__left">
        <p className="archive-filter-label">类型</p>
        <div className="archive-filter-pills">
          {hasCategories ? (
            categories.map((category) => {
              const isActive = normalizedActiveCategory === category;

              return (
                <button
                  aria-pressed={isActive}
                  key={category}
                  className={cn(
                    "archive-filter-pill",
                    isActive && "archive-filter-pill--active",
                  )}
                  onClick={() => onCategoryChange(category)}
                  type="button"
                >
                  {category}
                </button>
              );
            })
          ) : (
            <span className="archive-filter-empty">暂无分类</span>
          )}
        </div>
      </div>

      {toneControl ? <div className="archive-filter-row__right">{toneControl}</div> : null}
    </div>
  );
}
