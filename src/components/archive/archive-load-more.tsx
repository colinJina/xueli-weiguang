"use client";

import { useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { InlineLoadingMark } from "@/components/ui/inline-loading-mark";
import type { ArchiveLoadStatus } from "@/lib/videos/archive-feed-query";

export function ArchiveLoadMore({ hasMore, enabled, status, onLoadMore }: {
  hasMore: boolean;
  enabled: boolean;
  status: ArchiveLoadStatus;
  onLoadMore: () => void;
}) {
  const sentinel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const element = sentinel.current;
    if (!element || !hasMore || !enabled || status !== "ready" || !("IntersectionObserver" in window)) {
      return;
    }
    const observer = new IntersectionObserver((entries) => {
      if (entries.some((entry) => entry.isIntersecting)) {
        onLoadMore();
      }
    }, { rootMargin: "600px 0px" });
    observer.observe(element);
    return () => observer.disconnect();
  }, [hasMore, enabled, status, onLoadMore]);

  return (
    <div ref={sentinel} className="mt-8 flex min-h-20 flex-col items-center justify-center gap-3 border-t border-border pt-5">
      <div aria-live="polite" className="flex items-center gap-2 text-sm text-muted" role={status === "error" ? "alert" : "status"}>
        {status === "loading" ? <InlineLoadingMark label="正在加载更多作品" /> : (
          <svg aria-hidden="true" className="h-4 w-4" viewBox="0 0 20 20" fill="none">
            {status === "error" ? <><circle cx="10" cy="10" r="8" stroke="currentColor" /><path d="M10 5v6m0 3v1" stroke="currentColor" strokeWidth="1.5" /></> : <path d={hasMore ? "M10 3v13m-5-5 5 5 5-5" : "m4 10 4 4 8-8"} stroke="currentColor" strokeWidth="1.5" />}
          </svg>
        )}
        <span>{status === "error" ? "加载失败，已显示的作品仍可浏览。" : status === "loading" ? "正在加载更多作品" : hasMore ? "继续向下浏览" : "已显示全部作品"}</span>
      </div>
      {hasMore && status !== "loading" ? (
        <Button disabled={!enabled} onClick={onLoadMore} size="sm" variant="secondary">
          <svg aria-hidden="true" className="mr-2 h-4 w-4" viewBox="0 0 20 20" fill="none"><path d="M10 4v12m-5-5 5 5 5-5" stroke="currentColor" strokeWidth="1.5" /></svg>
          {status === "error" ? "重试加载" : "加载更多"}
        </Button>
      ) : null}
    </div>
  );
}
