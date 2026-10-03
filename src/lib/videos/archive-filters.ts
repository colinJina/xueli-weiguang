import { parseToneKeyList, TONE_PRESETS } from "@/lib/videos/tone-options";
import type { ArchiveFilters, ColorTarget } from "@/lib/videos/types";

export const ARCHIVE_PAGE_SIZE = 24;
export const ARCHIVE_MAX_PAGE = 500;
export const ARCHIVE_MAX_TAG_FILTERS = 10;
export const MAX_TARGET_COLORS = 3;
export const DEFAULT_COLOR_PRECISION = 30;
export const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export type ArchiveSearchParams = Record<string, string | string[] | undefined>;

function single(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

function list(value: string | undefined) {
  return value ? [...new Set(value.split(",").map((item) => item.trim()))] : [];
}

function parseColor(value: string): ColorTarget | null {
  const match = /^([0-9a-f]{6})(?::(\d{1,3}))?$/i.exec(value.trim());
  if (!match) {
    return null;
  }
  const precision = match[2] ? Number(match[2]) : DEFAULT_COLOR_PRECISION;
  if (precision < 1 || precision > 100) {
    return null;
  }
  return { hex: `#${match[1].toUpperCase()}`, precision };
}

export function parseArchiveFilters(
  params: ArchiveSearchParams,
): ArchiveFilters {
  const category = single(params.category);
  const page = single(params.page);
  const pageNumber = page && /^\d+$/.test(page) ? Number(page) : 1;
  return {
    categoryId: category && UUID_PATTERN.test(category) ? category : null,
    tagIds: list(single(params.tags))
      .filter((id) => UUID_PATTERN.test(id))
      .slice(0, ARCHIVE_MAX_TAG_FILTERS),
    toneKeys: parseToneKeyList(single(params.tones)),
    colors: (single(params.colors) ?? "")
      .split(",")
      .map(parseColor)
      .filter((color) => color !== null)
      .slice(0, MAX_TARGET_COLORS),
    colorMode: single(params.colorMode) === "all" ? "all" : "any",
    page: Math.min(ARCHIVE_MAX_PAGE, Math.max(1, pageNumber)),
  };
}

// API validation rejects malformed input before any database query. SSR normalizes
// old/shared URLs with the same parser, preserving tones=red compatibility.
export function validateArchiveSearchParams(params: URLSearchParams) {
  const keys = ["category", "tags", "tones", "colors", "colorMode", "page"];
  for (const key of keys) {
    if (
      params.getAll(key).length > 1 ||
      (params.get(key)?.length ?? 0) > 1024
    ) {
      return false;
    }
  }
  const category = params.get("category");
  const tags = list(params.get("tags") ?? undefined);
  const tones = list(params.get("tones") ?? undefined);
  const colors = (params.get("colors") ?? "").split(",").filter(Boolean);
  const mode = params.get("colorMode");
  const page = params.get("page");
  return (
    (!category || UUID_PATTERN.test(category)) &&
    tags.length <= ARCHIVE_MAX_TAG_FILTERS &&
    tags.every((id) => UUID_PATTERN.test(id)) &&
    tones.length <= TONE_PRESETS.length &&
    tones.every((key) => TONE_PRESETS.some((tone) => tone.key === key)) &&
    colors.length <= MAX_TARGET_COLORS &&
    colors.every((color) => parseColor(color) !== null) &&
    (!mode || mode === "any" || mode === "all") &&
    (!page ||
      (/^\d+$/.test(page) &&
        Number.isSafeInteger(Number(page)) &&
        Number(page) >= 1 &&
        Number(page) <= ARCHIVE_MAX_PAGE))
  );
}

export function resolveArchivePageRequest(
  requestedPage: number,
  totalCount: number,
) {
  const safeCount = Number.isFinite(totalCount)
    ? Math.max(0, Math.floor(totalCount))
    : 0;
  const pageCount = Math.min(
    ARCHIVE_MAX_PAGE,
    Math.max(1, Math.ceil(safeCount / ARCHIVE_PAGE_SIZE)),
  );
  const requested = Number.isSafeInteger(requestedPage)
    ? Math.min(ARCHIVE_MAX_PAGE, Math.max(1, requestedPage))
    : 1;
  const page = Math.min(requested, pageCount);
  return {
    offset: (page - 1) * ARCHIVE_PAGE_SIZE,
    page,
    pageCount,
    shouldRefetch: page !== requested,
  };
}
