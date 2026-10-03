"use client";

import { ArchiveClientShell } from "@/components/archive/archive-client-shell";
import { ArchiveFilterBar } from "@/components/archive/archive-filter-bar";
import { ArchiveGrid } from "@/components/archive/archive-grid";
import { ArchivePagination } from "@/components/archive/archive-pagination";
import { useArchiveVideos } from "@/components/archive/use-archive-videos";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { InlineLoadingMark } from "@/components/ui/inline-loading-mark";
import { formatCompactNumber } from "@/lib/videos/metrics";
import type {
  ArchiveDictionaries,
  ArchiveVideosPage,
} from "@/lib/videos/types";

type Props = {
  dictionaries: ArchiveDictionaries;
  initialPage: ArchiveVideosPage;
  initialError?: boolean;
};

export function ArchiveRealtimeView({
  dictionaries,
  initialPage,
  initialError = false,
}: Props) {
  const { filters, page, status, changeFilters, retry } = useArchiveVideos(
    initialPage,
    initialError,
  );
  const activeCategory =
    dictionaries.categories.find(
      (category) => category.id === filters.categoryId,
    )?.name ?? "全部作品";
  const hasResult = !initialError || page !== initialPage;
  return (
    <ArchiveClientShell
      activeChannel={activeCategory}
      channelCount={formatCompactNumber(page.totalCount)}
      supportCount={String(dictionaries.tags.length).padStart(2, "0")}
    >
      <section className="page-container">
        <ArchiveFilterBar
          {...dictionaries}
          filters={filters}
          onChange={changeFilters}
        />
      </section>
      <section
        aria-busy={status === "loading"}
        className="page-container pb-16 pt-5"
      >
        <div
          aria-live="polite"
          className="mb-4 flex min-h-6 items-center gap-2 text-xs text-muted"
          role="status"
        >
          {status === "loading" ? (
            <>
              <InlineLoadingMark label="正在更新作品" />
              <span>
                {hasResult ? "正在更新，保留上次结果" : "正在载入作品"}
              </span>
            </>
          ) : status === "ready" ? (
            <span>
              共 {page.totalCount} 部作品 · 第 {page.filters.page} 页
            </span>
          ) : null}
        </div>
        {status === "error" ? (
          <div className="mb-5 flex flex-wrap items-center gap-3" role="alert">
            <FormMessage
              className="flex-1"
              variant="error"
              icon={
                <svg
                  aria-hidden="true"
                  className="h-4 w-4"
                  viewBox="0 0 20 20"
                  fill="none"
                >
                  <circle cx="10" cy="10" r="8" stroke="currentColor" />
                  <path
                    d="M10 5v6m0 3v1"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
              }
            >
              {hasResult
                ? "更新失败，以下仍是上次筛选的结果。"
                : "暂时无法载入作品，请重试。"}
            </FormMessage>
            <Button onClick={retry} size="sm" variant="secondary">
              重试
            </Button>
          </div>
        ) : null}
        {hasResult ? (
          <>
            <ArchiveGrid items={page.items} />
            <ArchivePagination
              page={page.filters.page}
              pageCount={page.pageCount}
              onChange={(next) => changeFilters({ page: next })}
            />
          </>
        ) : null}
      </section>
    </ArchiveClientShell>
  );
}
