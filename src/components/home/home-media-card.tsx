"use client";

import { motion, useReducedMotion } from "motion/react";
import Link from "next/link";

import type {
  HomeCardItem,
  HomeCardLayout,
  HomeCardVisual,
} from "@/components/home/home-content";
import { hoverTransition } from "@/components/home/home-motion";
import HomeImageIcon from "@/components/icons/home/image.svg";
import { cn } from "@/lib/utils";

type HomeMediaCardProps = {
  item: HomeCardItem;
};

const coverHeights: Record<HomeCardLayout, string> = {
  standard: "min-h-[13rem]",
  compact: "min-h-[11rem]",
  feature: "min-h-[22rem]",
  ghost: "min-h-[14rem]",
};

const cardVariants = {
  rest: {
    y: 0,
  },
  hover: {
    y: -4,
    transition: hoverTransition,
  },
};

const coverVariants = {
  rest: {
    scale: 1,
  },
  hover: {
    scale: 1.015,
    transition: hoverTransition,
  },
};

function CardVisual({ visual }: { visual: HomeCardVisual }) {
  if (visual === "blank") {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(220,220,216,0.28)),#f1f1ee]">
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(255,255,255,0.02))]" />
        <div className="absolute inset-0 grid place-items-center text-black/35">
          <HomeImageIcon aria-hidden="true" className="h-6 w-6" />
        </div>
      </div>
    );
  }

  if (visual === "city") {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.18),transparent_34%),linear-gradient(180deg,#585858_0%,#2a2a2b_45%,#090909_100%)]">
        <div className="absolute inset-x-[10%] bottom-0 h-[68%] bg-[linear-gradient(90deg,rgba(255,255,255,0.08)_0_10%,transparent_10%_20%,rgba(255,255,255,0.08)_20%_36%,transparent_36%_46%,rgba(255,255,255,0.06)_46%_62%,transparent_62%_72%,rgba(255,255,255,0.08)_72%_100%),linear-gradient(180deg,rgba(255,255,255,0.12),rgba(0,0,0,0.82))] opacity-90 [clip-path:polygon(8%_100%,14%_30%,28%_0,44%_54%,62%_10%,84%_100%)]" />
        <div className="absolute bottom-[8%] left-1/2 top-[18%] w-[26%] -translate-x-1/2 bg-[linear-gradient(180deg,rgba(255,255,255,0.62),transparent_70%)] blur-[6px]" />
      </div>
    );
  }

  if (visual === "ribbon") {
    return (
      <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(135deg,#111214_10%,#2e3034_35%,#0d0d0e_78%)]">
        <div className="absolute inset-[-12%_-20%] rotate-[-16deg] scale-[1.3] bg-[radial-gradient(circle_at_26%_40%,transparent_0_14%,rgba(255,255,255,0.82)_14%_16%,transparent_16%_22%,rgba(255,255,255,0.64)_22%_24%,transparent_24%_30%),radial-gradient(circle_at_74%_58%,transparent_0_12%,rgba(255,255,255,0.74)_12%_14%,transparent_14%_20%,rgba(255,255,255,0.54)_20%_22%,transparent_22%_28%)] opacity-70 blur-[1px]" />
        <div className="absolute inset-x-[12%] inset-y-[-8%] rotate-[8deg] bg-[linear-gradient(115deg,transparent_26%,rgba(255,255,255,0.86)_32%,transparent_38%,rgba(255,255,255,0.68)_48%,transparent_56%,rgba(255,255,255,0.52)_64%,transparent_72%)] opacity-70 blur-[8px]" />
      </div>
    );
  }

  return (
    <div className="absolute inset-0 overflow-hidden bg-[linear-gradient(180deg,#4b4c4f_0%,#2f3134_32%,#0f1011_100%)]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.16)_0_2px,transparent_2px),linear-gradient(45deg,rgba(255,255,255,0.08)_0_1px,transparent_1px)] bg-[length:48px_48px,22px_22px] opacity-25" />
      <div className="absolute inset-[12%_14%] rounded-full bg-[linear-gradient(180deg,rgba(255,255,255,0.22),transparent)] opacity-30 blur-[20px]" />
    </div>
  );
}

export function HomeMediaCard({ item }: HomeMediaCardProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <Link className="group block h-full" href={item.href}>
      <motion.article
        className="flex h-full flex-col overflow-hidden rounded-[22px] border border-white/8 bg-[#111214] shadow-[0_18px_48px_rgba(0,0,0,0.22)] transition-colors duration-300 group-hover:border-white/16"
        initial={prefersReducedMotion ? false : "rest"}
        animate={prefersReducedMotion ? undefined : "rest"}
        whileHover={prefersReducedMotion ? undefined : "hover"}
        variants={cardVariants}
      >
        <div
          className={cn(
            "relative overflow-hidden border-b border-white/6",
            coverHeights[item.layout],
          )}
        >
          <motion.div className="absolute inset-0" variants={coverVariants}>
            <CardVisual visual={item.visual} />
            <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.12),rgba(0,0,0,0.32))]" />
          </motion.div>

          <div className="absolute inset-x-4 top-4 flex items-start justify-between gap-3">
            <span className="rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
              {item.source}
            </span>
            <span className="rounded-full border border-white/10 bg-black/55 px-2.5 py-1 font-sans text-[11px] tracking-[0.12em] text-muted">
              {item.duration}
            </span>
          </div>

          <div className="absolute inset-x-4 bottom-4 flex items-end justify-between gap-4">
            <span className="rounded-full border border-white/10 bg-black/60 px-2.5 py-1 text-[11px] font-medium text-foreground">
              {item.tag}
            </span>
            <span className="rounded-full border border-white/10 bg-black/55 px-2.5 py-1 text-[11px] font-medium uppercase tracking-[0.16em] text-muted">
              {item.metric}
            </span>
          </div>
        </div>

        <div className="flex flex-1 flex-col justify-between gap-5 bg-[#111214] p-4">
          <div className="space-y-3">
            <h2 className="text-lg font-semibold leading-[1.2] tracking-[-0.04em] text-foreground transition duration-200 group-hover:text-white">
              {item.title}
            </h2>
            <p className="text-sm leading-6 text-muted">{item.description}</p>
          </div>

          <div className="flex items-center justify-between gap-4 border-t border-white/6 pt-3">
            <span className="font-sans text-[11px] uppercase tracking-[0.18em] text-subtle">
              {item.stats}
            </span>
            <span className="flex items-center gap-1.5" aria-hidden="true">
              <span className="h-1.5 w-1.5 rounded-full bg-white/85" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/28" />
              <span className="h-1.5 w-1.5 rounded-full bg-white/28" />
            </span>
          </div>
        </div>
      </motion.article>
    </Link>
  );
}
