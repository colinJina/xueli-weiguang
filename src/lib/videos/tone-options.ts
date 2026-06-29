import type { ToneFamilyItem, VideoDictionaryItem } from "@/lib/videos/types";

const TONE_HEX_PATTERN = /^#[0-9A-F]{6}$/;

export function normalizeToneColorHex(value: string | null | undefined) {
  const normalizedValue = value?.trim().toUpperCase();

  if (!normalizedValue || !TONE_HEX_PATTERN.test(normalizedValue)) {
    return null;
  }

  return normalizedValue;
}

export function parseToneFamilyKeyList(
  value: string | string[] | undefined,
  toneFamilies: readonly ToneFamilyItem[],
) {
  const rawValue = Array.isArray(value) ? value[0] : value;

  if (!rawValue) {
    return [];
  }

  const activeFamilyKeys = new Set(
    toneFamilies.filter((family) => family.isActive).map((family) => family.key),
  );

  return Array.from(
    new Set(
      rawValue
        .split(",")
        .map((item) => item.trim())
        .filter((item) => activeFamilyKeys.has(item)),
    ),
  );
}

export function getToneIdsForFamilyKeys(
  tones: readonly VideoDictionaryItem[],
  toneFamilies: readonly ToneFamilyItem[],
  toneKeys: readonly string[],
) {
  const selectedFamilyIds = new Set(
    toneFamilies
      .filter((family) => family.isActive && toneKeys.includes(family.key))
      .map((family) => family.id),
  );

  if (selectedFamilyIds.size === 0) {
    return [];
  }

  return tones
    .filter((tone) => tone.familyId && selectedFamilyIds.has(tone.familyId))
    .map((tone) => tone.id);
}
