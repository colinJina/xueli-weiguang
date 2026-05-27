import { HomeCogIcon } from "@/components/home/home-icons";
import { SiteBrand } from "@/components/layout/site-brand";
import { VideoUserIcon } from "@/components/video/video-detail-icons";

const navIconButtonClassName =
  "inline-flex h-10 w-10 items-center justify-center rounded-full border border-transparent text-subtle transition duration-200 hover:border-white/10 hover:bg-white/[0.04] hover:text-foreground";

export function VideoDetailNav() {
  return (
    <header className="sticky top-0 z-40 border-b border-white/6 bg-[rgba(10,10,11,0.94)] backdrop-blur-[14px]">
      <div className="page-container flex h-[60px] items-center justify-between gap-4">
        <SiteBrand
          className="shrink-0"
          markClassName="hidden"
          subtitleClassName="hidden"
          titleClassName="text-[1.75rem] font-black tracking-[-0.05em]"
        />

        <div className="flex shrink-0 items-center gap-2">
          <button aria-label="设置" className={navIconButtonClassName} type="button">
            <HomeCogIcon className="h-[1.1rem] w-[1.1rem]" />
          </button>
          <button aria-label="个人中心" className={navIconButtonClassName} type="button">
            <VideoUserIcon className="h-[1.15rem] w-[1.15rem]" />
          </button>
        </div>
      </div>
    </header>
  );
}
