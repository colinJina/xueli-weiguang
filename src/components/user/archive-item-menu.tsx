"use client";

import { useRef } from "react";

import MoreIcon from "@/components/icons/shared/more-16.svg";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { IconButton } from "@/components/ui/icon-button";

export function ArchiveItemMenu({
  onAdjust,
  onEdit,
  readOnly,
}: {
  onAdjust: () => void;
  onEdit: () => void;
  readOnly: boolean;
}) {
  const triggerRef = useRef<HTMLButtonElement>(null);
  const pendingActionRef = useRef<(() => void) | null>(null);

  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger asChild>
        <IconButton aria-label="收藏操作" ref={triggerRef} size="sm" variant="surface">
          <MoreIcon aria-hidden="true" />
        </IconButton>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-40"
        onCloseAutoFocus={(event) => {
          const action = pendingActionRef.current;
          if (!action) {
            return;
          }
          // Restore the trigger before mounting a dialog, so it can return here.
          event.preventDefault();
          pendingActionRef.current = null;
          triggerRef.current?.focus({ preventScroll: true });
          action();
        }}
      >
        <DropdownMenuItem
          className="min-h-9 text-xs font-semibold"
          onSelect={() => { pendingActionRef.current = onAdjust; }}
        >
          调整收藏夹
        </DropdownMenuItem>
        <DropdownMenuItem
          className="min-h-9 text-xs font-semibold"
          onSelect={() => { pendingActionRef.current = onEdit; }}
        >
          {readOnly ? "查看备注与标签" : "备注与标签"}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
