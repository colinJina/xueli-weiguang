"use client";

import { motion, useReducedMotion } from "motion/react";

import { cn } from "@/lib/utils";

type InlineLoadingMarkProps = {
  className?: string;
  label?: string;
};

const loadingDots = [0, 1, 2];
const loadingEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function InlineLoadingMark({
  className,
  label = "正在加载",
}: InlineLoadingMarkProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <span
      aria-label={label}
      className={cn("inline-flex h-5 w-5 items-center justify-center text-foreground", className)}
      role="status"
    >
      <span
        aria-hidden="true"
        className="relative inline-flex h-full w-full items-center justify-center"
      >
        <motion.span
          animate={prefersReducedMotion ? { opacity: 0.85 } : { rotate: 360 }}
          className="absolute inset-0 rounded-full border border-white/15 border-t-white/80"
          transition={{
            duration: 0.82,
            ease: "linear",
            repeat: prefersReducedMotion ? 0 : Infinity,
          }}
        />
        <span className="inline-flex items-center gap-[2px]">
          {loadingDots.map((dot) => (
            <motion.span
              animate={
                prefersReducedMotion
                  ? { opacity: 0.7, y: 0 }
                  : { opacity: [0.28, 0.95, 0.28], y: [1, -1, 1] }
              }
              className="h-[3px] w-[3px] rounded-full bg-white/85"
              key={dot}
              transition={{
                delay: dot * 0.12,
                duration: 0.72,
                ease: loadingEase,
                repeat: prefersReducedMotion ? 0 : Infinity,
              }}
            />
          ))}
        </span>
      </span>
    </span>
  );
}
