"use client";

import type { MouseEvent, ReactNode } from "react";
import { useEffect, useState } from "react";
import Link from "next/link";

import { ArchiveHorizontalWheelScroll } from "@/components/archive/archive-horizontal-wheel-scroll";
import { InlineLoadingMark } from "@/components/ui/inline-loading-mark";
import { buildArchiveHref, selectSingleToneKey } from "@/lib/videos/archive-href";
import type { ArchiveFilters, ToneFamilyItem, VideoDictionaryItem } from "@/lib/videos/types";
import { cn } from "@/lib/utils";

type ArchiveFilterBarProps = {
  categories: readonly VideoDictionaryItem[];
  filters: ArchiveFilters;
  toneFamilies: readonly ToneFamilyItem[];
};

const filterPillClass =
  "inline-flex min-h-[34px] shrink-0 items-center rounded-full border px-[15px] text-[0.84rem] font-semibold transition duration-200 hover:border-white/15 hover:text-muted focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/90";

export function ArchiveFilterBar({ categories, filters, toneFamilies }: ArchiveFilterBarProps) {
  const [pendingToneKey, setPendingToneKey] = useState<string | null>(null);
  const activeToneFamilies = toneFamilies.filter((tone) => tone.isActive);
  const isTonePending = pendingToneKey !== null;
  const currentToneKey = filters.toneKeys.join(",");

  useEffect(() => {
    setPendingToneKey(null);
  }, [currentToneKey]);

  function handleToneClick(event: MouseEvent<HTMLAnchorElement>, toneKey: string) {
    if (isTonePending) {
      event.preventDefault();
      return;
    }

    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }

    setPendingToneKey(toneKey);
  }

  return (
    <div className="grid gap-4 overflow-hidden border-b border-white/[0.06] py-[14px] pb-5 lg:grid-cols-2 lg:gap-8">
      <FilterRow contentClassName="w-full max-w-full lg:w-[34rem]" label="类型" scrollable>
        <div className="inline-flex min-w-max items-center gap-2.5 pr-1">
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
        </div>
      </FilterRow>

      <FilterRow align="end" label="色调">
        {activeToneFamilies.map((tone) => {
          const isActive = filters.toneKeys.includes(tone.key);
          const isPending = pendingToneKey === tone.key;

          return (
            <Link
              aria-label={isActive ? `清除${tone.name}色调筛选` : `筛选${tone.name}色调`}
              aria-busy={isPending || undefined}
              aria-disabled={isTonePending && !isPending ? true : undefined}
              aria-pressed={isActive}
              className={cn(
                "group relative inline-flex h-[34px] w-[34px] shrink-0 items-center justify-center rounded-full transition duration-200 hover:bg-white/[0.04] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white/90",
                isActive && "bg-white/[0.08]",
                isTonePending && !isPending && "pointer-events-none opacity-35",
                isPending && "bg-white/[0.09]",
              )}
              href={buildArchiveHref(filters, {
                toneKeys: selectSingleToneKey(filters.toneKeys, tone.key),
              })}
              key={tone.key}
              onClick={(event) => handleToneClick(event, tone.key)}
            >
              <span
                className={cn(
                  "h-3.5 w-3.5 rounded-full transition duration-200 group-hover:scale-110",
                  isActive && "h-4 w-4",
                  isPending && "scale-75 opacity-25 group-hover:scale-75",
                )}
                style={{ backgroundColor: tone.colorHex }}
              />
              {isPending ? (
                <InlineLoadingMark
                  className="absolute h-[22px] w-[22px]"
                  label={`正在应用${tone.name}色调筛选`}
                />
              ) : (
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute bottom-full left-1/2 mb-2 h-6 w-10 -translate-x-1/2 rounded-full opacity-0 shadow-overlay transition duration-200 group-hover:translate-y-[-2px] group-hover:opacity-100 group-focus-visible:translate-y-[-2px] group-focus-visible:opacity-100"
                  style={{ backgroundColor: tone.colorHex }}
                />
              )}
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
  contentClassName,
  label,
  scrollable = false,
}: {
  align?: "start" | "end";
  children: ReactNode;
  contentClassName?: string;
  label: string;
  scrollable?: boolean;
}) {
  const contentClassNameValue = cn(
    "min-w-0 flex-1 pb-0.5 max-md:w-full",
    scrollable
      ? "overflow-x-auto overflow-y-hidden [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
      : "flex items-center gap-2.5 overflow-hidden max-md:flex-wrap",
    contentClassName,
    align === "end" && "lg:flex-none lg:justify-end",
  );

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
      {scrollable ? (
        <ArchiveHorizontalWheelScroll className={contentClassNameValue}>
          {children}
        </ArchiveHorizontalWheelScroll>
      ) : (
        <div className={contentClassNameValue}>{children}</div>
      )}
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
