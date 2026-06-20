"use client";

import { useLayoutEffect, useState } from "react";
import { useReducedMotion } from "motion/react";

import { ArchiveSubmitDialog } from "@/components/archive/archive-submit-dialog";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { HomeFeaturedGrid } from "@/components/home/home-featured-grid";
import { HomeHeader } from "@/components/home/home-header";
import { HomeHero } from "@/components/home/home-hero";
import {
  getHomeIntroInitialState,
  getHomeIntroStorage,
  homeIntroInitialState,
  markHomeIntroSeen,
} from "@/components/home/home-intro-state";
import { HomeIntroLoader } from "@/components/home/home-intro-loader";
import { HomeMetaStrip } from "@/components/home/home-meta-strip";
import { homeIntroDurationMs } from "@/components/home/home-motion";
import { useAuth } from "@/lib/auth/use-auth";
import type { HomeHeroFeature, HomeSiteStatItem } from "@/lib/home/types";
import type { ArchiveVideoItem } from "@/lib/videos/types";

type HomeNavigationItem = {
  href: string;
  icon: "explore" | "library" | "profile";
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
  const [submitDialogOpen, setSubmitDialogOpen] = useState(false);
  const [continueToSubmit, setContinueToSubmit] = useState(false);
  const prefersReducedMotion = useReducedMotion();
  const {
    user,
    isReady,
    isAuthenticated,
    isAdmin,
    logout,
    dialogMode,
    openLogin,
    openRegister,
    closeDialog,
    switchMode,
  } = useAuth();

  useLayoutEffect(() => {
    const storage = getHomeIntroStorage();
    const introState = getHomeIntroInitialState(Boolean(prefersReducedMotion), storage);

    setShowIntro(introState.showIntro);
    setMotionReady(introState.motionReady);

    if (!introState.showIntro) {
      return;
    }

    const timer = window.setTimeout(() => {
      if (introState.shouldPersistIntroSeenAfterIntro) {
        markHomeIntroSeen(getHomeIntroStorage());
      }

      setShowIntro(false);
      setMotionReady(true);
    }, homeIntroDurationMs);

    return () => {
      window.clearTimeout(timer);
    };
  }, [prefersReducedMotion]);

  function handleUploadClick() {
    if (isReady && isAuthenticated) {
      setSubmitDialogOpen(true);
      return;
    }

    setContinueToSubmit(true);
    openLogin();
  }

  return (
    <div className="bg-[#090909] pb-12 sm:pb-16 lg:pb-20">
      <HomeIntroLoader visible={showIntro} />
      <HomeHeader
        motionReady={motionReady}
        navigation={navigation}
        onLoginClick={openLogin}
        onLogout={logout}
        onRegisterClick={openRegister}
        onUploadClick={handleUploadClick}
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
          onClose={() => {
            setContinueToSubmit(false);
            closeDialog();
          }}
          onSuccess={() => {
            closeDialog();
            if (continueToSubmit) {
              setContinueToSubmit(false);
              setSubmitDialogOpen(true);
            }
          }}
          onSwitchMode={switchMode}
          open
        />
      ) : null}

      <ArchiveSubmitDialog
        onClose={() => setSubmitDialogOpen(false)}
        allowNativeUpload={isAdmin}
        open={submitDialogOpen && isReady && isAuthenticated}
      />
    </div>
  );
}
