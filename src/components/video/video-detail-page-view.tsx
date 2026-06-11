import { VideoDetailEngagement } from "@/components/video/video-detail-engagement";
import { VideoDetailNav } from "@/components/video/video-detail-nav";
import type { UserArchiveVideoFavoriteState } from "@/lib/user-archive/types";
import type { VideoDetail } from "@/lib/videos/types";

type VideoDetailPageViewProps = {
  video: VideoDetail;
  favoriteState: UserArchiveVideoFavoriteState | null;
};

export function VideoDetailPageView({ favoriteState, video }: VideoDetailPageViewProps) {
  return (
    <div className="min-h-screen bg-background">
      <VideoDetailNav />

      <main className="page-container py-6 sm:py-8 lg:py-10">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-7 lg:gap-8">
          <VideoDetailEngagement favoriteState={favoriteState} video={video} />
        </div>
      </main>
    </div>
  );
}
