"use client";

import { motion, useReducedMotion } from "motion/react";

import type { HomeMetaStripItem } from "@/components/home/home-content";
import { createFadeUp, createStagger } from "@/components/home/home-motion";

type HomeMetaStripProps = {
  items: readonly HomeMetaStripItem[];
  motionReady?: boolean;
};

const metaStripVariants = createFadeUp(10, 0.06, 0.28);
const metaStripListVariants = createStagger(0.04, 0.08);
const metaStripItemVariants = createFadeUp(8, 0, 0.24);

export function HomeMetaStrip({ items, motionReady = true }: HomeMetaStripProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimateEntrance = motionReady && !prefersReducedMotion;

  return (
    <motion.section
      className="border-y border-white/6 bg-[#111112]"
      initial={prefersReducedMotion ? false : "hidden"}
      animate={shouldAnimateEntrance ? "visible" : prefersReducedMotion ? undefined : "hidden"}
      variants={metaStripVariants}
    >
      <motion.div
        className="page-container flex flex-wrap items-center gap-x-5 gap-y-3 py-5 text-xs"
        variants={metaStripListVariants}
      >
        {items.map((item, index) => (
          <motion.div className="flex items-center gap-3" key={item.label} variants={metaStripItemVariants}>
            <span className="font-sans uppercase tracking-[0.18em] text-subtle">{item.label}</span>
            <span className="text-sm font-medium text-foreground">{item.value}</span>
            {index < items.length - 1 ? (
              <span aria-hidden="true" className="h-3 w-px bg-white/12" />
            ) : null}
          </motion.div>
        ))}
      </motion.div>
    </motion.section>
  );
}
