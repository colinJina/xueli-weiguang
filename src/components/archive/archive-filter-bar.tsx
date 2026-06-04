import type { ReactNode } from "react";
import Link from "next/link";

import type { ArchiveFilters } from "@/lib/videos/get-videos";
import type { VideoDictionaryItem } from "@/lib/videos/serialize-video";
import { cn } from "@/lib/utils";

type ArchiveFilterBarProps = {
  categories: readonly VideoDictionaryItem[];
  tags: readonly VideoDictionaryItem[];
  tones: readonly VideoDictionaryItem[];
  filters: ArchiveFilters;
};

type FilterPatch = Partial<{
  categoryId: string | null;
  tagIds: string[];
  toneIds: string[];
  page: number;
}>;

const filterPillClass =
  "inline-flex min-h-[34px] shrink-0 items-center rounded-full border border-white/[0.08] bg-white/[0.03] px-[15px] text-[0.84rem] font-semibold text-subtle transition duration-200 hover:border-white/15 hover:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/90";

function buildArchiveHref(filters: ArchiveFilters, patch: FilterPatch) {
  const nextFilters = {
    categoryId: patch.categoryId !== undefined ? patch.categoryId : filters.categoryId,
    tagIds: patch.tagIds ?? filters.tagIds,
    toneIds: patch.toneIds ?? filters.toneIds,
    page: patch.page ?? 1,
  };
  const params = new URLSearchParams();

  if (nextFilters.categoryId) {
    params.set("category", nextFilters.categoryId);
  }

  if (nextFilters.tagIds.length > 0) {
    params.set("tags", nextFilters.tagIds.join(","));
  }

  if (nextFilters.toneIds.length > 0) {
    params.set("tones", nextFilters.toneIds.join(","));
  }

  if (nextFilters.page > 1) {
    params.set("page", String(nextFilters.page));
  }

  const query = params.toString();
  return query ? `/archive?${query}` : "/archive";
}

function toggleId(ids: readonly string[], id: string) {
  return ids.includes(id) ? ids.filter((item) => item !== id) : [...ids, id];
}

export function getArchivePageHref(filters: ArchiveFilters, page: number) {
  return buildArchiveHref(filters, { page });
}

export function ArchiveFilterBar({ categories, tags, tones, filters }: ArchiveFilterBarProps) {
  return (
    <div className="space-y-4 overflow-hidden border-b border-white/[0.06] py-[14px] pb-5">
      <FilterRow label="类型">
        <FilterLink active={!filters.categoryId} href={buildArchiveHref(filters, { categoryId: null })}>
          全部
        </FilterLink>
        {categories.map((category) => (
          <FilterLink
            active={filters.categoryId === category.id}
            href={buildArchiveHref(filters, { categoryId: category.id })}
            key={category.id}
          >
            {category.name}
          </FilterLink>
        ))}
      </FilterRow>

      <FilterRow label="标签">
        {tags.length ? (
          tags.map((tag) => (
            <FilterLink
              active={filters.tagIds.includes(tag.id)}
              href={buildArchiveHref(filters, { tagIds: toggleId(filters.tagIds, tag.id) })}
              key={tag.id}
            >
              {tag.name}
            </FilterLink>
          ))
        ) : (
          <span className="whitespace-nowrap text-[0.78rem] text-subtle">暂无标签</span>
        )}
      </FilterRow>

      <FilterRow label="色调">
        {tones.length ? (
          tones.map((tone, index) => {
            const isActive = filters.toneIds.includes(tone.id);

            return (
              <Link
                aria-pressed={isActive}
                className={cn(
                  "inline-flex min-h-[34px] shrink-0 items-center gap-2 rounded-full border border-white/[0.08] bg-white/[0.03] px-3.5 text-[0.84rem] font-semibold text-subtle transition duration-200 hover:border-white/15 hover:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/90",
                  isActive && "border-white/15 bg-white-soft text-black-soft",
                )}
                href={buildArchiveHref(filters, { toneIds: toggleId(filters.toneIds, tone.id) })}
                key={tone.id}
              >
                <span
                  className={cn(
                    "h-2.5 w-2.5 rounded-full border border-white/15 bg-white/45",
                    isActive && "border-black-soft bg-black-soft",
                  )}
                  style={{ opacity: isActive ? 1 : 0.48 + index * 0.08 }}
                />
                <span>{tone.name}</span>
              </Link>
            );
          })
        ) : (
          <span className="whitespace-nowrap text-[0.78rem] text-subtle">暂无色调</span>
        )}
      </FilterRow>
    </div>
  );
}

function FilterRow({ children, label }: { children: ReactNode; label: string }) {
  return (
    <div className="flex min-w-0 items-start gap-3.5 max-md:flex-col max-md:gap-2">
      <p className="mt-2 shrink-0 font-sans text-[0.68rem] tracking-[0.18em] text-subtle">
        {label}
      </p>
      <div className="flex min-w-0 flex-1 items-center gap-2.5 overflow-x-auto pb-0.5 max-md:w-full max-md:flex-wrap">
        {children}
      </div>
    </div>
  );
}

function FilterLink({
  active,
  children,
  href,
}: {
  active: boolean;
  children: ReactNode;
  href: string;
}) {
  return (
    <Link
      aria-pressed={active}
      className={cn(filterPillClass, active && "border-white/15 bg-white-soft text-black-soft")}
      href={href}
    >
      {children}
    </Link>
  );
}
