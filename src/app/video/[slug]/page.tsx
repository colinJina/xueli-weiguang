import { VideoDetailPageView } from "@/components/video/video-detail-page-view";
import { getVideoDetail } from "@/components/video/video-detail-content";

type VideoDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function VideoDetailPage({ params }: VideoDetailPageProps) {
  const { slug } = await params;
  const video = getVideoDetail(slug);

  return <VideoDetailPageView video={video} />;
}
