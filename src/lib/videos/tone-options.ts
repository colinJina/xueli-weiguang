export const TONE_FILTER_OPTIONS = [
  { key: "red", label: "红", colorHex: "#EF4444" },
  { key: "orange", label: "橙", colorHex: "#F97316" },
  { key: "yellow", label: "黄", colorHex: "#EAB308" },
  { key: "green", label: "绿", colorHex: "#22C55E" },
  { key: "cyan", label: "青", colorHex: "#06B6D4" },
  { key: "blue", label: "蓝", colorHex: "#3B82F6" },
  { key: "purple", label: "紫", colorHex: "#8B5CF6" },
] as const;

export type ToneFilterOption = (typeof TONE_FILTER_OPTIONS)[number];
export type ToneFilterKey = ToneFilterOption["key"];

const toneOptionByKey = new Map<string, ToneFilterOption>(
  TONE_FILTER_OPTIONS.map((option) => [option.key, option]),
);

const TONE_HEX_PATTERN = /^#[0-9A-F]{6}$/;

export function getToneFilterOption(key: string) {
  return toneOptionByKey.get(key) ?? null;
}

export function getToneFilterOptions(keys: readonly string[]) {
  return keys
    .map((key) => getToneFilterOption(key))
    .filter((option): option is ToneFilterOption => Boolean(option));
}

export function normalizeToneColorHex(value: string | null | undefined) {
  const normalizedValue = value?.trim().toUpperCase();

  if (!normalizedValue || !TONE_HEX_PATTERN.test(normalizedValue)) {
    return null;
  }

  return normalizedValue;
}
