"use client";

import { motion, useReducedMotion } from "motion/react";

import type { HomeCardItem, HomeCardLayout } from "@/components/home/home-content";
import { HomeMediaCard } from "@/components/home/home-media-card";
import { createFadeUp, createStagger } from "@/components/home/home-motion";
import { cn } from "@/lib/utils";

type HomeFeaturedGridProps = {
  items: readonly HomeCardItem[];
  motionReady?: boolean;
};

const layoutClasses: Record<HomeCardLayout, string> = {
  standard: "lg:mt-3",
  compact: "lg:mt-1",
  feature: "lg:-mt-4",
  ghost: "lg:mt-10",
};

const gridVariants = createStagger(0.06, 0.1);
const gridItemVariants = createFadeUp(18, 0, 0.34);

export function HomeFeaturedGrid({ items, motionReady = true }: HomeFeaturedGridProps) {
  const prefersReducedMotion = useReducedMotion();
  const shouldAnimateInView = motionReady && !prefersReducedMotion;

  return (
    <motion.div
      id="featured-grid"
      className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 lg:items-start lg:gap-5"
      initial={prefersReducedMotion ? false : "hidden"}
      whileInView={shouldAnimateInView ? "visible" : prefersReducedMotion ? undefined : "hidden"}
      viewport={{ once: true, amount: 0.18 }}
      variants={gridVariants}
    >
      {items.map((item) => (
        <motion.div
          className={cn("min-w-0", layoutClasses[item.layout])}
          key={item.id}
          variants={gridItemVariants}
        >
          <HomeMediaCard item={item} />
        </motion.div>
      ))}
    </motion.div>
  );
}
