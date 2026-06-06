import type { ReactNode } from "react";
import Link from "next/link";

import { ArchiveClientShell } from "@/components/archive/archive-client-shell";
import { ArchiveFilterBar, getArchivePageHref } from "@/components/archive/archive-filter-bar";
import { ArchiveGrid } from "@/components/archive/archive-grid";
import { buttonVariants } from "@/components/ui/button";
import { chipVariants } from "@/components/ui/chip";
import { getArchiveVideos, type ArchiveFilters } from "@/lib/videos/get-videos";
import { formatCompactNumber } from "@/lib/videos/serialize-video";
import { cn } from "@/lib/utils";

export const revalidate = 60;

type ArchivePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ArchivePage({ searchParams }: ArchivePageProps) {
  const rawSearchParams = await searchParams;
  const { dictionaries, filters, items, pageCount, totalCount } =
    await getArchiveVideos(rawSearchParams);
  const activeCategory = filters.categoryId
    ? dictionaries.categories.find((category) => category.id === filters.categoryId)?.name
    : null;

  return (
    <ArchiveClientShell
      activeChannel={activeCategory ?? "全部作品"}
      channelCount={formatCompactNumber(totalCount)}
      supportCount={String(dictionaries.tags.length).padStart(2, "0")}
    >
      <section className="page-container">
        <ArchiveFilterBar
          categories={dictionaries.categories}
          filters={filters}
          tags={dictionaries.tags}
          tones={dictionaries.tones}
        />
      </section>

      <section className="page-container pb-16 pt-[22px] max-md:pt-[18px]">
        <ArchiveGrid items={items} />
        <ArchivePagination filters={filters} pageCount={pageCount} />
      </section>
    </ArchiveClientShell>
  );
}

function ArchivePagination({ filters, pageCount }: { filters: ArchiveFilters; pageCount: number }) {
  if (pageCount <= 1) {
    return null;
  }

  const previousPage = Math.max(1, filters.page - 1);
  const nextPage = Math.min(pageCount, filters.page + 1);

  return (
    <nav
      aria-label="分页"
      className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-white/[0.06] pt-5"
    >
      <PageLink disabled={filters.page <= 1} href={getArchivePageHref(filters, previousPage)}>
        <ArrowIcon direction="left" />
        <span>上一页</span>
      </PageLink>

      <div className="flex items-center gap-2">
        {Array.from({ length: pageCount }).map((_, index) => {
          const page = index + 1;
          const isActive = filters.page === page;

          return (
            <Link
              aria-current={isActive ? "page" : undefined}
              className={cn(
                chipVariants({ size: "sm", variant: isActive ? "selected" : "default" }),
                "h-9 w-9 px-0 py-0 font-sans text-[0.78rem]",
              )}
              href={getArchivePageHref(filters, page)}
              key={page}
            >
              {page}
            </Link>
          );
        })}
      </div>

      <PageLink disabled={filters.page >= pageCount} href={getArchivePageHref(filters, nextPage)}>
        <span>下一页</span>
        <ArrowIcon direction="right" />
      </PageLink>
    </nav>
  );
}

function PageLink({
  children,
  disabled,
  href,
}: {
  children: ReactNode;
  disabled: boolean;
  href: string;
}) {
  const className =
    buttonVariants({ variant: "pill", size: "md", className: "gap-2 text-[0.86rem]" });

  if (disabled) {
    return (
      <span className={cn(className, "cursor-not-allowed opacity-40")}>
        {children}
      </span>
    );
  }

  return (
    <Link className={className} href={href}>
      {children}
    </Link>
  );
}

function ArrowIcon({ direction }: { direction: "left" | "right" }) {
  return (
    <svg
      aria-hidden="true"
      className="h-4 w-4"
      fill="none"
      viewBox="0 0 16 16"
    >
      <path
        d={direction === "left" ? "M9.5 4.5 6 8l3.5 3.5" : "M6.5 4.5 10 8l-3.5 3.5"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}
