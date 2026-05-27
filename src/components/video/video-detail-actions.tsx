import { Button } from "@/components/ui/button";
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
        className="gap-2 rounded-[14px] border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-muted hover:border-white/16 hover:bg-white/[0.05] hover:text-foreground"
        size="sm"
        type="button"
        variant="secondary"
      >
        <VideoHeartIcon className="h-[1.05rem] w-[1.05rem]" />
        <span>{likeCount}</span>
      </Button>

      <Button
        className="gap-2 rounded-[14px] border-white/10 bg-white/[0.03] px-4 py-2.5 text-sm font-medium text-muted hover:border-white/16 hover:bg-white/[0.05] hover:text-foreground"
        size="sm"
        type="button"
        variant="secondary"
      >
        <VideoBookmarkIcon className="h-[1.05rem] w-[1.05rem]" />
        <span>收藏与标签</span>
      </Button>

      <Button
        aria-label="分享"
        className="rounded-[14px] border-white/10 bg-white/[0.03] px-3 py-2.5 text-muted hover:border-white/16 hover:bg-white/[0.05] hover:text-foreground"
        size="sm"
        type="button"
        variant="secondary"
      >
        <VideoShareIcon className="h-[1.05rem] w-[1.05rem]" />
      </Button>
    </div>
  );
}
