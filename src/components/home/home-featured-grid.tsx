"use client";

import { useReducedMotion, motion } from "motion/react";
import Marquee from "react-fast-marquee"; 
import { VideoArchiveCard } from "@/components/archive/video-archive-card";
import { createFadeUp, createStagger } from "@/components/home/home-motion";
import { StatePanel } from "@/components/ui/state-panel";
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
    return <StatePanel id="featured-grid" kind="error" title="PV 加载失败" description="数据服务暂时没有响应，请稍后重试">
      <Button onClick={handleReload} type="button" variant="secondary">重试</Button>
    </StatePanel>;
  }
  if (items.length === 0) {
    return <StatePanel id="featured-grid" title="暂无 PV" description="收录的 PV 将显示在这里" />;
  }

  return (
    <motion.section
      className="space-y-5"
      id="featured-grid"
      initial={prefersReducedMotion ? false : "hidden"}
      animate={prefersReducedMotion ? "visible" : undefined}
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
            className="pointer-events-none absolute inset-y-0 left-0 z-10 w-12 bg-gradient-to-r from-background to-transparent sm:w-20 lg:w-24"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-y-0 right-0 z-10 w-12 bg-gradient-to-l from-background to-transparent sm:w-20 lg:w-24"
          />
        </div>
      </div>
    </motion.section>
  );
}
