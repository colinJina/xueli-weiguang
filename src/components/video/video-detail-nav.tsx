import { HomeCogIcon } from "@/components/home/home-icons";
import { SiteBrand } from "@/components/layout/site-brand";
import { IconButton } from "@/components/ui/icon-button";
import { VideoUserIcon } from "@/components/video/video-detail-icons";

export function VideoDetailNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/6 bg-[rgba(10,10,11,0.94)] backdrop-blur-[14px]">
      <div className="page-container flex h-[60px] items-center justify-between gap-4">
        <SiteBrand
          className="shrink-0"
          subtitleClassName="hidden"
          titleClassName="text-[1.75rem] font-black tracking-[-0.05em]"
        />

        <div className="flex shrink-0 items-center gap-2">
          <IconButton aria-label="设置" variant="ghost">
            <HomeCogIcon className="h-[1.1rem] w-[1.1rem]" />
          </IconButton>
          <IconButton aria-label="个人中心" variant="ghost">
            <VideoUserIcon className="h-[1.15rem] w-[1.15rem]" />
          </IconButton>
        </div>
      </div>
    </header>
  );
}
