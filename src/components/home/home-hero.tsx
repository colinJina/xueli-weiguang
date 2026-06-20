"use client";

import { useCallback } from "react";
import Link from "next/link";

import { HomePlayIcon } from "@/components/home/home-icons";
import { DeferredVideoPlayer } from "@/components/video/deferred-video-player";
import type { HomeHeroFeature } from "@/lib/home/types";

type HomeHeroProps = {
  hero: HomeHeroFeature | null;
};

type HomeHeroFallbackModel = Omit<HomeHeroFeature, "video">;

const fallbackHero: HomeHeroFallbackModel = {
  authorName: "雪笠微光",
  coverUrl: null,
  description: "",
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

  const handleHeroCosPlay = useCallback(async () => {
    if (!hero || hero.video.storageProvider !== "cos") {
      return;
    }

    try {
      await fetch(`/api/videos/${hero.video.id}/view`, {
        method: "POST",
        headers: {
          Accept: "application/json",
        },
      });
    } catch (error) {
      console.error("Failed to record home hero video view", error);
    }
  }, [hero]);

  return (
    <section className="relative overflow-hidden bg-[#090909] pt-[72px] text-white">
      {hero ? (
        <DeferredVideoPlayer
          className="rounded-[22px] border-0 bg-[#090909] p-2 shadow-none"
          coverObjectPosition={objectPosition}
          coverOverlayContent={<HomeHeroInfo displayHero={displayHero} />}
          coverOverlayStrength={displayHero.overlayStrength}
          mediaClassName={`aspect-video lg:h-[min(100svh,calc(100vw*9/16+72px))] lg:aspect-auto rounded-[22px]`}
          onCosPlay={handleHeroCosPlay}
          showSourceBadge={false}
          video={hero.video}
        />
      ) : (
        <HomeHeroFallback displayHero={fallbackHero} objectPosition={objectPosition} />
      )}
    </section>
  );
}

function HomeHeroFallback({
  displayHero,
  objectPosition,
}: {
  displayHero: typeof fallbackHero;
  objectPosition: string;
}) {
  return (
    <div
      className={`relative overflow-hidden rounded-[22px] bg-[#090909] p-2 aspect-video lg:h-[min(100svh,calc(100vw*9/16+72px))] lg:aspect-auto`}
    >
      {displayHero.coverUrl ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            alt=""
            className="relative z-10 h-full w-full rounded-[22px] object-contain"
            referrerPolicy="no-referrer"
            src={displayHero.coverUrl}
            style={{ objectPosition }}
          />
        </>
      ) : (
        <div className="h-full w-full bg-[#090909]" />
      )}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-2 z-20 rounded-[18px] bg-black/35"
      />
      <Link
        aria-label={`播放 ${displayHero.title}`}
        className="absolute left-1/2 top-1/2 z-30 inline-flex h-16 w-16 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-black/50 text-white shadow-[0_10px_30px_rgba(0,0,0,0.28)] backdrop-blur-sm transition duration-200 hover:scale-105 hover:border-white/45 hover:bg-white hover:text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/30 max-sm:h-12 max-sm:w-12"
        href={displayHero.href}
      >
        <HomePlayIcon className="ml-0.5 h-7 w-7 max-sm:h-5 max-sm:w-5" />
      </Link>
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-b from-black/25 via-black/55 to-black"
        style={{ opacity: displayHero.overlayStrength }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-20 bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_1px,transparent_1px),linear-gradient(180deg,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[length:76px_76px] opacity-[0.10]"
      />
      <HomeHeroInfo displayHero={displayHero} />
    </div>
  );
}

function HomeHeroInfo({ displayHero }: { displayHero: HomeHeroFallbackModel }) {
  return (
    <div className="pointer-events-none absolute inset-x-0 bottom-0 z-30">
      <div className="page-container pb-6 sm:pb-10 md:pb-14 lg:pb-20">
        <div className="max-w-[58rem] space-y-4 text-left sm:space-y-5 md:space-y-7">
          <div className="space-y-3 sm:space-y-4 md:space-y-5">
            <h1 className="max-w-[52rem] text-[2rem] font-black leading-[0.95] text-white sm:text-[2.65rem] md:text-[3.2rem] lg:text-[4rem] xl:text-[4.8rem]">
              {displayHero.title}
            </h1>

            <p className="line-clamp-2 max-w-[44rem] text-sm leading-6 text-[#d5d7dc] sm:text-base sm:leading-7 md:text-lg">
              {displayHero.description || "这条精选作品已进入公开档案。"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
