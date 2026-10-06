import { notFound } from "next/navigation";

import { VideoDetailPageView } from "@/components/video/video-detail-page-view";
import { getVideoById } from "@/lib/videos/get-video-by-id";

export const revalidate = 60;

type VideoDetailPageProps = {
  params: Promise<{
    id: string;
  }>;
};

export default async function VideoDetailPage({ params }: VideoDetailPageProps) {
  const { id } = await params;
  const video = await getVideoById(id);

  if (!video) {
    notFound();
  }

  return <VideoDetailPageView video={video} />;
}
