"use client";

import { useEffect, useRef } from "react";
import AlertIcon from "@/components/icons/shared/alert-circle.svg";
import CheckIcon from "@/components/icons/shared/check-circle.svg";
import ArrowIcon from "@/components/icons/shared/arrow-right.svg";
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
        {status === "loading" ? <InlineLoadingMark label="正在加载更多 PV" /> : status === "error" ? <AlertIcon aria-hidden="true" className="h-4 w-4" /> : <CheckIcon aria-hidden="true" className="h-4 w-4" />}
        <span>{status === "error" ? "加载失败，已显示的 PV 仍可浏览" : status === "loading" ? "正在加载更多 PV" : hasMore ? "继续向下浏览" : "已显示全部 PV"}</span>
      </div>
      {hasMore && status !== "loading" ? (
        <Button disabled={!enabled} onClick={onLoadMore} size="sm" variant="secondary">
          <ArrowIcon aria-hidden="true" className="h-4 w-4 rotate-90" />
          {status === "error" ? "重试" : "加载更多"}
        </Button>
      ) : null}
    </div>
  );
}
