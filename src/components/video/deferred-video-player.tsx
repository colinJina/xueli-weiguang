"use client";

import { useRef, useState } from "react";
import type { ReactNode } from "react";

import type { VideoDetail } from "@/lib/videos/types";
import BilibiliSourceIcon from "@/components/icons/source/bilibili.svg";
import GenericSourceIcon from "@/components/icons/source/generic-play.svg";
import YoutubeSourceIcon from "@/components/icons/source/youtube.svg";
import VideoPlayIcon from "@/components/icons/video/play.svg";
import VideoUnavailableIcon from "@/components/icons/video/unavailable.svg";
import { cn } from "@/lib/utils";

type DeferredVideoPlayerProps = {
  className?: string;
  coverObjectPosition?: string;
  coverOverlayContent?: ReactNode;
  coverOverlayStrength?: number;
  mediaClassName?: string;
  onCosPlay?: () => void;
  showSourceBadge?: boolean;
  video: VideoDetail;
};

function getAutoplayEmbedUrl(value: string) {
  if (!value) {
    return value;
  }

  try {
    const url = new URL(value);
    url.searchParams.set("autoplay", "1");
    return url.toString();
  } catch {
    return value.includes("?") ? `${value}&autoplay=1` : `${value}?autoplay=1`;
  }
}

function getVideoSourceIcon(platform: string) {
  if (platform === "bilibili") {
    return BilibiliSourceIcon;
  }

  if (platform === "youtube") {
    return YoutubeSourceIcon;
  }

  return GenericSourceIcon;
}

export function DeferredVideoPlayer({
  className,
  coverObjectPosition = "50% 50%",
  coverOverlayContent,
  coverOverlayStrength = 0.55,
  mediaClassName,
  onCosPlay,
  showSourceBadge = true,
  video,
}: DeferredVideoPlayerProps) {
  const hasReportedPlayRef = useRef(false);
  const [isPlayerActive, setIsPlayerActive] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const canRenderExternalEmbed =
    (video.storageProvider === "bilibili" || video.storageProvider === "youtube") &&
    Boolean(video.embedUrl);
  const canRenderCosVideo = video.storageProvider === "cos" && Boolean(video.playbackUrl);
  const shouldRenderExternalEmbed = isPlayerActive && canRenderExternalEmbed;
  const shouldRenderCosVideo =
    isPlayerActive && canRenderCosVideo && !hasVideoError;
  const shouldRenderCover = !isPlayerActive && (canRenderExternalEmbed || canRenderCosVideo);
  const shouldRenderUnavailable =
    (!shouldRenderCover && !shouldRenderExternalEmbed && !shouldRenderCosVideo) || hasVideoError;
  const SourceIcon = getVideoSourceIcon(video.storageProvider);

  function handleActivatePlayer() {
    setIsPlayerActive(true);
  }

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
      className={cn(
        "relative min-w-0 overflow-hidden rounded-xl border border-white/10 bg-panel shadow-hero",
        className,
      )}
    >
      {showSourceBadge ? (
        <div className="absolute left-4 top-4 z-30 sm:left-5 sm:top-5">
          <div className="inline-flex items-center gap-2 rounded-[12px] border border-white/10 bg-[rgba(10,10,11,0.86)] px-3 py-2 text-[0.78rem] font-medium tracking-[0.06em] text-foreground shadow-panel">
            <SourceIcon aria-hidden="true" className="h-[0.95rem] w-[0.95rem]" />
            <span>{video.sourceLabel}</span>
          </div>
        </div>
      ) : null}

      <div className={cn("aspect-video w-full min-w-0 overflow-hidden bg-black", mediaClassName)}>
        {shouldRenderCover ? (
          <button
            aria-label={`播放 ${video.title}`}
            className="group relative h-full w-full cursor-pointer overflow-hidden bg-black text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30"
            onClick={handleActivatePlayer}
            type="button"
          >
            {video.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                alt=""
                className="relative z-10 h-full w-full object-contain"
                referrerPolicy="no-referrer"
                src={video.coverImageUrl}
                style={{ objectPosition: coverObjectPosition }}
              />
            ) : (
              <div className="h-full w-full bg-black" />
            )}
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-b from-black/20 via-black/45 to-black"
              style={{ opacity: coverOverlayStrength }}
            />
            <span
              aria-hidden="true"
              className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:76px_76px] opacity-[0.10]"
            />
            <span className="absolute left-1/2 top-1/2 z-30 inline-flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/50 text-white shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur-sm transition duration-200 group-hover:scale-105 group-hover:border-white/45 group-hover:bg-white group-hover:text-black max-sm:h-12 max-sm:w-12">
              <VideoPlayIcon aria-hidden="true" className="ml-0.5 h-7 w-7 max-sm:h-5 max-sm:w-5" />
            </span>
            {coverOverlayContent}
          </button>
        ) : null}

        {shouldRenderExternalEmbed ? (
          <iframe
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            className="h-full w-full bg-black"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={getAutoplayEmbedUrl(video.embedUrl)}
            title={video.title}
          />
        ) : null}

        {shouldRenderCosVideo ? (
          <video
            autoPlay
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

        {shouldRenderUnavailable ? <VideoUnavailableState /> : null}
      </div>
    </section>
  );
}

function VideoUnavailableState() {
  return (
    <div className="flex h-full w-full items-center justify-center px-6 text-center">
      <div className="flex max-w-[22rem] flex-col items-center gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/12 bg-white/[0.03] text-subtle">
          <VideoUnavailableIcon aria-hidden="true" className="h-6 w-6" />
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
