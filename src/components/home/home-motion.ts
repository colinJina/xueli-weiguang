import type { Transition, Variants } from "motion/react";
export const homeEase: [number, number, number, number] = [0.16, 1, 0.3, 1];
export const homeIntroDurationMs = 3800;
export const homeIntroSessionKey = "xueli-weiguang:home-intro-seen";
export const hoverTransition: Transition = {
  duration: 0.5,
  ease: homeEase,
};

export function createFadeUp(
  distance = 16,
  delay = 0,
  duration = 0.4,
): Variants {
  return {
    hidden: {
      opacity: 0,
      y: distance,
      filter: "blur(8px)",
    },
    visible: {
      opacity: 1,
      y: 0,
      filter: "blur(0px)",
      transition: {
        delay,
        duration,
        ease: homeEase,
      },
    },
  };
}

export function createStagger(
  delayChildren = 0,
  staggerChildren = 0.08,
): Variants {
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
      duration: 0.3,
      ease: homeEase,
    },
  },
  exit: {
    opacity: 0,
    transition: {
      duration: 1.0,
      ease: homeEase,
    },
  },
};

export const introLogoVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 12,
    scale: 1.05,
    clipPath: "inset(100% 0 0 0 round 28px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    scale: 1,
    clipPath: "inset(0% 0 0 0 round 28px)",
    transition: {
      delay: 0.1,
      duration: 0.4,
      ease: homeEase,
    },
  },
};

export const introWordmarkVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 10,
    letterSpacing: "-0.08em",
    filter: "blur(6px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    letterSpacing: "-0.02em",
    filter: "blur(0px)",
    transition: {
      delay: 0.25,
      duration: 0.5,
      ease: homeEase,
    },
  },
};
export const introDetailVariants: Variants = {
  hidden: {
    opacity: 0,
    y: 8,
    filter: "blur(4px)",
  },
  visible: {
    opacity: 1,
    y: 0,
    filter: "blur(0px)",
    transition: {
      delay: 0.4,
      duration: 0.4,
      ease: homeEase,
    },
  },
};
