"use client";

import { AnimatePresence, motion } from "motion/react";

import { HomeBrandMark } from "@/components/home/home-icons";
import {
  introDetailVariants,
  introLogoVariants,
  introOverlayVariants,
  introWordmarkVariants,
} from "@/components/home/home-motion";

type HomeIntroLoaderProps = {
  visible: boolean;
};

export function HomeIntroLoader({ visible }: HomeIntroLoaderProps) {
  return (
    <AnimatePresence>
      {visible ? (
        <motion.div
          className="fixed inset-0 z-[80] grid place-items-center bg-[#050505]"
          initial="hidden"
          animate="visible"
          exit="exit"
          variants={introOverlayVariants}
        >
          <div className="flex flex-col items-center gap-6 px-6 text-center">
            <motion.div
              className="grid h-20 w-20 place-items-center rounded-[28px] border border-white/10 bg-white/[0.02] shadow-[0_12px_36px_rgba(0,0,0,0.28)]"
              variants={introLogoVariants}
            >
              <HomeBrandMark className="h-10 w-10 text-[#f5f5f3]" />
            </motion.div>

            <motion.div className="space-y-3" variants={introWordmarkVariants}>
              <p className="text-[2.25rem] font-bold tracking-[-0.04em] text-white sm:text-[2.9rem]">
                雪笠微光
              </p>
            </motion.div>

            <motion.div
              className="flex items-center justify-center gap-3 text-[#8b8e97]"
              variants={introDetailVariants}
            >
              <span aria-hidden="true" className="h-px w-10 bg-white/12" />
              <span className="font-sans text-[0.72rem] tracking-[0.22em] text-[#8b8e97]">
                VIDEO ARCHIVE
              </span>
              <span aria-hidden="true" className="h-px w-10 bg-white/12" />
            </motion.div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
