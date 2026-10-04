import { UUID_PATTERN } from "@/lib/videos/archive-filters";

export type ArchiveCursor = { publishedAt: string; id: string };

const TIMESTAMP = /^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])T([01]\d|2[0-3]):[0-5]\d:[0-5]\d(?:\.\d{1,6})?(?:Z|\+00:00)$/;

export function parseArchiveCursor(value: string | null): ArchiveCursor | null {
  if (!value || value.length > 128) {
    return null;
  }
  const [publishedAt, id, extra] = value.split("~");
  if (!publishedAt || !id || extra !== undefined || !TIMESTAMP.test(publishedAt) || !UUID_PATTERN.test(id)) {
    return null;
  }
  const date = new Date(`${publishedAt.slice(0, 10)}T00:00:00Z`);
  if (!Number.isFinite(date.getTime()) || date.toISOString().slice(0, 10) !== publishedAt.slice(0, 10)) {
    return null;
  }
  // Preserve Postgres microseconds; converting the cursor through Date would lose them.
  return { publishedAt, id };
}

export function formatArchiveCursor(cursor: ArchiveCursor) {
  const value = `${cursor.publishedAt}~${cursor.id}`;
  if (!parseArchiveCursor(value)) {
    throw new Error("Invalid archive cursor");
  }
  return value;
}
