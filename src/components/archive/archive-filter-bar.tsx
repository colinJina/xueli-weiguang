import type { ReactNode } from "react";
import Link from "next/link";

import { TONE_FILTER_OPTIONS } from "@/lib/videos/tone-options";
import type { ArchiveFilters } from "@/lib/videos/get-videos";
import type { VideoDictionaryItem } from "@/lib/videos/serialize-video";
import { cn } from "@/lib/utils";

type ArchiveFilterBarProps = {
  categories: readonly VideoDictionaryItem[];
  filters: ArchiveFilters;
};

type FilterPatch = Partial<{
  categoryId: string | null;
  tagIds: string[];
  toneKeys: string[];
  page: number;
}>;

const filterPillClass =
  "inline-flex min-h-[34px] shrink-0 items-center rounded-full border px-[15px] text-[0.84rem] font-semibold transition duration-200 hover:border-white/15 hover:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/90";

function buildArchiveHref(filters: ArchiveFilters, patch: FilterPatch) {
  const nextFilters = {
    categoryId: patch.categoryId !== undefined ? patch.categoryId : filters.categoryId,
    tagIds: patch.tagIds ?? filters.tagIds,
    toneKeys: patch.toneKeys ?? filters.toneKeys,
    page: patch.page ?? 1,
  };
  const params = new URLSearchParams();

  if (nextFilters.categoryId) {
    params.set("category", nextFilters.categoryId);
  }

  if (nextFilters.tagIds.length > 0) {
    params.set("tags", nextFilters.tagIds.join(","));
  }

  if (nextFilters.toneKeys.length > 0) {
    params.set("tones", nextFilters.toneKeys.join(","));
  }

  if (nextFilters.page > 1) {
    params.set("page", String(nextFilters.page));
  }

  const query = params.toString();
  return query ? `/archive?${query}` : "/archive";
}

function selectSingleToneKey(selectedKeys: readonly string[], key: string) {
  return selectedKeys.includes(key) ? [] : [key];
}

export function getArchivePageHref(filters: ArchiveFilters, page: number) {
  return buildArchiveHref(filters, { page });
}

export function ArchiveFilterBar({ categories, filters }: ArchiveFilterBarProps) {
  return (
    <div className="grid gap-4 overflow-hidden border-b border-white/[0.06] py-[14px] pb-5 lg:grid-cols-2 lg:gap-8">
      <FilterRow label="类型">
        <FilterLink
          active={!filters.categoryId}
          href={buildArchiveHref(filters, { categoryId: null })}
        >
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

      <FilterRow align="end" label="色调">
        {TONE_FILTER_OPTIONS.map((tone) => {
          const isActive = filters.toneKeys.includes(tone.key);

          return (
            <Link
              aria-label={isActive ? `清除${tone.label}色色调筛选` : `筛选${tone.label}色色调`}
              aria-pressed={isActive}
              className={cn(
                "group relative inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full transition duration-200 hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/90",
                isActive && "bg-white/[0.08]",
              )}
              href={buildArchiveHref(filters, {
                toneKeys: selectSingleToneKey(filters.toneKeys, tone.key),
              })}
              key={tone.key}
            >
              <span
                className={cn(
                  "h-3.5 w-3.5 rounded-full transition duration-200 group-hover:scale-110",
                  isActive && "h-4 w-4",
                )}
                style={{ backgroundColor: tone.colorHex }}
              />
              <span
                aria-hidden="true"
                className="pointer-events-none absolute bottom-full left-1/2 mb-2 h-6 w-10 -translate-x-1/2 rounded-full opacity-0 shadow-overlay transition duration-200 group-hover:translate-y-[-2px] group-hover:opacity-100 group-focus-visible:translate-y-[-2px] group-focus-visible:opacity-100"
                style={{ backgroundColor: tone.colorHex }}
              />
            </Link>
          );
        })}
      </FilterRow>
    </div>
  );
}

function FilterRow({
  align = "start",
  children,
  label,
}: {
  align?: "start" | "end";
  children: ReactNode;
  label: string;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-start gap-3.5 max-md:flex-col max-md:gap-2",
        align === "end" && "lg:justify-end",
      )}
    >
      <p className="mt-2 shrink-0 font-sans text-[0.68rem] tracking-[0.18em] text-subtle">
        {label}
      </p>
      <div
        className={cn(
          "flex min-w-0 flex-1 items-center gap-2.5 overflow-hidden pb-0.5 max-md:w-full max-md:flex-wrap",
          align === "end" && "lg:flex-none lg:justify-end",
        )}
      >
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
      className={cn(
        filterPillClass,
        active
          ? "border-white/15 bg-white-soft text-black-soft"
          : "border-white/[0.08] bg-white/[0.03] text-subtle",
      )}
      href={href}
    >
      {children}
    </Link>
  );
}
