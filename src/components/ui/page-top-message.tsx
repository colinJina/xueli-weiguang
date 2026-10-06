"use client";

import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import {
  ToastProvider,
  Toast,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const MotionButton = motion.create(Button);

export type PageTopMessagePayload = {
  actionLabel?: string;
  durationMs?: number | null;
  icon?: ReactNode;
  id: number;
  onClick?: () => void;
  text: string;
};

type PageTopMessageProps = {
  message: PageTopMessagePayload | null;
  onDismiss: (id: number) => void;
};

export function PageTopMessage({ message, onDismiss }: PageTopMessageProps) {
  const prefersReducedMotion = useReducedMotion();

  return (
    <ToastProvider label="通知">
      <AnimatePresence initial={false}>
        {message ? (
          <Toast
            asChild
            forceMount
            open
            duration={
              message.durationMs === null ? Infinity : message.durationMs
            }
            key={message.id}
            onOpenChange={(open) => {
              if (!open) {
                onDismiss(message.id);
              }
            }}
          >
            <motion.li className="pointer-events-auto max-w-full">
              <MotionButton
                aria-label={message.actionLabel ?? `关闭提示：${message.text}`}
                variant="unstyled"
                size="sm"
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
                onClick={() => {
                  message.onClick?.();
                  onDismiss(message.id);
                }}
                transition={{
                  duration: prefersReducedMotion ? 0.16 : 0.22,
                  ease: "easeOut",
                }}
                type="button"
              >
                {message.icon ? (
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center text-foreground [&>svg]:h-4 [&>svg]:w-4">
                    {message.icon}
                  </span>
                ) : null}
                <ToastTitle asChild>
                  <span className="break-words">{message.text}</span>
                </ToastTitle>
              </MotionButton>
            </motion.li>
          </Toast>
        ) : null}
      </AnimatePresence>
      <ToastViewport />
    </ToastProvider>
  );
}
