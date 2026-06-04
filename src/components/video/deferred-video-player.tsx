import type { VideoDetail } from "@/lib/videos/serialize-video";
import { VideoPlayCircleIcon } from "@/components/video/video-detail-icons";

type DeferredVideoPlayerProps = {
  video: VideoDetail;
};

export function DeferredVideoPlayer({ video }: DeferredVideoPlayerProps) {
  return (
    <section
      aria-label={`${video.title} Bilibili 播放器`}
      className="relative overflow-hidden rounded-xl border border-white/10 bg-panel shadow-hero"
    >
      <div className="absolute left-4 top-4 z-10 sm:left-5 sm:top-5">
        <div className="inline-flex items-center gap-2 rounded-[12px] border border-white/10 bg-[rgba(10,10,11,0.86)] px-3 py-2 text-[0.78rem] font-medium tracking-[0.06em] text-foreground shadow-panel">
          <VideoPlayCircleIcon className="h-[0.95rem] w-[0.95rem] text-foreground" />
          <span>{video.sourceLabel}</span>
        </div>
      </div>

      <iframe
        allow="autoplay; fullscreen; picture-in-picture"
        allowFullScreen
        className="aspect-video w-full bg-black"
        loading="lazy"
        referrerPolicy="no-referrer-when-downgrade"
        src={video.embedUrl}
        title={video.title}
      />
    </section>
  );
}
