import { forwardRef } from "react";
import Image from "next/image";

import { SiteBrand } from "@/components/layout/site-brand";
import { Chip } from "@/components/ui/chip";
import CoverFallbackIcon from "@/components/icons/archive/cover-image-fallback.svg";
import { getVideoShareSummary, type VideoShareData } from "@/lib/videos/share";
import { formatTonePercentage, getVisibleVideoTones } from "@/lib/videos/tone-swatches";

type VideoShareCardProps = {
  video: VideoShareData;
  coverUrl: string | null;
  qrCodeUrl: string;
};

export const VideoShareCard = forwardRef<HTMLElement, VideoShareCardProps>(
  function VideoShareCard({ video, coverUrl, qrCodeUrl }, ref) {

    const summary = getVideoShareSummary(video);
    const tones = getVisibleVideoTones(video.tones);
    return (
      <article className="mx-auto w-full max-w-[400px] overflow-hidden rounded-xl border border-border bg-panel text-foreground" ref={ref}>
        <div className="border-b border-border px-5 py-5">
          <SiteBrand
            markClassName="h-8 w-8"
            titleClassName="text-lg"
          />
        </div>
        <div className="space-y-4 p-5">
          {coverUrl ? (
            <Image alt="PV 封面" className="h-auto w-full rounded-lg" height={675} loading="eager" src={coverUrl} unoptimized width={1200} />
          ) : (
            <div className="flex aspect-video flex-col items-center justify-center gap-3 rounded-lg bg-surface text-subtle">
              <CoverFallbackIcon aria-hidden="true" className="h-10 w-10" />
              <span className="text-xs">封面暂不可用</span>
            </div>
          )}
          <h3 className="text-xl font-bold leading-snug tracking-[-0.03em] [overflow-wrap:anywhere]">{video.title}</h3>
          <p className="flex flex-wrap gap-x-2 gap-y-1 text-xs leading-5 text-subtle">
            <span>{video.viewCountLabel} 播放</span>
            <span aria-hidden="true">·</span>
            <span>{video.publishedAtLabel}</span>
            <span aria-hidden="true">·</span>
            <span>{video.category.name}</span>
          </p>
          {video.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {video.tags.slice(0, 5).map((tag) => <Chip key={tag.id} size="xs">{tag.name}</Chip>)}
            </div>
          ) : null}
          {tones.length > 0 ? (
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] text-subtle">
              <span>主色调</span>
              {tones.map((tone) => (
                <span aria-label={`${tone.colorHex} ${formatTonePercentage(tone.percentage) ?? ""}`} className="inline-flex items-center gap-1.5" key={tone.id}>
                  <span aria-hidden="true" className="h-3 w-3 rounded-full border border-borderStrong" style={{ backgroundColor: tone.colorHex }} />
                  {formatTonePercentage(tone.percentage)}
                </span>
              ))}
            </div>
          ) : null}
          <div className="flex items-end gap-4 border-t border-border pt-4">
            <div className="min-w-0 flex-1 space-y-2">
              <p className="text-[11px] text-subtle">{summary.label}</p>
              <p className="text-xs leading-5 text-muted [overflow-wrap:anywhere]">{summary.text}</p>
              <p className="pt-1 text-[10px] leading-4 text-subtle">扫码查看完整 PV<br />雪笠微光 · PV</p>
            </div>
            <Image alt="扫码查看 PV" className="h-24 w-24 shrink-0 rounded-lg" height={96} loading="eager" src={qrCodeUrl} unoptimized width={96} />
          </div>
        </div>
      </article>
    );
  },
);
