"use client";

import { useId, useState } from "react";
import { ArchiveColorPicker } from "@/components/archive/archive-color-picker";
import type { ArchiveChangeOptions } from "@/components/archive/use-archive-videos";
import PaletteBrushIcon from "@/components/icons/archive/palette-brush.svg";
import CloseIcon from "@/components/icons/shared/close-16.svg";
import { useMediaQuery } from "@/hooks/use-media-query";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import {
  Sheet,
  SheetTrigger,
  SheetContent,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { FilterButton } from "@/components/ui/filter-button";
import { IconButton } from "@/components/ui/icon-button";
import {
  DEFAULT_COLOR_PRECISION,
  MAX_TARGET_COLORS,
} from "@/lib/videos/archive-filters";
import type { FilterPatch } from "@/lib/videos/archive-href";
import type { ArchiveFilters, ColorTarget } from "@/lib/videos/types";
import { cn } from "@/lib/utils";

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
  const desktop = useMediaQuery("(min-width: 768px)");
  const id = useId();
  const index = Math.min(activeIndex, Math.max(0, filters.colors.length - 1));
  const color = filters.colors[index] ?? defaultColor;

  function updateColor(next: ColorTarget, final: boolean) {
    const colors = [...filters.colors];
    colors[index] = next;
    onChange({ colors }, { immediate: final, replace: true });
  }

  function clearAndClose() {
    onChange({ colors: [], colorMode: "any" }, { immediate: true });
    setActiveIndex(0);
    setOpen(false);
  }

  const trigger = (
    <IconButton
      aria-controls={id}
      aria-expanded={open}
      aria-haspopup="dialog"
      aria-label={
        filters.colors.length
          ? `色盘，已选 ${filters.colors.length} 色`
          : "色盘"
      }
      className={cn(
        (open || filters.colors.length > 0) &&
          "bg-white/[0.08] text-foreground",
      )}
      size="sm"
      title="色盘"
      variant="ghost"
    >
      <PaletteBrushIcon aria-hidden="true" className="h-5 w-5" />
    </IconButton>
  );
  const content = (
    <>
      {" "}
      <div className="mb-4 flex items-center justify-between gap-4">
        {desktop ? (
          <h2 className="font-semibold text-foreground" id={`${id}-title`}>
            <PaletteBrushIcon aria-hidden="true" className="h-6 w-6" />
            <span className="sr-only">色盘</span>
          </h2>
        ) : (
          <SheetTitle id={`${id}-title`}>
            <PaletteBrushIcon aria-hidden="true" className="h-6 w-6" />
            <span className="sr-only">色盘</span>
          </SheetTitle>
        )}
        <IconButton
          aria-label="清除颜色并关闭色盘"
          onClick={clearAndClose}
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
                  colors: filters.colors.filter((_, i) => i !== targetIndex),
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
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="1.5" />
          </svg>
          添加颜色
        </Button>
      </div>
      <div aria-label="颜色匹配方式" className="mb-4 flex items-center gap-2">
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
      <ArchiveColorPicker color={color} key={index} onChange={updateColor} />
      <p className="mt-4 text-xs text-subtle">
        最多选择 3 种颜色，可同时筛选分类、标签和色调
      </p>
    </>
  );

  return desktop ? (
    <Popover open={open} onOpenChange={setOpen} modal>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent
        align="end"
        aria-labelledby={`${id}-title`}
        className="max-h-[var(--radix-popover-content-available-height)] overflow-y-auto"
        id={id}
      >
        {content}
      </PopoverContent>
    </Popover>
  ) : (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>{trigger}</SheetTrigger>
      <SheetContent aria-labelledby={`${id}-title`} id={id} side="bottom">
        <SheetDescription className="sr-only">
          选择目标颜色和匹配精度，筛选公开 PV
        </SheetDescription>
        {content}
      </SheetContent>
    </Sheet>
  );
}
