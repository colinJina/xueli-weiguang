"use client";

import { useCallback, useState } from "react";

import { IconButton } from "@/components/ui/icon-button";
import { VideoShareDialog } from "@/components/video/video-share-dialog";
import ShareIcon from "@/components/icons/video/share.svg";
import type { VideoShareData } from "@/lib/videos/share";

export function VideoShareTrigger({ video }: { video: VideoShareData }) {
  const [sharedVideo, setSharedVideo] = useState<VideoShareData | null>(null);
  const closeDialog = useCallback(() => setSharedVideo(null), []);
  return (
    <>
      <IconButton aria-label="分享" onClick={() => setSharedVideo(video)} type="button">
        <ShareIcon aria-hidden="true" className="h-[1.05rem] w-[1.05rem]" />
      </IconButton>
      {sharedVideo ? <VideoShareDialog onClose={closeDialog} video={sharedVideo} /> : null}
    </>
  );
}
