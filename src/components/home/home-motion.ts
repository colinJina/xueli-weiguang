import type { Transition, Variants } from "motion/react";

export const homeEase: [number, number, number, number] = [0.22, 1, 0.36, 1];

export const homeIntroDurationMs = 1080;
export const homeIntroSessionKey = "xueli-weiguang:home-intro-seen";

export const hoverTransition: Transition = {
  duration: 0.18,
  ease: homeEase,
};

export function createFadeUp(distance = 12, delay = 0, duration = 0.32): Variants {
  return {
    hidden: {
      opacity: 0,
      y: distance,
    },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        delay,
        duration,
        ease: homeEase,
      },
    },
  };
}

export function createStagger(delayChildren = 0, staggerChildren = 0.08): Variants {
  return {
    hidden: {},
    visible: {
      transition: {
        delayChildren,
        staggerChildren,
      },
    },
  };
}

export const introOverlayVariants: Variants = {
  hidden: {
    opacity: 0,
  },
  visible: {
    opacity: 1,
    transition: {
      duration: 0.22,
      ease: homeEase,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 0.26,
      ease: homeEase,
    },
  },
};

export const introLogoVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
    clipPath: "inset(100% 0 0 0 round 28px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    clipPath: "inset(0% 0 0 0 round 28px)",
    transition: {
      delay: 0.16,
      duration: 0.26,
      ease: homeEase,
    },
  },
};

export const introWordmarkVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
    letterSpacing: "-0.08em",
  },
  visible: {
    opacity: 1,
    y: 0,
    letterSpacing: "-0.04em",
    transition: {
      delay: 0.32,
      duration: 0.3,
      ease: homeEase,
    },
  },
};

export const introDetailVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
  },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.52,
      duration: 0.24,
      ease: homeEase,
    },
  },
};
