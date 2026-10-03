"use client";

import { useEffect, useId, useRef, useState } from "react";
import { ArchiveColorPicker } from "@/components/archive/archive-color-picker";
import type { ArchiveChangeOptions } from "@/components/archive/use-archive-videos";
import CloseIcon from "@/components/icons/shared/close-16.svg";
import { Button } from "@/components/ui/button";
import { FilterButton } from "@/components/ui/filter-button";
import { IconButton } from "@/components/ui/icon-button";
import {
  DEFAULT_COLOR_PRECISION,
  MAX_TARGET_COLORS,
} from "@/lib/videos/archive-filters";
import type { FilterPatch } from "@/lib/videos/archive-href";
import type { ArchiveFilters, ColorTarget } from "@/lib/videos/types";

type Props = {
  filters: ArchiveFilters;
  onChange: (patch: FilterPatch, options?: ArchiveChangeOptions) => void;
};
const defaultColor: ColorTarget = {
  hex: "#CF3030",
  precision: DEFAULT_COLOR_PRECISION,
};

export function ArchiveColorPalette({ filters, onChange }: Props) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const id = useId();
  const index = Math.min(activeIndex, Math.max(0, filters.colors.length - 1));
  const color = filters.colors[index] ?? defaultColor;

  useEffect(() => {
    if (!open) {
      return;
    }
    const panel = panelRef.current;
    const previousFocus = document.activeElement;
    const mobile = window.matchMedia("(max-width: 767px)").matches;
    const previousOverflow = document.body.style.overflow;
    if (mobile) {
      document.body.style.overflow = "hidden";
    }
    panel?.querySelector<HTMLElement>("button, [tabindex='0'], input")?.focus();
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        event.preventDefault();
        setOpen(false);
        return;
      }
      if (event.key !== "Tab" || !panel) {
        return;
      }
      const elements = [
        ...panel.querySelectorAll<HTMLElement>(
          "button:not(:disabled), input, [tabindex='0']",
        ),
      ];
      const first = elements[0],
        last = elements[elements.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (mobile) {
        document.body.style.overflow = previousOverflow;
      }
      if (previousFocus instanceof HTMLElement) {
        previousFocus.focus();
      }
    };
  }, [open]);

  function updateColor(next: ColorTarget, final: boolean) {
    const colors = [...filters.colors];
    colors[index] = next;
    onChange({ colors }, { immediate: final, replace: true });
  }

  return (
    <div className="relative shrink-0">
      <Button
        aria-controls={id}
        aria-expanded={open}
        aria-haspopup="dialog"
        onClick={() => setOpen(!open)}
        ref={triggerRef}
        size="sm"
        variant={filters.colors.length ? "pillActive" : "pill"}
      >
        自定义颜色{filters.colors.length ? ` · ${filters.colors.length}` : ""}
      </Button>
      {open ? (
        <>
          <div
            aria-hidden="true"
            className="fixed inset-0 z-[95] bg-black/60 md:bg-transparent"
            onClick={() => setOpen(false)}
          />
          <div
            aria-labelledby={`${id}-title`}
            aria-modal="true"
            className="fixed inset-x-0 bottom-0 z-[100] max-h-[90dvh] overflow-y-auto rounded-t-xl border border-borderStrong bg-panel p-5 pb-[max(20px,env(safe-area-inset-bottom))] shadow-overlay md:absolute md:inset-x-auto md:bottom-auto md:right-0 md:top-full md:mt-3 md:max-h-[calc(100dvh-220px)] md:w-[360px] md:rounded-xl md:p-5"
            id={id}
            ref={panelRef}
            role="dialog"
          >
            <div className="mb-4 flex items-center justify-between gap-4">
              <h2 className="font-semibold text-foreground" id={`${id}-title`}>
                自定义颜色
              </h2>
              <IconButton
                aria-label="关闭自定义颜色"
                onClick={() => setOpen(false)}
                size="sm"
                variant="ghost"
              >
                <CloseIcon aria-hidden="true" className="h-4 w-4" />
              </IconButton>
            </div>
            <div className="mb-4 flex flex-wrap items-center gap-2">
              {filters.colors.map((target, targetIndex) => (
                <div className="flex items-center gap-1" key={targetIndex}>
                  <FilterButton
                    active={index === targetIndex}
                    aria-label={`编辑颜色 ${targetIndex + 1} ${target.hex}`}
                    className="gap-2 px-2.5"
                    onClick={() => setActiveIndex(targetIndex)}
                  >
                    <span
                      aria-hidden="true"
                      className="h-3.5 w-3.5 rounded-full ring-1 ring-white/20"
                      style={{ backgroundColor: target.hex }}
                    />
                    <span>{targetIndex + 1}</span>
                  </FilterButton>
                  <IconButton
                    aria-label={`移除颜色 ${targetIndex + 1}`}
                    onClick={() => {
                      onChange({
                        colors: filters.colors.filter(
                          (_, i) => i !== targetIndex,
                        ),
                      });
                      setActiveIndex(0);
                    }}
                    size="sm"
                    variant="ghost"
                  >
                    <CloseIcon aria-hidden="true" className="h-3 w-3" />
                  </IconButton>
                </div>
              ))}
              <Button
                disabled={filters.colors.length >= MAX_TARGET_COLORS}
                onClick={() => {
                  setActiveIndex(filters.colors.length);
                  onChange({ colors: [...filters.colors, defaultColor] });
                }}
                size="sm"
                variant="ghost"
              >
                <svg
                  aria-hidden="true"
                  className="mr-1 h-3 w-3"
                  viewBox="0 0 16 16"
                  fill="none"
                >
                  <path
                    d="M8 3v10M3 8h10"
                    stroke="currentColor"
                    strokeWidth="1.5"
                  />
                </svg>
                添加颜色
              </Button>
            </div>
            <div
              aria-label="颜色匹配方式"
              className="mb-4 flex items-center gap-2"
            >
              <FilterButton
                active={filters.colorMode === "any"}
                onClick={() => onChange({ colorMode: "any" })}
              >
                任意颜色
              </FilterButton>
              <FilterButton
                active={filters.colorMode === "all"}
                onClick={() => onChange({ colorMode: "all" })}
              >
                全部颜色
              </FilterButton>
            </div>
            <ArchiveColorPicker
              color={color}
              key={index}
              onChange={updateColor}
            />
            <p className="mt-4 text-xs text-subtle">
              最多选择 3 色，与类型、标签和固定色调叠加。
            </p>
          </div>
        </>
      ) : null}
    </div>
  );
}
