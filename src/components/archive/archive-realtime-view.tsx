"use client";

import { ArchiveClientShell } from "@/components/archive/archive-client-shell";
import { ArchiveFilterBar } from "@/components/archive/archive-filter-bar";
import { ArchiveGrid } from "@/components/archive/archive-grid";
import { ArchiveLoadMore } from "@/components/archive/archive-load-more";
import { useArchiveVideos } from "@/components/archive/use-archive-videos";
import AlertIcon from "@/components/icons/shared/alert-circle.svg";
import { StatePanel } from "@/components/ui/state-panel";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { InlineLoadingMark } from "@/components/ui/inline-loading-mark";
import type {
  ArchiveDictionaries,
  ArchiveVideoFeed,
} from "@/lib/videos/types";

type Props = {
  dictionaries: ArchiveDictionaries;
  initialPage: ArchiveVideoFeed;
  initialError?: boolean;
};

export function ArchiveRealtimeView({
  dictionaries,
  initialPage,
  initialError = false,
}: Props) {
  const { filters, page, hasResult, status, moreStatus, changeFilters, retry, loadMore } = useArchiveVideos(
    initialPage,
    initialError,
  );
  return (
    <ArchiveClientShell>
      <section className="page-container">
        <ArchiveFilterBar
          {...dictionaries}
          filters={filters}
          onChange={changeFilters}
        />
      </section>
      <section
        aria-busy={status === "loading"}
        className="page-container pb-16 pt-5 [overflow-anchor:none]"
      >
        <div
          aria-live="polite"
          className="mb-4 flex min-h-6 items-center gap-2 text-xs text-muted"
          role="status"
        >
          {status === "loading" ? (
            <>
              <InlineLoadingMark label="正在加载 PV" />
              <span>
                {hasResult ? "正在更新，保留上次结果" : "正在加载 PV"}
              </span>
            </>
          ) : status === "ready" ? (
            <span>
              已显示 {page.items.length} 个 PV
            </span>
          ) : null}
        </div>
        {status === "error" && !hasResult ? (
          <StatePanel kind="error" title="PV 加载失败" description="请稍后重试">
            <Button onClick={retry} variant="secondary">重试</Button>
          </StatePanel>
        ) : status === "error" ? (
          <div className="mb-5 flex flex-wrap items-center gap-3" role="alert">
            <FormMessage
              className="flex-1"
              variant="error"
              icon={<AlertIcon aria-hidden="true" className="h-4 w-4" />}
            >
              {hasResult
                ? "更新失败，仍显示上次结果"
                : "暂时无法载入 PV，请重试"}
            </FormMessage>
            <Button onClick={retry} size="sm" variant="secondary">
              重试
            </Button>
          </div>
        ) : null}
        {hasResult ? (
          <>
            <ArchiveGrid items={page.items} hasMore={page.hasMore} />
            {page.items.length > 0 ? <ArchiveLoadMore hasMore={page.hasMore} enabled={status === "ready"} status={moreStatus} onLoadMore={loadMore} /> : null}
          </>
        ) : null}
      </section>
    </ArchiveClientShell>
  );
}
