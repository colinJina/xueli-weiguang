"use client";

import { useReducedMotion, motion } from "motion/react";
import Marquee from "react-fast-marquee"; 
import { VideoArchiveCard } from "@/components/archive/video-archive-card";
import { createFadeUp, createStagger } from "@/components/home/home-motion";
import { Button } from "@/components/ui/button";
import type { ArchiveVideoItem } from "@/lib/videos/types";
type HomeFeaturedGridProps = {
  dataUnavailable?: boolean;
  items: ArchiveVideoItem[];
  motionReady?: boolean;
};
const gridVariants = createStagger(0.06, 0.1);
const gridItemVariants = createFadeUp(18, 0, 0.34);

export function HomeFeaturedGrid({
  dataUnavailable = false,
  items,
  motionReady = true,
}: HomeFeaturedGridProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimateInView = motionReady && !prefersReducedMotion;

  function handleReload() {
    window.location.reload();
  }

  if (dataUnavailable) {
    return (
      <div
        className="flex min-h-[280px] flex-col justify-center rounded-3xl border border-white/10 bg-white/[0.03] px-8 py-8 text-white"
        id="featured-grid"
        role="status"
      >
        <p className="font-sans text-[0.72rem] uppercase tracking-[0.18em] text-white/45">
          PV WORKS STREAM
        </p>
        <h2 className="mt-4 text-2xl font-black tracking-[-0.04em]">作品流暂时不可用</h2>
        <p className="mt-3 max-w-[520px] text-sm leading-6 text-white/60">
          数据服务暂时没有响应，请稍后重新加载。已有作品没有被清空。
        </p>
        <Button
          className="mt-6 w-fit"
          onClick={handleReload}
          type="button"
          variant="pill"
        >
          重新加载
        </Button>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div
        className="flex min-h-[280px] flex-col justify-center rounded-3xl border border-black/10 bg-black/[0.03] px-8 py-8 text-black"
        id="featured-grid"
      >
        <p className="font-sans text-[0.72rem] uppercase tracking-[0.18em] text-black/45">
          PV WORKS STREAM
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
      variants={gridVariants}
      viewport={{ once: true, amount: 0.18 }}
      whileInView={shouldAnimateInView ? "visible" : prefersReducedMotion ? undefined : "hidden"}
    >
      <div className="-mx-4 sm:-mx-6 lg:-mx-6">
        <div className="relative overflow-hidden">
          <Marquee 
            play={!prefersReducedMotion}
            pauseOnHover={true} 
            speed={40} 
            gradient={false} 
            className="overflow-y-hidden py-2"
          >
            <div className="flex flex-row items-stretch gap-4 pr-4 sm:gap-5 sm:pr-5">
              {items.map((item) => (
                <motion.div 
                  className="h-full w-[17rem] min-w-[17rem] xl:w-[19rem] xl:min-w-[19rem]" 
                  key={item.id} 
                  variants={gridItemVariants}
                >
                  <VideoArchiveCard item={item} />
                </motion.div>
              ))}
            </div>
          </Marquee>
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-[linear-gradient(to_right,#090909_0%,#090909_34%,rgba(9,9,9,0.94)_62%,rgba(9,9,9,0)_100%)] sm:w-20 lg:w-24"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-[linear-gradient(to_left,#090909_0%,#090909_34%,rgba(9,9,9,0.94)_62%,rgba(9,9,9,0)_100%)] sm:w-20 lg:w-24"
          />
        </div>
      </div>
    </motion.section>
  );
}
