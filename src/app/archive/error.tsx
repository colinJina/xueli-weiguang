"use client";

import { RouteErrorView } from "@/components/layout/route-error-view";

export default function ArchiveError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteErrorView
      backHref="/"
      backLabel="返回首页"
      description="PV 暂时无法加载，请稍后重试"
      onRetry={reset}
      title="PV 加载失败"
    />
  );
}
