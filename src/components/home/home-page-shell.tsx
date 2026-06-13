"use client";

import { useLayoutEffect, useState } from "react";

import { AuthDialog } from "@/components/auth/auth-dialog";
import { HomeFeaturedGrid } from "@/components/home/home-featured-grid";
import { HomeHeader } from "@/components/home/home-header";
import { HomeHero } from "@/components/home/home-hero";
import { HomeIntroLoader } from "@/components/home/home-intro-loader";
import { HomeMetaStrip } from "@/components/home/home-meta-strip";
import {
  homeIntroDurationMs,
  homeIntroInitialState,
  homeIntroSessionKey,
} from "@/components/home/home-motion";
import { useAuth } from "@/lib/auth/use-auth";
import type { HomeHeroFeature, HomeSiteStatItem } from "@/lib/home/types";
import type { ArchiveVideoItem } from "@/lib/videos/types";

type HomeNavigationItem = {
  href: string;
  label: string;
};

type HomePageShellProps = {
  featuredItems: ArchiveVideoItem[];
  hero: HomeHeroFeature | null;
  metaItems: readonly HomeSiteStatItem[];
  navigation: readonly HomeNavigationItem[];
};

export function HomePageShell({
  featuredItems,
  hero,
  navigation,
  metaItems,
}: HomePageShellProps) {
  const [showIntro, setShowIntro] = useState(homeIntroInitialState.showIntro);
  const [motionReady, setMotionReady] = useState(
    homeIntroInitialState.motionReady,
  );
  const { user, logout, dialogMode, openLogin, openRegister, closeDialog, switchMode } =
    useAuth();

  useLayoutEffect(() => {
    const hasSeenIntro = window.sessionStorage.getItem(homeIntroSessionKey) === "1";
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion || hasSeenIntro) {
      setShowIntro(false);
      setMotionReady(true);
      return;
    }

    setShowIntro(true);
    setMotionReady(false);

    const timer = window.setTimeout(() => {
      window.sessionStorage.setItem(homeIntroSessionKey, "1");
      setShowIntro(false);
      setMotionReady(true);
    }, homeIntroDurationMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, []);

  return (
    <div className="bg-[#090909] pb-12 sm:pb-16 lg:pb-20">
      <HomeIntroLoader visible={showIntro} />
      <HomeHeader
        motionReady={motionReady}
        navigation={navigation}
        onLoginClick={openLogin}
        onLogout={logout}
        onRegisterClick={openRegister}
        user={user}
      />

      <main>
        <HomeHero hero={hero} />
        <HomeMetaStrip items={metaItems} motionReady={motionReady} />
        <div className="mx-auto w-full max-w-[1520px] px-4 pt-12 sm:px-6 sm:pt-10 lg:px-6 xl:px-8">
          <HomeFeaturedGrid items={featuredItems} motionReady={motionReady} />
        </div>
      </main>

      {dialogMode ? (
        <AuthDialog
          mode={dialogMode}
          onClose={closeDialog}
          onSuccess={closeDialog}
          onSwitchMode={switchMode}
          open
        />
      ) : null}
    </div>
  );
}
