"use client";

import { useMemo, useState } from "react";

import { ArchiveFilterBar } from "@/components/archive/archive-filter-bar";
import {
  archiveCategories,
  archiveNavSummary,
  archiveToneLabels,
  archiveVideos,
} from "@/components/archive/archive-data";
import { ArchiveGrid } from "@/components/archive/archive-grid";
import { ArchivePageNav } from "@/components/archive/archive-page-nav";
import { ArchiveSubmitDialog } from "@/components/archive/archive-submit-dialog";
import { AuthDialog } from "@/components/auth/auth-dialog";
import { ToneScale } from "@/components/archive/tone-scale";
import { useAuth } from "@/lib/auth/use-auth";

const DEFAULT_CATEGORY = "歌曲 PV";
const TONE_WINDOW = 3;

export default function ArchivePage() {
  const {
    user,
    isReady,
    isAuthenticated,
    logout,
    dialogMode,
    openLogin,
    openRegister,
    closeDialog,
    switchMode,
  } = useAuth();
  const [activeCategory, setActiveCategory] = useState<string>(DEFAULT_CATEGORY);
  const [activeTone, setActiveTone] = useState<number>(4);
  const [isSubmitDialogOpen, setIsSubmitDialogOpen] = useState(false);
  const [shouldContinueToSubmit, setShouldContinueToSubmit] = useState(false);

  const visibleItems = useMemo(() => {
    return archiveVideos.filter((item) => {
      const matchesCategory =
        activeCategory === DEFAULT_CATEGORY || item.category === activeCategory;
      const matchesTone = Math.abs(item.tone - activeTone) <= TONE_WINDOW;

      return matchesCategory && matchesTone;
    });
  }, [activeCategory, activeTone]);

  return (
    <div className="min-h-screen bg-[#020202]">
      <ArchivePageNav
        activeChannel={archiveNavSummary.activeChannel}
        channelCount={archiveNavSummary.channelCount}
        onLoginClick={openLogin}
        onLogout={logout}
        onRegisterClick={openRegister}
        onSubmitLoginRequest={() => {
          setShouldContinueToSubmit(true);
          openLogin();
        }}
        onSubmitOpen={() => {
          setShouldContinueToSubmit(false);
          setIsSubmitDialogOpen(true);
        }}
        supportCount={archiveNavSummary.supportCount}
        user={user}
      />

      <section className="page-container">
        <ArchiveFilterBar
          activeCategory={activeCategory}
          categories={archiveCategories}
          onCategoryChange={setActiveCategory}
          toneControl={
            <ToneScale
              labels={archiveToneLabels}
              onChange={setActiveTone}
              value={activeTone}
            />
          }
        />
      </section>

      <section className="page-container pb-16 pt-[22px] max-md:pt-[18px]">
        <ArchiveGrid items={visibleItems} />
      </section>

      {dialogMode ? (
        <AuthDialog
          mode={dialogMode}
          onClose={() => {
            setShouldContinueToSubmit(false);
            closeDialog();
          }}
          onSuccess={() => {
            closeDialog();
            if (shouldContinueToSubmit) {
              setShouldContinueToSubmit(false);
              setIsSubmitDialogOpen(true);
            }
          }}
          onSwitchMode={switchMode}
          open
        />
      ) : null}

      <ArchiveSubmitDialog
        onClose={() => setIsSubmitDialogOpen(false)}
        open={isSubmitDialogOpen && isReady && isAuthenticated}
      />
    </div>
  );
}
