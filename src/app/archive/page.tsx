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
import { ToneScale } from "@/components/archive/tone-scale";

const DEFAULT_CATEGORY = "歌曲 PV";
const TONE_WINDOW = 3;

export default function ArchivePage() {
  const [activeCategory, setActiveCategory] = useState<string>(DEFAULT_CATEGORY);
  const [activeTone, setActiveTone] = useState<number>(4);

  const visibleItems = useMemo(() => {
    return archiveVideos.filter((item) => {
      const matchesCategory =
        activeCategory === DEFAULT_CATEGORY || item.category === activeCategory;
      const matchesTone = Math.abs(item.tone - activeTone) <= TONE_WINDOW;

      return matchesCategory && matchesTone;
    });
  }, [activeCategory, activeTone]);

  return (
    <div className="archive-page">
      <ArchivePageNav
        activeChannel={archiveNavSummary.activeChannel}
        channelCount={archiveNavSummary.channelCount}
        supportCount={archiveNavSummary.supportCount}
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

      <section className="archive-page__content page-container">
        <ArchiveGrid items={visibleItems} />
      </section>
    </div>
  );
}
