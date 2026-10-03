import type { VideoToneItem } from "@/lib/videos/types";

const MAX_VISIBLE_TONES = 5;
const MIN_SWATCH_DIAMETER = 7;
const MAX_SWATCH_DIAMETER = 14;
const SWATCH_DIAMETER_SCALE = 45;
const percentageFormatter = new Intl.NumberFormat("zh-CN", {
  style: "percent",
  maximumFractionDigits: 0,
});

export function normalizeTonePercentage(value: number | string | null | undefined) {
  if (value === null || value === undefined || (typeof value === "string" && !value.trim())) {
    return null;
  }

  const percentage = Number(value);
  return Number.isFinite(percentage) && percentage >= 0 && percentage <= 1 ? percentage : null;
}

export function getVisibleVideoTones(tones: readonly VideoToneItem[]) {
  return tones
    .filter((tone) => tone.colorHex)
    .map((tone) => ({ ...tone, percentage: normalizeTonePercentage(tone.percentage) }))
    .sort((first, second) => (second.percentage ?? -1) - (first.percentage ?? -1))
    .slice(0, MAX_VISIBLE_TONES);
}

export function getToneSwatchDiameter(percentage: number | null) {
  // Match PVDex's compact palette sizing, including its upper size limit.
  return Math.max(
    MIN_SWATCH_DIAMETER,
    Math.min(
      MAX_SWATCH_DIAMETER,
      Math.round(MIN_SWATCH_DIAMETER + (percentage ?? 0) * SWATCH_DIAMETER_SCALE),
    ),
  );
}

export function formatTonePercentage(percentage: number | null) {
  return percentage === null ? "占比未记录" : percentageFormatter.format(percentage);
}
