"use client";

import { useRef, type ReactNode } from "react";

import CloseIcon from "@/components/icons/shared/close-16.svg";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  const returnFocusRef = useRef<HTMLElement | null>(null);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent
        className={cn(maxWidthClassName, className)}
        onOpenAutoFocus={() => {
          // These shells are opened by parent state, without a DialogTrigger.
          returnFocusRef.current =
            document.activeElement instanceof HTMLElement
              ? document.activeElement
              : null;
        }}
        onCloseAutoFocus={(event) => {
          event.preventDefault();
          const target = returnFocusRef.current;
          if (target?.isConnected) {
            target.focus({ preventScroll: true });
          }
        }}
        showCloseButton={false}
      >
        <DialogHeader className="flex-row shrink-0 items-start justify-between gap-4 border-b border-border pb-5">
          <div className="min-w-0 space-y-2">
            <div className="space-y-1">
              <DialogTitle>{title}</DialogTitle>
              <DialogDescription>{description}</DialogDescription>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {titleAside}
            <DialogClose asChild>
              <IconButton aria-label={closeLabel} variant="surface">
                <CloseIcon aria-hidden="true" className="h-3.5 w-3.5" />
              </IconButton>
            </DialogClose>
          </div>
        </DialogHeader>

        {children}
      </DialogContent>
    </Dialog>
  );
}
