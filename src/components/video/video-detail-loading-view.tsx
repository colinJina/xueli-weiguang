"use client";

import { motion, useReducedMotion } from "motion/react";

import { VideoDetailNav } from "@/components/video/video-detail-nav";

const archiveDots = Array.from({ length: 5 }, (_, index) => index);

const skeletonRows = [
  "h-10 w-[82%] sm:h-12 lg:w-[72%]",
  "h-5 w-[54%] sm:w-[38%]",
  "h-24 w-full",
  "h-5 w-[68%] sm:w-[46%]",
];

export function VideoDetailLoadingView() {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="min-h-screen bg-background">
      <VideoDetailNav />

      <main className="page-container py-6 sm:py-8 lg:py-10">
        <section
          aria-busy="true"
          aria-label="视频详情正在加载"
          className="mx-auto flex w-full max-w-[1100px] flex-col gap-7 lg:gap-8"
          role="status"
        >
          <div className="relative aspect-video overflow-hidden rounded-xl border border-white/10 bg-panel shadow-hero">
            <div className="absolute left-4 top-4 z-10 sm:left-5 sm:top-5">
              <div className="inline-flex items-center gap-2 rounded-[12px] border border-white/10 bg-[rgba(10,10,11,0.86)] px-3 py-2 text-[0.78rem] font-medium text-foreground shadow-panel">
                <span className="h-2 w-2 rounded-full bg-white/70" aria-hidden="true" />
                <span>正在载入视频档案</span>
              </div>
            </div>

            <div
              aria-hidden="true"
              className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.08),transparent_18%,transparent_82%,rgba(255,255,255,0.06))]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-30 [background-image:linear-gradient(rgba(255,255,255,0.055)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.045)_1px,transparent_1px)] [background-size:100%_18px,28px_100%]"
            />

            {!prefersReducedMotion ? (
              <motion.div
                aria-hidden="true"
                animate={{ x: ["-120%", "220%"] }}
                className="absolute inset-y-0 left-0 w-1/3 bg-[linear-gradient(90deg,transparent,rgba(245,245,243,0.2),transparent)] blur-sm"
                transition={{
                  duration: 1.35,
                  ease: [0.22, 1, 0.36, 1],
                  repeat: Infinity,
                  repeatDelay: 0.12,
                }}
              />
            ) : null}

            <div className="absolute inset-0 grid place-items-center px-8">
              <div className="flex w-full max-w-[420px] flex-col items-center gap-5">
                <div className="flex w-full items-center gap-3" aria-hidden="true">
                  <span className="h-px flex-1 bg-white/12" />
                  <div className="flex items-center gap-2">
                    {archiveDots.map((dot) => (
                      <motion.span
                        animate={
                          prefersReducedMotion
                            ? { opacity: 0.55, scale: 1 }
                            : { opacity: [0.25, 1, 0.25], scale: [0.92, 1.12, 0.92] }
                        }
                        className="h-2 w-2 rounded-full border border-white/20 bg-white/10"
                        key={dot}
                        transition={{
                          delay: dot * 0.1,
                          duration: 0.9,
                          ease: [0.22, 1, 0.36, 1],
                          repeat: prefersReducedMotion ? 0 : Infinity,
                        }}
                      />
                    ))}
                  </div>
                  <span className="h-px flex-1 bg-white/12" />
                </div>

                <motion.div
                  animate={prefersReducedMotion ? { opacity: 1 } : { opacity: [0.48, 0.86, 0.48] }}
                  className="h-2 w-28 rounded-full bg-white/12"
                  transition={{ duration: 1.1, repeat: prefersReducedMotion ? 0 : Infinity }}
                />
              </div>
            </div>
          </div>

          <div className="space-y-5">
            {skeletonRows.map((className, index) => (
              <motion.div
                animate={{ opacity: 1, y: 0 }}
                className={`rounded-[18px] border border-white/[0.06] bg-white/[0.035] ${className}`}
                initial={prefersReducedMotion ? false : { opacity: 0, y: 8 }}
                key={className}
                transition={{
                  delay: prefersReducedMotion ? 0 : 0.06 * index,
                  duration: 0.28,
                  ease: [0.22, 1, 0.36, 1],
                }}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}
