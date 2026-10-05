"use client";

import type { ReactNode } from "react";
import { ArchiveColorPalette } from "@/components/archive/archive-color-palette";
import { ArchiveHorizontalWheelScroll } from "@/components/archive/archive-horizontal-wheel-scroll";
import type { ArchiveChangeOptions } from "@/components/archive/use-archive-videos";
import { FilterButton } from "@/components/ui/filter-button";
import { IconButton } from "@/components/ui/icon-button";
import CloseIcon from "@/components/icons/shared/close-16.svg";
import { selectSingleToneKey } from "@/lib/videos/archive-href";
import type { FilterPatch } from "@/lib/videos/archive-href";
import { ARCHIVE_MAX_TAG_FILTERS } from "@/lib/videos/archive-filters";
import { TONE_PRESETS } from "@/lib/videos/tone-options";
import type { ArchiveDictionaries, ArchiveFilters } from "@/lib/videos/types";
import { cn } from "@/lib/utils";

type Props = ArchiveDictionaries & {
  filters: ArchiveFilters;
  onChange: (patch: FilterPatch, options?: ArchiveChangeOptions) => void;
};

export function ArchiveFilterBar({
  categories,
  tags,
  filters,
  onChange,
}: Props) {
  const hasFilters =
    filters.categoryId ||
    filters.tagIds.length ||
    filters.toneKeys.length ||
    filters.colors.length;
  return (
    <div className="grid min-w-0 grid-cols-1 gap-4 border-b border-border py-4 pb-5">
      <div className="flex min-w-0 flex-wrap items-start justify-between gap-x-8 gap-y-4">
        <FilterRow className="min-w-0 flex-1" label="分类">
          <ArchiveHorizontalWheelScroll className="max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max gap-2.5 pb-1">
              <FilterButton
                active={!filters.categoryId}
                onClick={() => onChange({ categoryId: null })}
              >
                全部
              </FilterButton>
              {categories.map((category) => (
                <FilterButton
                  active={filters.categoryId === category.id}
                  key={category.id}
                  onClick={() => onChange({ categoryId: category.id })}
                >
                  {category.name}
                </FilterButton>
              ))}
            </div>
          </ArchiveHorizontalWheelScroll>
        </FilterRow>
        <FilterRow label="色调">
          <div className="flex flex-wrap items-center gap-1 md:-translate-y-2">
            {TONE_PRESETS.map((tone) => {
              const active = filters.toneKeys.includes(tone.key);
              return (
                <IconButton
                  aria-label={
                    active ? `清除${tone.name}色调筛选` : `筛选${tone.name}色调`
                  }
                  aria-pressed={active}
                  className={cn(active && "bg-white/[0.08]")}
                  key={tone.key}
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    onChange({
                      toneKeys: selectSingleToneKey(filters.toneKeys, tone.key),
                    })
                  }
                >
                  <span
                    aria-hidden="true"
                    className={cn(
                      "h-3.5 w-3.5 rounded-full transition",
                      active &&
                        "ring-2 ring-white/85 ring-offset-2 ring-offset-background",
                    )}
                    style={{ backgroundColor: tone.colorHex }}
                  />
                </IconButton>
              );
            })}
            <ArchiveColorPalette filters={filters} onChange={onChange} />
          </div>
        </FilterRow>
      </div>
      {tags.length ? (
        <FilterRow label="标签">
          <ArchiveHorizontalWheelScroll className="max-w-full overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            <div className="flex min-w-max gap-2 pb-1">
              <FilterButton
                active={!filters.tagIds.length}
                onClick={() => onChange({ tagIds: [] })}
              >
                全部
              </FilterButton>
              {tags.map((tag) => {
                const active = filters.tagIds.includes(tag.id);
                return (
                  <FilterButton
                    active={active}
                    disabled={
                      !active &&
                      filters.tagIds.length >= ARCHIVE_MAX_TAG_FILTERS
                    }
                    key={tag.id}
                    onClick={() =>
                      onChange({
                        tagIds: active
                          ? filters.tagIds.filter((id) => id !== tag.id)
                          : [...filters.tagIds, tag.id],
                      })
                    }
                  >
                    {tag.name}
                  </FilterButton>
                );
              })}
            </div>
          </ArchiveHorizontalWheelScroll>
        </FilterRow>
      ) : null}
      {hasFilters ? (
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted">
          {filters.colors.map((color, index) => (
            <FilterButton
              aria-label={`移除自定义颜色 ${index + 1} ${color.hex}`}
              className="gap-2 font-mono"
              key={index}
              onClick={() =>
                onChange({
                  colors: filters.colors.filter((_, i) => i !== index),
                })
              }
            >
              <span
                aria-hidden="true"
                className="h-3 w-3 rounded-full ring-1 ring-white/20"
                style={{ backgroundColor: color.hex }}
              />
              {color.hex} · {color.precision}
              <CloseIcon aria-hidden="true" className="h-3 w-3" />
            </FilterButton>
          ))}
          {filters.colors.length > 1 ? (
            <span>
              {filters.colorMode === "all" ? "匹配全部颜色" : "匹配任意颜色"}
            </span>
          ) : null}
          <FilterButton
            onClick={() =>
              onChange({
                categoryId: null,
                tagIds: [],
                toneKeys: [],
                colors: [],
                colorMode: "any",
              })
            }
          >
            <CloseIcon aria-hidden="true" className="h-3 w-3" />
            清除筛选
          </FilterButton>
        </div>
      ) : null}
    </div>
  );
}

function FilterRow({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-3.5 max-md:w-full max-md:flex-col max-md:gap-2",
        className,
      )}
    >
      <p className="mt-2 shrink-0 text-[0.68rem] tracking-[0.18em] text-subtle">
        {label}
      </p>
      <div className="min-w-0 max-w-full flex-1 max-md:w-full">{children}</div>
    </div>
  );
}
