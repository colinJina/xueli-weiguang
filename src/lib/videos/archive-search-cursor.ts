import { createHash } from "node:crypto";
import { parseArchiveCursor } from "@/lib/videos/archive-cursor";
import type { ArchiveCursor } from "@/lib/videos/archive-cursor";
import { parseArchiveSearch } from "@/lib/videos/archive-search";
import type { ArchiveFilters } from "@/lib/videos/types";

export type ArchiveSearchCursor = ArchiveCursor & { rank: number; digest: string };
export type ArchiveFeedCursor = ArchiveCursor | ArchiveSearchCursor;

export function archiveSearchDigest(filters: ArchiveFilters) {
  const search = parseArchiveSearch(filters.query);
  return createHash("sha256").update(JSON.stringify({
    query: search.sourceUrl ?? search.query.toLowerCase(),
    category: filters.categoryId,
    tags: [...filters.tagIds].sort(),
    tones: [...filters.toneKeys].sort(),
    colors: [...filters.colors].sort((a, b) => a.hex.localeCompare(b.hex) || a.precision - b.precision),
    colorMode: filters.colorMode,
  })).digest("hex");
}

export function parseArchiveSearchCursor(value: string | null): ArchiveSearchCursor | null {
  if (!value || value.length > 256) {
    return null;
  }
  const [version, digest, rank, publishedAt, id, extra] = value.split("~");
  if (version !== "s1" || !digest || !/^[0-9a-f]{64}$/.test(digest) || !rank || !/^\d{1,4}$/.test(rank) || Number(rank) > 1564 || extra !== undefined) {
    return null;
  }
  const cursor = parseArchiveCursor(`${publishedAt}~${id}`);
  return cursor ? { ...cursor, rank: Number(rank), digest } : null;
}

export function formatArchiveSearchCursor(cursor: ArchiveSearchCursor) {
  const value = `s1~${cursor.digest}~${cursor.rank}~${cursor.publishedAt}~${cursor.id}`;
  if (!parseArchiveSearchCursor(value)) {
    throw new Error("Invalid archive search cursor");
  }
  return value;
}

export function parseArchiveFeedCursor(value: string | null, filters: ArchiveFilters): ArchiveFeedCursor | null {
  if (!filters.query) {
    return parseArchiveCursor(value);
  }
  const cursor = parseArchiveSearchCursor(value);
  return cursor?.digest === archiveSearchDigest(filters) ? cursor : null;
}
