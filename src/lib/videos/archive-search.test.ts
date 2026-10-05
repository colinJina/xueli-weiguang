import { describe, expect, it } from "vitest";
import { parseArchiveSearch } from "@/lib/videos/archive-search";
import { parseArchiveFilters, validateArchiveSearchParams } from "@/lib/videos/archive-filters";
import { buildArchiveHref } from "@/lib/videos/archive-href";

describe("archive search input", () => {
  it("normalizes full width, whitespace and case without interpreting query syntax", () => {
    expect(parseArchiveSearch("  ＰＶ\n 排字\tOR -abc %_\\  ")).toEqual({
      query: "PV 排字 OR -abc %_\\", terms: ["pv", "排字", "or", "-abc", "%_\\"], sourceUrl: null, error: null,
    });
    expect(parseArchiveSearch("ＰＶ pv").terms).toEqual(["pv"]);
  });
  it("accepts an empty query and Unicode character boundaries", () => {
    expect(parseArchiveSearch(" \t ").query).toBe("");
    expect(parseArchiveSearch("雪".repeat(120)).error).toBeNull();
    expect(parseArchiveSearch("雪".repeat(121)).error).toContain("120");
    expect(parseArchiveSearch("😀".repeat(120)).error).toBeNull();
    expect(parseArchiveSearch("a b c d e f g h i").error).toContain("8");
  });
  it("locates canonical sources without external requests", () => {
    expect(parseArchiveSearch("BV1xx411c7mD").sourceUrl).toBe("https://www.bilibili.com/video/BV1xx411c7mD");
    expect(parseArchiveSearch("https://www.bilibili.com/video/BV1xx411c7mD/?share=1").sourceUrl).toBe("https://www.bilibili.com/video/BV1xx411c7mD");
    expect(parseArchiveSearch("https://youtu.be/dQw4w9WgXcQ?t=3").sourceUrl).toBe("https://www.youtube.com/watch?v=dQw4w9WgXcQ");
    expect(parseArchiveSearch("https://b23.tv/abc").error).toContain("完整");
    expect(parseArchiveSearch("b23.tv/abc").error).toContain("完整");
    expect(parseArchiveSearch("https://example.com/pv").error).toContain("YouTube");
    expect(parseArchiveSearch(`https://youtu.be/dQw4w9WgXcQ?x=${"a".repeat(2048)}`).error).toContain("2048");
  });
  it("round trips a query with all filters and clears only the query", () => {
    const filters = parseArchiveFilters({ q: "排字 極簡", tones: "blue", colors: "112233:60" });
    const raw = Object.fromEntries(new URL(buildArchiveHref(filters, {}), "http://localhost").searchParams);
    expect(parseArchiveFilters(raw)).toEqual(filters);
    expect(buildArchiveHref(filters, { query: "" })).toContain("tones=blue");
    expect(buildArchiveHref(filters, { query: "" })).not.toContain("q=");
  });
  it("rejects duplicate and invalid API queries", () => {
    expect(validateArchiveSearchParams(new URLSearchParams("q=pv&q=雪"))).toBe(false);
    expect(validateArchiveSearchParams(new URLSearchParams({ q: "雪".repeat(121) }))).toBe(false);
    expect(validateArchiveSearchParams(new URLSearchParams({ q: "PV %_" }))).toBe(true);
  });
});
