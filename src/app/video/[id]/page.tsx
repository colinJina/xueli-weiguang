import { notFound } from "next/navigation";

import { VideoDetailPageView } from "@/components/video/video-detail-page-view";
import { createClient } from "@/lib/supabase/server";
import { getUserVideoFavoriteState } from "@/lib/user-archive/data";
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

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  const favoriteState = user ? await getUserVideoFavoriteState(supabase, user.id, id) : null;

  return <VideoDetailPageView favoriteState={favoriteState} video={video} />;
}
