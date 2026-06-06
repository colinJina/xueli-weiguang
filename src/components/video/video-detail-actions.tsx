import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import {
  VideoBookmarkIcon,
  VideoHeartIcon,
  VideoShareIcon,
} from "@/components/video/video-detail-icons";

type VideoDetailActionsProps = {
  likeCount: string;
};

export function VideoDetailActions({ likeCount }: VideoDetailActionsProps) {
  return (
    <div className="flex flex-wrap gap-3 lg:justify-end">
      <Button
        className="gap-2 font-medium"
        size="md"
        type="button"
        variant="pill"
      >
        <VideoHeartIcon className="h-[1.05rem] w-[1.05rem]" />
        <span>{likeCount}</span>
      </Button>

      <Button
        className="gap-2 font-medium"
        size="md"
        type="button"
        variant="pill"
      >
        <VideoBookmarkIcon className="h-[1.05rem] w-[1.05rem]" />
        <span>收藏与标签</span>
      </Button>

      <IconButton
        aria-label="分享"
        type="button"
      >
        <VideoShareIcon className="h-[1.05rem] w-[1.05rem]" />
      </IconButton>
    </div>
  );
}
