"use client";

import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import type { HomeHeroFeature } from "@/lib/home/types";

type HomeHeroProps = {
  hero: HomeHeroFeature | null;
};

const fallbackHero = {
  authorName: "雪笠微光",
  coverUrl: null,
  description: "精选影像与创作作品的黑白档案入口。",
  focalX: 0.5,
  focalY: 0.5,
  href: "/archive",
  overlayStrength: 0.62,
  sourceLabel: "Archive",
  title: "雪笠微光",
  videoId: "fallback",
};

export function HomeHero({ hero }: HomeHeroProps) {
  const displayHero = hero ?? fallbackHero;
  const objectPosition = `${displayHero.focalX * 100}% ${displayHero.focalY * 100}%`;
  return (
    <section className="relative min-h-[760px] overflow-hidden bg-[#090909] pt-[72px] text-white">
      <div className="absolute inset-0">
        {displayHero.coverUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt=""
            className="h-full w-full object-cover"
            referrerPolicy="no-referrer"
            src={displayHero.coverUrl}
            style={{ objectPosition }}
          />
        ) : (
          <div className="h-full w-full bg-[#090909]" />
        )}
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-gradient-to-b from-black/25 via-black/55 to-black"
          style={{ opacity: displayHero.overlayStrength }}
        />
        <div
          aria-hidden="true"
          className="absolute inset-0 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:76px_76px] opacity-[0.10]"
        />
      </div>

      <div className="page-container relative flex min-h-[688px] items-end pb-20 pt-20">
        <div className="max-w-[58rem] space-y-7">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/18 bg-black/45 px-3 py-1.5 text-xs font-medium text-muted backdrop-blur-sm">
            <span>{displayHero.sourceLabel}</span>
            <span aria-hidden="true" className="h-1 w-1 rounded-full bg-white/45" />
            <span>{displayHero.authorName}</span>
          </div>

          <div className="space-y-5">
            <h1 className="max-w-[52rem] text-[4.8rem] font-black leading-[0.95] text-white max-lg:text-[4rem] max-md:text-[3.2rem] max-sm:text-[2.65rem]">
              {displayHero.title}
            </h1>
            <p className="max-w-[44rem] text-base leading-7 text-[#d5d7dc] sm:text-lg">
              {displayHero.description || "这条精选作品已进入公开档案。"}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Link className={cn(buttonVariants({ size: "hero" }), "gap-3")} href={displayHero.href}>
              立即观看
            </Link>
            <Link
              className={cn(
                buttonVariants({ size: "hero", variant: "secondary" }),
                "border-white/70 bg-black/20 text-white hover:border-white hover:bg-white/8",
              )}
              href="#featured-grid"
            >
              查看归档
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
