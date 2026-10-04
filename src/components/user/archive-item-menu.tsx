"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { IconButton } from "@/components/ui/icon-button";
import MoreIcon from "@/components/icons/shared/more-16.svg";

export function ArchiveItemMenu({
  onAdjust,
  onEdit,
  readOnly,
}: {
  onAdjust: () => void;
  onEdit: () => void;
  readOnly: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const panelId = useId();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) {
      return;
    }
    function outside(event: PointerEvent) {
      if (
        event.target instanceof Node &&
        !ref.current?.contains(event.target)
      ) {
        setOpen(false);
      }
    }
    function escape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setOpen(false);
        ref.current?.querySelector("button")?.focus();
      }
    }
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);

  function select(action: () => void) {
    setOpen(false);
    ref.current?.querySelector("button")?.focus();
    action();
  }

  return (
    <div className="relative shrink-0" ref={ref}>
      <IconButton
        aria-controls={panelId}
        aria-expanded={open}
        aria-label="收藏操作"
        onClick={() => setOpen((value) => !value)}
        size="sm"
        type="button"
        variant="surface"
      >
        <MoreIcon aria-hidden="true" />
      </IconButton>
      {open ? (
        <div
          className="absolute right-0 top-10 z-20 w-40 rounded-lg border border-border bg-background p-1 shadow-overlay"
          id={panelId}
        >
          <Button
            className="w-full justify-start"
            onClick={() => select(onAdjust)}
            size="sm"
            type="button"
            variant="ghost"
          >
            调整收藏夹
          </Button>
          <Button
            className="w-full justify-start"
            onClick={() => select(onEdit)}
            size="sm"
            type="button"
            variant="ghost"
          >
            {readOnly ? "查看备注与标签" : "备注与标签"}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
