import { describe, expect, it } from "vitest";
import { archiveSearchDigest, formatArchiveSearchCursor, parseArchiveFeedCursor, parseArchiveSearchCursor } from "@/lib/videos/archive-search-cursor";
import { parseArchiveFilters } from "@/lib/videos/archive-filters";

const filters = parseArchiveFilters({ q: "排字 PV", tones: "blue" });
const cursor = { digest: archiveSearchDigest(filters), rank: 16, publishedAt: "2026-10-05T01:02:03.123456+00:00", id: "10000000-0000-4000-8000-000000000001" };
describe("ranked archive cursor", () => {
  it("preserves rank and Postgres microseconds", () => {
    const value = formatArchiveSearchCursor(cursor);
    expect(parseArchiveSearchCursor(value)).toEqual(cursor);
    expect(parseArchiveFeedCursor(value, filters)).toEqual(cursor);
  });
  it("cannot be reused for another query, filter or feed mode", () => {
    const value = formatArchiveSearchCursor(cursor);
    expect(parseArchiveFeedCursor(value, { ...filters, query: "別的" })).toBeNull();
    expect(parseArchiveFeedCursor(value, { ...filters, toneKeys: [] })).toBeNull();
    expect(parseArchiveFeedCursor(value, { ...filters, query: "" })).toBeNull();
    expect(parseArchiveFeedCursor(`${cursor.publishedAt}~${cursor.id}`, filters)).toBeNull();
  });
  it("rejects malformed, unsupported or out of range cursors", () => {
    const value = formatArchiveSearchCursor(cursor);
    for (const invalid of [null, "", value.replace("s1~", "s2~"), value.replace("~16~", "~-1~"), value.replace("~16~", "~1565~"), value + "~extra"]) {
      expect(parseArchiveSearchCursor(invalid)).toBeNull();
    }
  });
  it("normalizes source URLs and case for condition identity", () => {
    expect(archiveSearchDigest({ ...filters, query: "排字 pv" })).toBe(cursor.digest);
    expect(archiveSearchDigest(parseArchiveFilters({ q: "BV1xx411c7mD" }))).toBe(archiveSearchDigest(parseArchiveFilters({ q: "https://www.bilibili.com/video/BV1xx411c7mD" })));
  });
});
