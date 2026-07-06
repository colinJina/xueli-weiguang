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
              "pointer-events-auto inline-flex min-h-[44px] items-center gap-3 rounded-full border border-white/20 bg-black/55 px-4 py-2.5 text-left text-[0.95rem] font-semibold text-foreground backdrop-blur-sm",
              "transition hover:border-white/30 hover:bg-black/65",
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
              <span className="flex h-6 w-6 shrink-0 items-center justify-center text-[#78EC9F] [&>svg]:h-4 [&>svg]:w-4">
                {message.icon}
              </span>
            ) : null}
            <span className="whitespace-nowrap">{message.text}</span>
          </motion.button>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
