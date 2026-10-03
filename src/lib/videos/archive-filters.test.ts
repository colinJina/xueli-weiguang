import { describe, expect, it } from "vitest";
import {
  parseArchiveFilters,
  resolveArchivePageRequest,
  validateArchiveSearchParams,
} from "@/lib/videos/archive-filters";
import { buildArchiveHref } from "@/lib/videos/archive-href";
import { hexToHsv, hsvToHex } from "@/lib/videos/color-picker";
import { TONE_PRESETS } from "@/lib/videos/tone-options";

describe("shareable archive filters", () => {
  it("preserves the ten original presets and legacy tone URL", () => {
    expect(TONE_PRESETS.map((tone) => `${tone.key}:${tone.colorHex}`)).toEqual([
      "red:#EF4444",
      "orange:#F97316",
      "yellow:#EAB308",
      "green:#22C55E",
      "cyan:#06B6D4",
      "blue:#3B82F6",
      "purple:#8B5CF6",
      "pink:#EC4899",
      "brown:#92400E",
      "neutral:#737373",
    ]);
    expect(parseArchiveFilters({ tones: "red,red,unknown" }).toneKeys).toEqual([
      "red",
    ]);
  });
  it("round trips all dimensions and resets page for a filter change", () => {
    const filters = parseArchiveFilters({
      category: "10000000-0000-4000-8000-000000000001",
      tags: "20000000-0000-4000-8000-000000000001",
      tones: "red",
      colors: "cf3030:30,4466AA:100,000000:1",
      colorMode: "all",
      page: "4",
    });
    const href = buildArchiveHref(filters, { page: filters.page });
    expect(
      parseArchiveFilters(
        Object.fromEntries(new URL(href, "http://localhost").searchParams),
      ),
    ).toEqual(filters);
    expect(
      parseArchiveFilters(
        Object.fromEntries(
          new URL(
            buildArchiveHref(filters, { toneKeys: [] }),
            "http://localhost",
          ).searchParams,
        ),
      ).page,
    ).toBe(1);
    expect(filters.colors[0]).toEqual({ hex: "#CF3030", precision: 30 });
  });
  it.each([
    "colors=FF0000:0",
    "colors=FF0000:101",
    "colors=xyz123:30",
    "colors=FF0000:30,00FF00:30,0000FF:30,FFFFFF:30",
    "page=501",
    "page=-1",
    "page=NaN",
    "tags=invalid",
    "category=invalid",
    "tones=unknown",
    "colorMode=both",
    "page=1&page=2",
  ])("rejects malformed API input %s", (query) => {
    expect(validateArchiveSearchParams(new URLSearchParams(query))).toBe(false);
  });
  it("accepts default precision and bounds pagination to the RPC offset guard", () => {
    expect(parseArchiveFilters({ colors: "CF3030" }).colors[0].precision).toBe(
      30,
    );
    expect(
      validateArchiveSearchParams(
        new URLSearchParams("colors=CF3030:30&colorMode=any&page=500"),
      ),
    ).toBe(true);
    expect(resolveArchivePageRequest(500, 100000)).toEqual({
      page: 500,
      pageCount: 500,
      offset: 11976,
      shouldRefetch: false,
    });
    expect(resolveArchivePageRequest(7, 25)).toEqual({
      page: 2,
      pageCount: 2,
      offset: 24,
      shouldRefetch: true,
    });
    expect(resolveArchivePageRequest(3, 0).page).toBe(1);
  });
  it("keeps three identical colors as independent editable targets", () => {
    const filters = parseArchiveFilters({
      colors: "CF3030:30,CF3030:30,CF3030:30",
    });
    expect(filters.colors).toHaveLength(3);
    expect(
      parseArchiveFilters(
        Object.fromEntries(
          new URL(buildArchiveHref(filters, {}), "http://localhost")
            .searchParams,
        ),
      ).colors,
    ).toHaveLength(3);
  });
});

describe("picker color conversions", () => {
  it.each([
    "#CF3030",
    "#4466AA",
    "#000000",
    "#FFFFFF",
    "#808080",
    "#00FF00",
    "#FF00FF",
    "#06B6D4",
  ])("round trips %s without rounding drift", (hex) => {
    expect(hsvToHex(hexToHsv(hex))).toBe(hex);
  });
});
