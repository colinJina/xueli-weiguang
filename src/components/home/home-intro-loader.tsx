"use client";

import { AnimatePresence, motion } from "motion/react";

import { homeEase } from "@/components/home/home-motion";
import { HomeBrandMarkAnimated } from "./home-brand-mark-animated";

type HomeIntroLoaderProps = {
  visible: boolean;
};
export function HomeIntroLoader({ visible }: HomeIntroLoaderProps) {
  const titleText = "雪笠微光".split("");
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[80] grid place-items-center bg-[#090909]" 
          initial={{ opacity: 1 }}
          exit={{
            opacity: 0,
            y: "-100%", 
            transition: { duration: 1.2, ease: homeEase },
          }}
        >
          <div className="flex flex-col items-center gap-8 px-6 text-center">
            <motion.div
              className="grid h-24 w-24 place-items-center rounded-3xl border border-white/5 bg-white/[0.01] shadow-[0_0_40px_rgba(255,255,255,0.03)]"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1.1, ease: homeEase }}
            >
              <HomeBrandMarkAnimated className="h-12 w-12 text-white" />
            </motion.div>

            <motion.div
              className="flex space-x-2 overflow-hidden"
              initial="hidden"
              animate="visible"
              variants={{
                hidden: {},
                visible: {
                  transition: { staggerChildren: 0.18, delayChildren: 1.35 },
                }, 
              }}
            >
              {titleText.map((char, index) => (
                <motion.span
                  key={index}
                  className="text-[2.25rem] font-bold tracking-widest text-white sm:text-[3rem]"
                  variants={{
                    hidden: { opacity: 0, y: 20, filter: "blur(8px)" },
                    visible: {
                      opacity: 1,
                      y: 0,
                      filter: "blur(0px)",
                      transition: { duration: 0.7, ease: homeEase },
                    },
                  }}
                >
                  {char}
                </motion.span>
              ))}
            </motion.div>

            <motion.div className="flex items-center justify-center gap-3 overflow-hidden text-[#8b8e97] sm:gap-4">
              <motion.span
                className="h-px w-7 bg-white/20 sm:w-10"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, ease: homeEase, delay: 2.25 }}
              />
              <motion.span
                className="font-sans text-[0.68rem] tracking-[0.2em] text-[#8b8e97] sm:text-[0.75rem] sm:tracking-[0.3em]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.75, ease: homeEase, delay: 2.45 }}
              >
                PV WORKS ARCHIVE
              </motion.span>
              <motion.span
                className="h-px w-7 bg-white/20 sm:w-10"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, ease: homeEase, delay: 2.25 }}
              />
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
