"use client";

import { useRef, useState } from "react";

import type { VideoDetail } from "@/lib/videos/types";
import { VideoSourceIcon } from "@/components/ui/video-source-icon";

type DeferredVideoPlayerProps = {
  onCosPlay?: () => void;
  video: VideoDetail;
};

export function DeferredVideoPlayer({ onCosPlay, video }: DeferredVideoPlayerProps) {
  const hasReportedPlayRef = useRef(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const shouldRenderBilibili = video.storageProvider === "bilibili" && Boolean(video.embedUrl);
  const shouldRenderCosVideo =
    video.storageProvider === "cos" && Boolean(video.playbackUrl) && !hasVideoError;

  function handleCosPlay() {
    if (hasReportedPlayRef.current) {
      return;
    }

    hasReportedPlayRef.current = true;
    onCosPlay?.();
  }

  return (
    <section
      aria-label={`${video.title} ${video.sourceLabel} 播放器`}
      className="relative min-w-0 overflow-hidden rounded-xl border border-white/10 bg-panel shadow-hero"
    >
      <div className="absolute left-4 top-4 z-10 sm:left-5 sm:top-5">
        <div className="inline-flex items-center gap-2 rounded-[12px] border border-white/10 bg-[rgba(10,10,11,0.86)] px-3 py-2 text-[0.78rem] font-medium tracking-[0.06em] text-foreground shadow-panel">
          <VideoSourceIcon className="h-[0.95rem] w-[0.95rem]" platform={video.storageProvider} />
          <span>{video.sourceLabel}</span>
        </div>
      </div>

      <div className="aspect-video w-full min-w-0 overflow-hidden bg-black">
        {shouldRenderBilibili ? (
          <iframe
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="h-full w-full bg-black"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={video.embedUrl}
            title={video.title}
          />
        ) : null}

        {shouldRenderCosVideo ? (
          <video
            className="h-full w-full bg-black object-contain"
            controls
            onError={() => setHasVideoError(true)}
            onPlay={handleCosPlay}
            poster={video.coverImageUrl ?? undefined}
            preload="metadata"
            src={video.playbackUrl ?? undefined}
          >
            您的浏览器暂不支持此视频格式，请使用最新版 Chrome、Edge 或 Safari。
          </video>
        ) : null}

        {!shouldRenderBilibili && !shouldRenderCosVideo ? <VideoUnavailableState /> : null}
      </div>
    </section>
  );
}

function VideoUnavailableState() {
  return (
    <div className="flex h-full w-full items-center justify-center px-6 text-center">
      <div className="flex max-w-[22rem] flex-col items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.03] text-subtle">
          <svg
            aria-hidden="true"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
          >
            <path
              d="M5.75 5.75h8.08a4.42 4.42 0 0 1 4.42 4.42v3.66a4.42 4.42 0 0 1-.66 2.32M15.2 18.25H10.17a4.42 4.42 0 0 1-4.42-4.42v-3.66c0-.99.32-1.9.86-2.64"
              stroke="currentColor"
              strokeLinecap="round"
              strokeWidth="1.5"
            />
            <path
              d="m9.85 9.25 4.3 2.75-2.16 1.38M4.75 4.75l14.5 14.5"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
            />
          </svg>
        </div>
        <div className="space-y-1">
          <p className="text-sm font-semibold tracking-[0.02em] text-foreground">
            视频暂不可用
          </p>
          <p className="text-sm leading-6 text-subtle">请稍后再试。</p>
        </div>
      </div>
    </div>
  );
}
