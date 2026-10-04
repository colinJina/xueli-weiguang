"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { parseArchiveFilters } from "@/lib/videos/archive-filters";
import { buildArchiveHref } from "@/lib/videos/archive-href";
import type { FilterPatch } from "@/lib/videos/archive-href";
import { ArchiveFeedQuery } from "@/lib/videos/archive-feed-query";
import type { ArchiveLoadStatus } from "@/lib/videos/archive-feed-query";
import type { ArchiveVideoFeed } from "@/lib/videos/types";

export type ArchiveChangeOptions = { immediate?: boolean; replace?: boolean };

// Two short-lived entries preserve back navigation without putting cards in history/localStorage.
const feedCache = new Map<string, { feed: ArchiveVideoFeed; scrollY: number; savedAt: number }>();
const CACHE_LIFETIME_MS = 60_000;

async function loadArchiveFeed(filters: ArchiveVideoFeed["filters"], signal: AbortSignal, cursor?: string): Promise<ArchiveVideoFeed> {
  const url = new URL(buildArchiveHref(filters, {}), window.location.origin);
  url.pathname = "/api/archive/videos";
  url.searchParams.set("stream", "1");
  if (cursor) {
    url.searchParams.set("cursor", cursor);
  }
  const response = await fetch(url, { cache: "no-store", signal });
  if (!response.ok) {
    throw new Error("Archive request failed");
  }
  const feed: ArchiveVideoFeed = await response.json();
  if (!Array.isArray(feed.items) || !feed.filters || typeof feed.hasMore !== "boolean" || (feed.nextCursor !== null && typeof feed.nextCursor !== "string") || (feed.hasMore && !feed.nextCursor)) {
    throw new Error("Invalid archive response");
  }
  return feed;
}

export function useArchiveVideos(initialPage: ArchiveVideoFeed, initialError: boolean) {
  const [filters, setFilters] = useState(initialPage.filters);
  const [page, setPage] = useState(initialPage);
  const [hasResult, setHasResult] = useState(!initialError);
  const [status, setStatus] = useState<ArchiveLoadStatus>(initialError ? "error" : "ready");
  const [moreStatus, setMoreStatus] = useState<ArchiveLoadStatus>("ready");
  const filtersRef = useRef(filters);
  const pageRef = useRef(page);
  const hasResultRef = useRef(hasResult);
  const queryRef = useRef<ArchiveFeedQuery | null>(null);
  const cacheKeyRef = useRef(buildArchiveHref(initialPage.filters, {}));
  const restoringPositionRef = useRef(false);

  const savePosition = useCallback(() => {
    // Next can reset scroll after changing the route but before effect cleanup.
    // Keep the last archive position instead of overwriting it with the detail page's 0.
    if (restoringPositionRef.current || window.location.pathname !== "/archive" || !hasResultRef.current || buildArchiveHref(pageRef.current.filters, {}) !== cacheKeyRef.current) {
      return;
    }
    feedCache.delete(cacheKeyRef.current);
    feedCache.set(cacheKeyRef.current, { feed: pageRef.current, scrollY: window.scrollY, savedAt: Date.now() });
    while (feedCache.size > 2) {
      const oldest = feedCache.keys().next().value;
      if (oldest !== undefined) {
        feedCache.delete(oldest);
      }
    }
  }, []);

  useEffect(() => {
    filtersRef.current = initialPage.filters;
    pageRef.current = initialPage;
    hasResultRef.current = !initialError;
    setFilters(initialPage.filters);
    setPage(initialPage);
    setHasResult(!initialError);
    setStatus(initialError ? "error" : "ready");
    const query = new ArchiveFeedQuery(initialPage, initialError, {
      load: loadArchiveFeed,
      onStatus: setStatus,
      onMoreStatus: setMoreStatus,
      onResult: (result) => {
        pageRef.current = result;
        filtersRef.current = result.filters;
        hasResultRef.current = true;
        setPage(result);
        setFilters(result.filters);
        setHasResult(true);
        savePosition();
      },
    });
    queryRef.current = query;
    let frame: number | undefined;
    let restoreFrame: number | undefined;
    function restoreFromUrl() {
      if (window.location.pathname !== "/archive") {
        return;
      }
      if (restoreFrame !== undefined) {
        cancelAnimationFrame(restoreFrame);
      }
      restoringPositionRef.current = false;
      const next = { ...parseArchiveFilters(Object.fromEntries(new URLSearchParams(window.location.search))), page: 1 };
      const key = buildArchiveHref(next, {});
      cacheKeyRef.current = key;
      const cached = window.history.state?.archiveFeed ? feedCache.get(key) : undefined;
      if (cached && Date.now() - cached.savedAt < CACHE_LIFETIME_MS) {
        // Effect replay and onResult happen before scrolling. Do not replace the
        // cached position with 0 while the restored grid is still being mounted.
        restoringPositionRef.current = true;
        query.restore(cached.feed);
        restoreFrame = requestAnimationFrame(() => {
          restoreFrame = requestAnimationFrame(() => {
            window.scrollTo(0, cached.scrollY);
            restoringPositionRef.current = false;
            savePosition();
          });
        });
      } else {
        filtersRef.current = next;
        setFilters(next);
        query.schedule(next, true);
      }
      window.history.replaceState({ ...window.history.state, archiveFeed: true }, "", key);
    }
    const actual = { ...parseArchiveFilters(Object.fromEntries(new URLSearchParams(window.location.search))), page: 1 };
    const key = buildArchiveHref(actual, {});
    if (window.history.state?.archiveFeed || key !== buildArchiveHref(initialPage.filters, {})) {
      restoreFromUrl();
    } else {
      cacheKeyRef.current = key;
      window.history.replaceState({ ...window.history.state, archiveFeed: true }, "", key);
    }
    function saveOnScroll() {
      if (frame === undefined) {
        frame = requestAnimationFrame(() => {
          frame = undefined;
          savePosition();
        });
      }
    }
    window.addEventListener("popstate", restoreFromUrl);
    window.addEventListener("scroll", saveOnScroll, { passive: true });
    return () => {
      savePosition();
      window.removeEventListener("popstate", restoreFromUrl);
      window.removeEventListener("scroll", saveOnScroll);
      if (frame !== undefined) {
        cancelAnimationFrame(frame);
      }
      if (restoreFrame !== undefined) {
        cancelAnimationFrame(restoreFrame);
      }
      query.dispose();
      queryRef.current = null;
    };
  }, [initialPage, initialError, savePosition]);

  const changeFilters = useCallback((patch: FilterPatch, options: ArchiveChangeOptions = {}) => {
    savePosition();
    const next = { ...filtersRef.current, ...patch, page: 1 };
    filtersRef.current = next;
    setFilters(next);
    const href = buildArchiveHref(next, {});
    cacheKeyRef.current = href;
    if (href !== window.location.pathname + window.location.search) {
      const state = { ...window.history.state, archiveFeed: true };
      if (options.replace) {
        window.history.replaceState(state, "", href);
      } else {
        window.history.pushState(state, "", href);
      }
    }
    queryRef.current?.schedule(next, options.immediate ?? true);
    window.scrollTo(0, 0);
  }, [savePosition]);

  const retry = useCallback(() => queryRef.current?.schedule(filtersRef.current, true), []);
  const loadMore = useCallback(() => { void queryRef.current?.loadMore(); }, []);
  return { filters, page, hasResult, status, moreStatus, changeFilters, retry, loadMore };
}
