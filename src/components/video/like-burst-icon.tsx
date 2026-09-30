"use client";

import { motion, useReducedMotion } from "motion/react";

import VideoHeartIcon from "@/components/icons/video/heart.svg";
import VideoHeartFilledIcon from "@/components/icons/video/heart-filled.svg";

type LikeBurstIconProps = {
  burstKey: number;
  liked: boolean;
};

const burstParticles = Array.from({ length: 8 }, (_, index) => {
  const angle = (index * Math.PI) / 4;

  return {
    x: Math.cos(angle) * 18,
    y: Math.sin(angle) * 18,
  };
});

export function LikeBurstIcon({ burstKey, liked }: LikeBurstIconProps) {
  const prefersReducedMotion = useReducedMotion();

  if (!liked) {
    return <VideoHeartIcon aria-hidden="true" className="h-[1.05rem] w-[1.05rem]" />;
  }

  return (
    <span className="relative grid h-[1.05rem] w-[1.05rem] flex-none place-items-center">
      {!prefersReducedMotion && burstKey > 0 ? (
        <span aria-hidden="true" className="pointer-events-none absolute inset-0">
          <motion.span
            animate={{ opacity: [0, 0.55, 0], scale: [0.25, 1.9, 2.35] }}
            className="absolute inset-0 rounded-full border border-current"
            initial={{ opacity: 0, scale: 0.25 }}
            key={`ring-${burstKey}`}
            transition={{ duration: 0.52, ease: [0.22, 1, 0.36, 1] }}
          />

          {burstParticles.map((particle, index) => (
            <motion.span
              animate={{
                opacity: [0, 0.9, 0],
                scale: [0.35, 1, 0.25],
                x: [0, particle.x * 0.45, particle.x],
                y: [0, particle.y * 0.45, particle.y],
              }}
              className="absolute left-1/2 top-1/2 -ml-0.5 -mt-0.5 h-1 w-1 rounded-full bg-current"
              initial={{ opacity: 0, scale: 0.35, x: 0, y: 0 }}
              key={`${burstKey}-${index}`}
              transition={{
                delay: 0.04 + index * 0.012,
                duration: 0.58,
                ease: [0.16, 1, 0.3, 1],
              }}
            />
          ))}
        </span>
      ) : null}

      <motion.span
        animate={
          prefersReducedMotion || burstKey === 0
            ? { scale: 1 }
            : { scale: [0.58, 1.42, 0.88, 1.08, 1] }
        }
        className="relative z-10 block h-[1.05rem] w-[1.05rem]"
        initial={prefersReducedMotion || burstKey === 0 ? false : { scale: 0.58 }}
        key={`heart-${burstKey}`}
        transition={{ duration: 0.62, ease: [0.22, 1, 0.36, 1] }}
      >
        <VideoHeartFilledIcon aria-hidden="true" className="h-full w-full" />
      </motion.span>
    </span>
  );
}
