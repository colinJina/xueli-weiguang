import { describe, expect, it } from "vitest";
import { formatArchiveCursor, parseArchiveCursor } from "@/lib/videos/archive-cursor";

const id = "10000000-0000-4000-8000-000000000001";
describe("archive feed cursor", () => {
  it("preserves microseconds and the secondary sort key", () => {
    const cursor = { publishedAt: "2026-10-04T01:02:03.123456+00:00", id };
    expect(parseArchiveCursor(formatArchiveCursor(cursor))).toEqual(cursor);
  });
  it.each([null, "", "invalid", `2026-02-31T00:00:00Z~${id}`, `2026-13-01T00:00:00Z~${id}`, `2026-10-04T24:00:00Z~${id}`, "2026-10-04T00:00:00Z~invalid", `2026-10-04T00:00:00Z~${id}~extra`, "x".repeat(129)])("rejects malformed cursor %s", (value) => {
    expect(parseArchiveCursor(value)).toBeNull();
  });
});
