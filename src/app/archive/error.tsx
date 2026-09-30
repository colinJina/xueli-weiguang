"use client";

import { RouteErrorView } from "@/components/layout/route-error-view";

export default function ArchiveError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteErrorView
      backHref="/"
      backLabel="返回首页"
      description="作品归档暂时没有完整返回。你可以重新尝试，现有筛选和已发布作品不会因此被修改。"
      eyebrow="ARCHIVE UNAVAILABLE"
      onRetry={reset}
      title="归档暂时不可用"
    />
  );
}
