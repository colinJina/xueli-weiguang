"use client";

import { useLayoutEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

import type {
  HomeCardItem,
  HomeHeroContent,
  HomeMetaStripItem,
} from "@/components/home/home-content";
import { HomeFeaturedGrid } from "@/components/home/home-featured-grid";
import { HomeHeader } from "@/components/home/home-header";
import { HomeHero } from "@/components/home/home-hero";
import { HomeIntroLoader } from "@/components/home/home-intro-loader";
import { HomeMetaStrip } from "@/components/home/home-meta-strip";
import {
  homeIntroDurationMs,
  homeIntroSessionKey,
} from "@/components/home/home-motion";

type HomeNavigationItem = {
  href: string;
  label: string;
};

type HomePageShellProps = {
  navigation: readonly HomeNavigationItem[];
  heroContent: HomeHeroContent;
  metaItems: readonly HomeMetaStripItem[];
  featuredItems: readonly HomeCardItem[];
};

export function HomePageShell({
  navigation,
  heroContent,
  metaItems,
  featuredItems,
}: HomePageShellProps) {
  const prefersReducedMotion = useReducedMotion();
  const [showIntro, setShowIntro] = useState(false);
  const [motionReady, setMotionReady] = useState(false);

  useLayoutEffect(() => {
    const hasSeenIntro = window.sessionStorage.getItem(homeIntroSessionKey) === "1";

    if (prefersReducedMotion || hasSeenIntro) {
      setShowIntro(false);
      setMotionReady(true);
      return;
    }

    window.sessionStorage.setItem(homeIntroSessionKey, "1");
    setShowIntro(true);

    const timer = window.setTimeout(() => {
      setShowIntro(false);
      setMotionReady(true);
    }, homeIntroDurationMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [prefersReducedMotion]);

  return (
    <div className="bg-[linear-gradient(180deg,#050505_0,#020202_53rem,#f5f5f3_53rem,#efefeb_100%)] pb-12 sm:pb-16 lg:pb-20">
      <HomeIntroLoader visible={showIntro} />
      <HomeHeader navigation={navigation} motionReady={motionReady} />

      <main>
        <HomeHero content={heroContent} motionReady={motionReady} />
        <HomeMetaStrip items={metaItems} motionReady={motionReady} />

        <div className="mx-auto w-full max-w-[1520px] px-4 pt-12 sm:px-6 sm:pt-10 lg:px-6 xl:px-8">
          <HomeFeaturedGrid items={featuredItems} motionReady={motionReady} />
        </div>
      </main>
    </div>
  );
}
