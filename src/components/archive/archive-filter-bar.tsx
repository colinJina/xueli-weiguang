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
  const filterPillClass =
    "min-h-[34px] shrink-0 rounded-full border border-white/[0.08] bg-white/[0.03] px-[15px] text-[0.84rem] font-semibold text-subtle transition duration-200 hover:border-white/15 hover:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/90";

  return (
    <div className="flex items-center justify-between gap-[18px] overflow-hidden border-b border-white/[0.06] py-[14px] pb-4 max-xl:flex-wrap">
      <div className="flex min-w-0 flex-1 items-center gap-3.5">
        <p className="shrink-0 font-sans text-[0.68rem] tracking-[0.18em] text-subtle">类型</p>
        <div className="flex min-w-0 items-center gap-2.5 overflow-x-auto pb-0.5 max-md:flex-wrap">
          {hasCategories ? (
            categories.map((category) => {
              const isActive = normalizedActiveCategory === category;

              return (
                <button
                  aria-pressed={isActive}
                  key={category}
                  className={cn(
                    filterPillClass,
                    isActive && "border-white/15 bg-white-soft text-black-soft",
                  )}
                  onClick={() => onCategoryChange(category)}
                  type="button"
                >
                  {category}
                </button>
              );
            })
          ) : (
            <span className="whitespace-nowrap text-[0.78rem] text-subtle">暂无分类</span>
          )}
        </div>
      </div>

      {toneControl ? <div className="shrink-0 max-xl:w-full">{toneControl}</div> : null}
    </div>
  );
}
