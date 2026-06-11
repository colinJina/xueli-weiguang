import { motion } from "motion/react";

import { homeEase } from "@/components/home/home-motion";
import { cn } from "@/lib/utils";

type HomeBrandMarkAnimatedProps = {
  className?: string;
};

export function HomeBrandMarkAnimated({ className }: HomeBrandMarkAnimatedProps) {
  return (
    <motion.svg
      aria-hidden="true"
      className={cn("h-4 w-4", className)}
      fill="none"
      viewBox="0 0 24 24"
    >
      <motion.path
        d="M12 3.5 21 19H3L12 3.5Z"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.35"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.8, ease: homeEase, delay: 0.2 }}
      />
      <motion.path
        d="M12 7.5V14.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.2"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: homeEase, delay: 0.85 }}
      />
      <motion.path
        d="M9.5 14.5H14.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.2"
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 1.1, ease: homeEase, delay: 1.1 }}
      />
    </motion.svg>
  );
}
