import type { VideoDetail } from "@/components/video/video-detail-content";
import {
  VideoPlayCircleIcon,
  VideoPlayIcon,
} from "@/components/video/video-detail-icons";

type DeferredVideoPlayerProps = {
  video: VideoDetail;
};

export function DeferredVideoPlayer({ video }: DeferredVideoPlayerProps) {
  return (
    <section
      aria-label={`${video.title} 封面播放器`}
      className="group relative overflow-hidden rounded-xl border border-white/10 bg-panel shadow-hero"
    >
      <div
        aria-label={video.coverImageAlt}
        className="aspect-video w-full bg-cover bg-center"
        role="img"
        style={{ backgroundImage: `url(${video.coverImageUrl})` }}
      />

      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(5,5,5,0.22),rgba(5,5,5,0.1)_38%,rgba(5,5,5,0.5)_100%)]" />

      <div className="absolute left-4 top-4 sm:left-5 sm:top-5">
        <div className="inline-flex items-center gap-2 rounded-[12px] border border-white/10 bg-[rgba(10,10,11,0.86)] px-3 py-2 text-[0.78rem] font-medium tracking-[0.06em] text-foreground shadow-panel">
          <VideoPlayCircleIcon className="h-[0.95rem] w-[0.95rem] text-foreground" />
          <span>{video.sourceLabel}</span>
        </div>
      </div>

      <div className="absolute inset-0 flex items-center justify-center">
        <button
          aria-label="开始播放"
          className="inline-flex h-20 w-20 items-center justify-center rounded-full border border-white/8 bg-[rgba(17,18,20,0.68)] text-white/90 backdrop-blur-md transition duration-200 group-hover:scale-[1.03] group-hover:border-white/12 group-hover:bg-[rgba(17,18,20,0.8)] sm:h-24 sm:w-24"
          type="button"
        >
          <VideoPlayIcon className="ml-1 h-8 w-8 sm:h-9 sm:w-9" />
        </button>
      </div>

      <div className="absolute inset-x-4 bottom-4 flex justify-center sm:inset-x-6 sm:bottom-5">
        <span className="rounded-full border border-white/10 bg-[rgba(10,10,11,0.36)] px-4 py-2 text-sm text-muted backdrop-blur-sm">
          {video.playHint}
        </span>
      </div>
    </section>
  );
}
