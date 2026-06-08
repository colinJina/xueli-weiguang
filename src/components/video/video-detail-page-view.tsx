import Image from "next/image";

import { Chip } from "@/components/ui/chip";
import { DeferredVideoPlayer } from "@/components/video/deferred-video-player";
import { VideoDetailActions } from "@/components/video/video-detail-actions";
import {
  VideoArchiveIcon,
  VideoUserIcon,
  VideoVisibilityIcon,
} from "@/components/video/video-detail-icons";
import { VideoDetailNav } from "@/components/video/video-detail-nav";
import type { VideoDetail, VideoDictionaryItem } from "@/lib/videos/serialize-video";

type VideoDetailPageViewProps = {
  video: VideoDetail;
};

export function VideoDetailPageView({ video }: VideoDetailPageViewProps) {
  return (
    <div className="min-h-screen bg-background">
      <VideoDetailNav />

      <main className="page-container py-6 sm:py-8 lg:py-10">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-7 lg:gap-8">
          <DeferredVideoPlayer video={video} />

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
                        <VideoUserIcon className="h-4 w-4 text-subtle" />
                      )}
                      <span>原作者: {video.authorName}</span>
                    </div>

                    <span
                      aria-hidden="true"
                      className="hidden h-1 w-1 rounded-full bg-white/18 sm:inline-block"
                    />

                    <div className="flex items-center gap-2">
                      <VideoArchiveIcon className="h-4 w-4 text-subtle" />
                      <span>
                        发布于 <span className="text-foreground">{video.publishedAtLabel}</span>
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <VideoDetailActions likeCount={video.likeCountLabel} />
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
                <span>{video.viewCountLabel} 播放</span>
                <span>{video.likeCountLabel} 喜欢</span>
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
        </div>
      </main>
    </div>
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
      <VideoVisibilityIcon className="h-2.5 w-2.5 text-foreground" />
      <span>{label}</span>
    </Chip>
  );
}
