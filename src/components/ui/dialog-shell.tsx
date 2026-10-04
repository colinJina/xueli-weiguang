"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

import CloseIcon from "@/components/icons/shared/close-16.svg";
import { IconButton } from "@/components/ui/icon-button";
import { cn } from "@/lib/utils";

type DialogShellProps = {
  children: ReactNode;
  className?: string;
  closeLabel: string;
  description: ReactNode;
  maxWidthClassName?: string;
  manageFocus?: boolean;
  onClose: () => void;
  title: ReactNode;
  titleAside?: ReactNode;
};

export function DialogShell({
  children,
  className,
  closeLabel,
  description,
  maxWidthClassName = "max-w-[520px]",
  manageFocus = false,
  onClose,
  title,
  titleAside,
}: DialogShellProps) {
  const panelRef = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (!manageFocus || !panelRef.current) { return; }
    const panel = panelRef.current;
    const previouslyFocused = document.activeElement;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const getFocusableElements = () => Array.from(panel.querySelectorAll<HTMLElement>(
      'button:not(:disabled), a[href], input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])',
    )).filter((element) => element.tabIndex >= 0 && element.getClientRects().length > 0);
    (getFocusableElements()[0] ?? panel).focus();
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
      } else if (event.key === "Tab") {
        const elements = getFocusableElements();
        const first = elements[0];
        const last = elements.at(-1);
        if (!first || !last) {
          event.preventDefault();
          panel.focus();
        } else if (event.shiftKey && (document.activeElement === first || !panel.contains(document.activeElement))) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
          event.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
      if (previouslyFocused instanceof HTMLElement && previouslyFocused.isConnected) { previouslyFocused.focus(); }
    };
  }, [manageFocus, onClose]);

  return (
    <div
      aria-describedby={descriptionId}
      aria-labelledby={titleId}
      aria-modal="true"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/82 px-5 py-8 backdrop-blur-sm"
      role="dialog"
    >
      <div aria-hidden="true" className="absolute inset-0" onClick={onClose} />

      <div
        ref={panelRef}
        tabIndex={manageFocus ? -1 : undefined}
        className={cn(
          "relative z-[1] w-full rounded-xl border border-border bg-background px-6 py-6 shadow-overlay sm:px-7",
          maxWidthClassName,
          className,
        )}
      >
        <div className="flex shrink-0 items-start justify-between gap-4 border-b border-border pb-5">
          <div className="min-w-0 space-y-2">
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-[-0.04em] text-foreground" id={titleId}>
                {title}
              </h2>
              <p className="text-sm leading-6 text-muted" id={descriptionId}>{description}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {titleAside}
            <IconButton aria-label={closeLabel} onClick={onClose} variant="surface">
              <CloseIcon aria-hidden="true" className="h-3.5 w-3.5" />
            </IconButton>
          </div>
        </div>

        {children}
      </div>
    </div>
  );
}
