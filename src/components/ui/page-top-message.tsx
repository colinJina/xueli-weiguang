"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type PageTopMessagePayload = {
  icon?: ReactNode;
  id: number;
  text: string;
};

type PageTopMessageProps = {
  message: PageTopMessagePayload | null;
  onDismiss: () => void;
};

export function PageTopMessage({
  message,
  onDismiss,
}: PageTopMessageProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <div className="pointer-events-none fixed inset-x-0 top-4 z-[120] flex justify-center px-4 sm:top-5">
      <AnimatePresence initial={false}>
        {message ? (
          <motion.button
            animate={
              prefersReducedMotion
                ? { opacity: 1 }
                : { opacity: 1, y: 0, scale: 1 }
            }
            className={cn(
              "pointer-events-auto inline-flex min-h-[60px] items-center gap-3 rounded-[22px] border border-white/[0.08] bg-[#232323] px-6 py-4 text-left text-[0.95rem] font-semibold text-foreground shadow-[0_14px_36px_rgba(0,0,0,0.28)] backdrop-blur-md",
              "transition hover:border-white/[0.14] hover:bg-[#272727]",
            )}
            exit={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -10, scale: 0.98 }
            }
            initial={
              prefersReducedMotion
                ? { opacity: 0 }
                : { opacity: 0, y: -12, scale: 0.96 }
            }
            key={message.id}
            onClick={onDismiss}
            transition={{ duration: prefersReducedMotion ? 0.16 : 0.22, ease: "easeOut" }}
            type="button"
          >
            {message.icon ? (
              <span className="shrink-0 text-foreground">{message.icon}</span>
            ) : null}
            <span className="whitespace-nowrap">{message.text}</span>
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
