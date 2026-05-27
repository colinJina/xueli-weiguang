import type { VideoDetail } from "@/components/video/video-detail-content";
import { DeferredVideoPlayer } from "@/components/video/deferred-video-player";
import { VideoDetailActions } from "@/components/video/video-detail-actions";
import {
  VideoArchiveIcon,
  VideoUserIcon,
  VideoVisibilityIcon,
} from "@/components/video/video-detail-icons";
import { VideoDetailNav } from "@/components/video/video-detail-nav";

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
                      <VideoUserIcon className="h-4 w-4 text-subtle" />
                      <span>原作者: UID: {video.authorUid}</span>
                    </div>

                    <span
                      aria-hidden="true"
                      className="hidden h-1 w-1 rounded-full bg-white/18 sm:inline-block"
                    />

                    <div className="flex items-center gap-2">
                      <VideoArchiveIcon className="h-4 w-4 text-subtle" />
                      <span>
                        由 <span className="text-foreground">{video.curatorName}</span> 添加于{" "}
                        {video.addedAt}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="shrink-0">
                  <VideoDetailActions likeCount={video.likeCount} />
                </div>
              </div>
            </div>

            <div className="max-w-reading space-y-5">
              <p className="text-base leading-8 text-muted sm:text-[1.05rem]">
                {video.description}
                <span className="ml-1 font-semibold text-foreground">展开阅读</span>
              </p>

              <div className="flex flex-wrap gap-3">
                {video.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-muted transition duration-200 hover:border-white/16 hover:text-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

function VisibilityPill({ label }: { label: string }) {
  return (
    <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.03] px-4 py-1.5 text-sm text-muted">
      <VideoVisibilityIcon className="h-2.5 w-2.5 text-foreground" />
      <span>{label}</span>
    </div>
  );
}
