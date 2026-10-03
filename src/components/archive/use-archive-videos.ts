"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { parseArchiveFilters } from "@/lib/videos/archive-filters";
import { buildArchiveHref } from "@/lib/videos/archive-href";
import type { FilterPatch } from "@/lib/videos/archive-href";
import { ArchiveQuery } from "@/lib/videos/archive-query";
import type { ArchiveVideosPage } from "@/lib/videos/types";

export type ArchiveChangeOptions = { immediate?: boolean; replace?: boolean };

async function loadArchivePage(
  filters: ArchiveVideosPage["filters"],
  signal: AbortSignal,
): Promise<ArchiveVideosPage> {
  const href = buildArchiveHref(filters, { page: filters.page });
  const response = await fetch(
    href.replace("/archive", "/api/archive/videos"),
    { cache: "no-store", signal },
  );
  if (!response.ok) {
    throw new Error("Archive request failed");
  }
  // The same application's typed API is the source of this response.
  const page: ArchiveVideosPage = await response.json();
  if (
    !Array.isArray(page.items) ||
    !page.filters ||
    !Number.isFinite(page.totalCount) ||
    !Number.isFinite(page.pageCount)
  ) {
    throw new Error("Invalid archive response");
  }
  return page;
}

export function useArchiveVideos(
  initialPage: ArchiveVideosPage,
  initialError: boolean,
) {
  const [filters, setFilters] = useState(initialPage.filters);
  const [page, setPage] = useState(initialPage);
  const [status, setStatus] = useState<"ready" | "loading" | "error">(
    initialError ? "error" : "ready",
  );
  const filtersRef = useRef(filters);
  const queryRef = useRef<ArchiveQuery | null>(null);

  useEffect(() => {
    filtersRef.current = initialPage.filters;
    setFilters(initialPage.filters);
    setPage(initialPage);
    setStatus(initialError ? "error" : "ready");
    const query = new ArchiveQuery({
      load: loadArchivePage,
      onPending: () => setStatus("loading"),
      onError: () => setStatus("error"),
      onResult: (result) => {
        setPage(result);
        setStatus("ready");
        filtersRef.current = result.filters;
        setFilters(result.filters);
        const href = buildArchiveHref(result.filters, {
          page: result.filters.page,
        });
        if (href !== window.location.pathname + window.location.search) {
          window.history.replaceState(null, "", href);
        }
      },
    });
    queryRef.current = query;
    function restoreFromUrl() {
      const next = parseArchiveFilters(
        Object.fromEntries(new URLSearchParams(window.location.search)),
      );
      filtersRef.current = next;
      setFilters(next);
      query.schedule(next, true);
    }
    const actualFilters = parseArchiveFilters(
      Object.fromEntries(new URLSearchParams(window.location.search)),
    );
    if (
      buildArchiveHref(actualFilters, { page: actualFilters.page }) !==
      buildArchiveHref(initialPage.filters, { page: initialPage.filters.page })
    ) {
      restoreFromUrl();
    }
    window.addEventListener("popstate", restoreFromUrl);
    return () => {
      window.removeEventListener("popstate", restoreFromUrl);
      query.dispose();
      queryRef.current = null;
    };
  }, [initialPage, initialError]);

  const changeFilters = useCallback(
    (patch: FilterPatch, options: ArchiveChangeOptions = {}) => {
      const next = { ...filtersRef.current, ...patch, page: patch.page ?? 1 };
      filtersRef.current = next;
      setFilters(next);
      const href = buildArchiveHref(next, { page: next.page });
      if (href !== window.location.pathname + window.location.search) {
        if (options.replace) {
          window.history.replaceState(null, "", href);
        } else {
          window.history.pushState(null, "", href);
        }
      }
      queryRef.current?.schedule(next, options.immediate ?? true);
    },
    [],
  );

  const retry = useCallback(
    () => queryRef.current?.schedule(filtersRef.current, true),
    [],
  );
  return { filters, page, status, changeFilters, retry };
}
