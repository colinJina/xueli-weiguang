"use client";

import type { ReactNode, WheelEvent } from "react";
import { resolveHorizontalWheelDelta } from "./archive-horizontal-wheel";

export function ArchiveHorizontalWheelScroll({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  function handleWheel(event: WheelEvent<HTMLDivElement>) {
    const delta = resolveHorizontalWheelDelta(event);

    if (delta === 0) {
      return;
    }

    event.preventDefault();
    event.currentTarget.scrollLeft += delta;
  }

  return (
    <div className={className} onWheel={handleWheel}>
      {children}
    </div>
  );
}
