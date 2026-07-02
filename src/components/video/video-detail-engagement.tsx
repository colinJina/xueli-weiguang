"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";

import { Chip } from "@/components/ui/chip";
import { DeferredVideoPlayer } from "@/components/video/deferred-video-player";
import { VideoDetailActions } from "@/components/video/video-detail-actions";
import VideoArchiveIcon from "@/components/icons/video/archive.svg";
import VideoUserIcon from "@/components/icons/video/user.svg";
import VideoVisibilityIcon from "@/components/icons/video/visibility-dot.svg";
import type { FavoriteEditorVideo } from "@/components/user/favorite-editor-dialog";
import type { UserArchiveVideoFavoriteState } from "@/lib/user-archive/types";
import type {
  VideoDetail,
  VideoDictionaryItem,
  VideoViewResponse,
} from "@/lib/videos/types";

type VideoDetailEngagementProps = {
  video: VideoDetail;
  favoriteState: UserArchiveVideoFavoriteState | null;
};

function isVideoViewResponse(value: unknown): value is VideoViewResponse {
  return (
    value !== null &&
    typeof value === "object" &&
    "viewCount" in value &&
    "viewCountLabel" in value
  );
}

export function VideoDetailEngagement({ favoriteState, video }: VideoDetailEngagementProps) {
  const hasRequestedViewRef = useRef(false);
  const [viewCountLabel, setViewCountLabel] = useState(video.viewCountLabel);
  const [likeCount, setLikeCount] = useState(video.likeCount);
  const [likeCountLabel, setLikeCountLabel] = useState(video.likeCountLabel);

  const handleLikeCountChange = useCallback((nextCount: number, nextLabel: string) => {
    setLikeCount(nextCount);
    setLikeCountLabel(nextLabel);
  }, []);

  const handleCosView = useCallback(async () => {
    if (video.storageProvider !== "cos" || hasRequestedViewRef.current) {
      return;
    }

    hasRequestedViewRef.current = true;

    try {
      const response = await fetch(`/api/videos/${video.id}/view`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      });

      if (!response.ok) {
        hasRequestedViewRef.current = false;
        return;
      }

      const payload = (await response.json().catch(() => null)) as unknown;

      if (isVideoViewResponse(payload)) {
        setViewCountLabel(payload.viewCountLabel);
      }
    } catch (error) {
      hasRequestedViewRef.current = false;
      console.error("Failed to record video view", error);
    }
  }, [video.id, video.storageProvider]);

  return (
    <>
      <DeferredVideoPlayer onCosPlay={handleCosView} video={video} />

      <section className="flex flex-col gap-7">
        <div className="space-y-5">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
            <h1 className="max-w-4xl text-[2rem] font-black tracking-[-0.055em] text-foreground sm:text-[2.35rem] lg:text-[2.7rem]">
              {video.title}
            </h1>

            <div className="shrink-0 lg:pt-1">
              <VisibilityPill label={video.visibilityLabel} />
            </div>
          </div>

          <div className="flex flex-col gap-5 border-b border-white/8 pb-6 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-base text-muted">
                <div className="flex items-center gap-2">
                  {video.authorAvatar ? (
                    <Image
                      alt=""
                      className="h-5 w-5 rounded-full object-cover"
                      height={20}
                      src={video.authorAvatar}
                      width={20}
                    />
                  ) : (
                    <VideoUserIcon aria-hidden="true" className="h-4 w-4 text-subtle" />
                  )}
                  <span>原作者 {video.authorName}</span>
                </div>

                <span
                  aria-hidden="true"
                  className="hidden h-1 w-1 rounded-full bg-white/18 sm:inline-block"
                />

                <div className="flex items-center gap-2">
                  <VideoArchiveIcon aria-hidden="true" className="h-4 w-4 text-subtle" />
                  <span>
                    发布于 <span className="text-foreground">{video.publishedAtLabel}</span>
                  </span>
                </div>
              </div>
            </div>

            <div className="shrink-0">
              <VideoDetailActions
                likeCount={likeCount}
                likeCountLabel={likeCountLabel}
                favoriteState={favoriteState}
                favoriteVideo={{
                  id: video.id,
                  title: video.title,
                  coverUrl: video.coverImageUrl,
                  sourceLabel: video.sourceLabel,
                  storageProvider: video.storageProvider,
                } satisfies FavoriteEditorVideo}
                onLikeCountChange={handleLikeCountChange}
                storageProvider={video.storageProvider}
                videoId={video.id}
              />
            </div>
          </div>
        </div>

        <div className="max-w-reading space-y-5">
          <p className="text-base leading-8 text-muted sm:text-[1.05rem]">
            {video.description || "该作品暂无文字简介。"}
          </p>

          <div className="flex flex-wrap gap-3">
            <Chip size="md" variant="strong">
              {video.category.name}
            </Chip>
            {[...video.tags].map((tag) => (
              <Chip key={tag.id} size="md">
                <ToneSwatch item={tag} />
                {tag.name}
              </Chip>
            ))}
          </div>

          <div className="flex flex-wrap gap-3 border-t border-white/8 pt-5 text-sm text-subtle">
            <span>{viewCountLabel} 播放</span>
            <span>{likeCountLabel} 喜欢</span>
            {video.sourceUrl ? (
              <a
                className="text-muted transition duration-200 hover:text-foreground"
                href={video.sourceUrl}
                rel="noreferrer"
                target="_blank"
              >
                查看原始链接
              </a>
            ) : null}
          </div>
        </div>
      </section>
    </>
  );
}

function ToneSwatch({ item }: { item: VideoDictionaryItem }) {
  if (!item.colorHex) {
    return null;
  }

  return (
    <span
      aria-hidden="true"
      className="h-2.5 w-2.5 rounded-full border border-white/15"
      style={{ backgroundColor: item.colorHex }}
    />
  );
}

function VisibilityPill({ label }: { label: string }) {
  return (
    <Chip size="md">
      <VideoVisibilityIcon aria-hidden="true" className="h-2.5 w-2.5 text-foreground" />
      <span>{label}</span>
    </Chip>
  );
}
