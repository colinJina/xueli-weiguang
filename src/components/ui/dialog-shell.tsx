"use client";

import type { ReactNode } from "react";

import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

type DialogShellProps = {
  children: ReactNode;
  className?: string;
  closeLabel: string;
  description: ReactNode;
  maxWidthClassName?: string;
  onClose: () => void;
  title: ReactNode;
  titleAside?: ReactNode;
};

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 16 16">
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

export function DialogShell({
  children,
  className,
  closeLabel,
  description,
  maxWidthClassName = "max-w-[520px]",
  onClose,
  title,
  titleAside,
}: DialogShellProps) {
  return (
    <div
      aria-modal="true"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/82 px-5 py-8 backdrop-blur-sm"
      role="dialog"
    >
      <div aria-hidden="true" className="absolute inset-0" onClick={onClose} />

      <div
        className={cn(
          "relative z-[1] w-full rounded-xl border border-border bg-background px-6 py-6 shadow-overlay sm:px-7",
          maxWidthClassName,
          className,
        )}
      >
        <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
          <div className="min-w-0 space-y-2">
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-[-0.04em] text-foreground">
                {title}
              </h2>
              <p className="text-sm leading-6 text-muted">{description}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {titleAside}
            <IconButton aria-label={closeLabel} onClick={onClose} variant="surface">
              <CloseIcon />
            </IconButton>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
