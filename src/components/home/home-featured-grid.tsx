"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion } from "motion/react";

import { VideoArchiveCard } from "@/components/archive/video-archive-card";
import { createFadeUp, createStagger } from "@/components/home/home-motion";
import type { ArchiveVideoItem } from "@/lib/videos/types";

type HomeFeaturedGridProps = {
  items: ArchiveVideoItem[];
  motionReady?: boolean;
};

const gridVariants = createStagger(0.06, 0.1);
const gridItemVariants = createFadeUp(18, 0, 0.34);

export function HomeFeaturedGrid({ items, motionReady = true }: HomeFeaturedGridProps) {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const prefersReducedMotion = useReducedMotion();
  const [isPaused, setIsPaused] = useState(false);
  const shouldAnimateInView = motionReady && !prefersReducedMotion;

  useEffect(() => {
    if (prefersReducedMotion || isPaused || items.length === 0) {
      return;
    }

    let frameId = 0;

    function tick() {
      const scroller = scrollRef.current;

      if (scroller) {
        const maxScrollLeft = scroller.scrollWidth - scroller.clientWidth;
        scroller.scrollLeft =
          scroller.scrollLeft >= maxScrollLeft - 1 ? 0 : scroller.scrollLeft + 0.35;
      }

      frameId = window.requestAnimationFrame(tick);
    }

    frameId = window.requestAnimationFrame(tick);

    return () => window.cancelAnimationFrame(frameId);
  }, [isPaused, items.length, prefersReducedMotion]);

  if (items.length === 0) {
    return (
      <div
        className="flex min-h-[280px] flex-col justify-center rounded-3xl border border-black/10 bg-black/[0.03] px-8 py-8 text-black"
        id="featured-grid"
      >
        <p className="font-sans text-[0.72rem] uppercase tracking-[0.18em] text-black/45">
          ARCHIVE STREAM
        </p>
        <h2 className="mt-4 text-2xl font-black tracking-[-0.04em]">公开视频正在整理</h2>
        <p className="mt-3 max-w-[520px] text-sm leading-6 text-black/60">
          首页视频流会在已发布作品进入归档后自动展示。
        </p>
      </div>
    );
  }

  return (
    <motion.section
      className="space-y-5"
      id="featured-grid"
      initial={prefersReducedMotion ? false : "hidden"}
      onFocusCapture={() => setIsPaused(true)}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      variants={gridVariants}
      viewport={{ once: true, amount: 0.18 }}
      whileInView={shouldAnimateInView ? "visible" : prefersReducedMotion ? undefined : "hidden"}
    >
      <div
        className="-mx-4 overflow-x-auto px-4 pb-3 [scrollbar-width:none] sm:-mx-6 sm:px-6 lg:-mx-6 lg:px-6 [&::-webkit-scrollbar]:hidden"
        ref={scrollRef}
      >
        <div className="grid auto-cols-[minmax(17rem,21rem)] grid-flow-col grid-rows-1 gap-4 md:grid-rows-2 xl:auto-cols-[minmax(19rem,23rem)] xl:gap-5">
          {items.map((item) => (
            <motion.div className="h-full min-w-0" key={item.id} variants={gridItemVariants}>
              <VideoArchiveCard item={item} />
            </motion.div>
          ))}
        </div>
      </div>
    </motion.section>
  );
}
