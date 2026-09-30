"use client";

import { RouteErrorView } from "@/components/layout/route-error-view";

export default function VideoError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <RouteErrorView
      backHref="/archive"
      backLabel="返回作品归档"
      description="视频详情暂时没有完整返回。重新尝试不会产生播放、点赞或收藏操作。"
      eyebrow="VIDEO UNAVAILABLE"
      onRetry={reset}
      title="视频详情暂时不可用"
    />
  );
}
