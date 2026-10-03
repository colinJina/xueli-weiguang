"use client";

import { defaultRangeExtractor, useWindowVirtualizer } from "@tanstack/react-virtual";
import type { VirtualItem } from "@tanstack/react-virtual";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { VideoArchiveCard } from "@/components/archive/video-archive-card";
import type { ArchiveVideoItem } from "@/lib/videos/types";

const CARD_BODY_ESTIMATE = 240;
// A single-column card is narrower than the 768px breakpoint. Reserve enough
// height before measurement so a deep restored scroll position cannot be clamped.
const INITIAL_ROW_HEIGHT = 768 * 9 / 16 + CARD_BODY_ESTIMATE;
const measurementCache = new Map<string, { rows: VirtualItem[]; savedAt: number }>();

export function ArchiveVirtualGrid({ items, hasMore }: { items: ArchiveVideoItem[]; hasMore: boolean }) {
  const root = useRef<HTMLDivElement>(null);
  const [layout, setLayout] = useState({ columns: 1, gap: 18, offset: 0, estimate: 440, ready: false });
  const [focusedRow, setFocusedRow] = useState<number | null>(null);
  const cacheKey = `${items[0].id}:${typeof window === "undefined" ? 0 : window.innerWidth}`;
  const [initialMeasurements] = useState(() => {
    const cached = measurementCache.get(cacheKey);
    return cached && Date.now() - cached.savedAt < 60_000 ? cached.rows : [];
  });

  useLayoutEffect(() => {
    const element = root.current;
    if (!element) {
      return;
    }
    const measure = () => {
      const columns = window.innerWidth >= 1536 ? 4 : window.innerWidth >= 1280 ? 3 : window.innerWidth >= 768 ? 2 : 1;
      const gap = window.innerWidth >= 1280 ? 24 : 18;
      const offset = element.getBoundingClientRect().top + window.scrollY;
      const estimate = ((element.clientWidth - (columns - 1) * gap) / columns) * 9 / 16 + CARD_BODY_ESTIMATE;
      setLayout((previous) => previous.columns === columns && previous.gap === gap && previous.offset === offset && previous.estimate === estimate && previous.ready ? previous : { columns, gap, offset, estimate, ready: true });
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(element);
    if (element.parentElement) {
      observer.observe(element.parentElement);
    }
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    function retainFocusedRow(event: FocusEvent) {
      const target = event.target;
      const row = target instanceof Element ? target.closest<HTMLElement>("[data-archive-row]") : null;
      setFocusedRow(row && root.current?.contains(row) ? Number(row.dataset.index) : null);
    }
    document.addEventListener("focusin", retainFocusedRow);
    return () => document.removeEventListener("focusin", retainFocusedRow);
  }, []);

  const getItemKey = useCallback((index: number) => `${layout.columns}:${items[index * layout.columns].id}`, [items, layout.columns]);
  const rangeExtractor = useCallback((range: Parameters<typeof defaultRangeExtractor>[0]) => {
    const indexes = defaultRangeExtractor(range);
    if (focusedRow !== null && focusedRow < Math.ceil(items.length / layout.columns) && !indexes.includes(focusedRow)) {
      indexes.push(focusedRow);
      indexes.sort((a, b) => a - b);
    }
    return indexes;
  }, [focusedRow, items.length, layout.columns]);
  const virtualizer = useWindowVirtualizer<HTMLDivElement>({
    count: Math.ceil(items.length / layout.columns),
    estimateSize: () => layout.estimate,
    scrollMargin: layout.offset,
    gap: layout.gap,
    overscan: 3,
    enabled: layout.ready,
    getItemKey,
    rangeExtractor,
    initialMeasurementsCache: initialMeasurements,
  });

  useEffect(() => () => {
    measurementCache.delete(cacheKey);
    measurementCache.set(cacheKey, { rows: virtualizer.takeSnapshot(), savedAt: Date.now() });
    while (measurementCache.size > 2) {
      const oldest = measurementCache.keys().next().value;
      if (oldest !== undefined) {
        measurementCache.delete(oldest);
      }
    }
  }, [cacheKey, virtualizer]);

  return (
    <div ref={root} role="list" className="relative" style={{ height: layout.ready ? virtualizer.getTotalSize() : items.length * INITIAL_ROW_HEIGHT }}>
      {layout.ready ? virtualizer.getVirtualItems().map((row) => (
        <div key={row.key} data-index={row.index} data-archive-row ref={virtualizer.measureElement} role="presentation"
          className="absolute left-0 top-0 grid w-full items-stretch hover:z-10 focus-within:z-10"
          style={{ gridTemplateColumns: `repeat(${layout.columns}, minmax(0, 1fr))`, gap: layout.gap, transform: `translateY(${row.start - layout.offset}px)` }}>
          {items.slice(row.index * layout.columns, (row.index + 1) * layout.columns).map((item, index) => (
            <div className="h-full w-full min-w-0" key={item.id} role="listitem" aria-posinset={row.index * layout.columns + index + 1} aria-setsize={hasMore ? -1 : items.length}>
              <VideoArchiveCard item={item} />
            </div>
          ))}
        </div>
      )) : <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 xl:gap-6">{items.slice(0, 24).map((item) => <div key={item.id} role="listitem"><VideoArchiveCard item={item} /></div>)}</div>}
    </div>
  );
}
