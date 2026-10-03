// Preserve the original public presets. HEX membership is computed by the database.
export const TONE_PRESETS = [
  { key: "red", name: "红", colorHex: "#EF4444" },
  { key: "orange", name: "橙", colorHex: "#F97316" },
  { key: "yellow", name: "黄", colorHex: "#EAB308" },
  { key: "green", name: "绿", colorHex: "#22C55E" },
  { key: "cyan", name: "青", colorHex: "#06B6D4" },
  { key: "blue", name: "蓝", colorHex: "#3B82F6" },
  { key: "purple", name: "紫", colorHex: "#8B5CF6" },
  { key: "pink", name: "粉", colorHex: "#EC4899" },
  { key: "brown", name: "棕", colorHex: "#92400E" },
  { key: "neutral", name: "中性", colorHex: "#737373" },
] as const;

export function normalizeToneColorHex(value: string | null | undefined) {
  const normalized = value?.trim().toUpperCase();
  return normalized && /^#[0-9A-F]{6}$/.test(normalized) ? normalized : null;
}

export function parseToneKeyList(value: string | undefined) {
  const validKeys = new Set<string>(TONE_PRESETS.map((tone) => tone.key));
  return [...new Set((value ?? "").split(",").map((key) => key.trim()))].filter(
    (key) => validKeys.has(key),
  );
}
