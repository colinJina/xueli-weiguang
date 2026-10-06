import { FixedBackButton } from "@/components/layout/fixed-back-button";
import { VideoDetailEngagement } from "@/components/video/video-detail-engagement";
import { VideoDetailNav } from "@/components/video/video-detail-nav";
import type { VideoDetail } from "@/lib/videos/types";

type VideoDetailPageViewProps = {
  video: VideoDetail;
};

export function VideoDetailPageView({ video }: VideoDetailPageViewProps) {
  return (
    <div className="min-h-screen bg-background">
      <VideoDetailNav />
      <FixedBackButton fallbackHref="/archive" />

      <main className="page-container py-6 sm:py-8 lg:py-10">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-7 lg:gap-8">
          <VideoDetailEngagement key={video.id} video={video} />
        </div>
      </main>
    </div>
  );
}
