import { describe, expect, it } from "vitest";
import {
  parseUserArchiveFilters,
  urlSearchParamsToUserArchiveSearchParams,
} from "@/lib/user-archive/filters";

describe("收藏搜索参数兼容", () => {
  it("keeps title search separate from legacy tag search", () => {
    const filters = parseUserArchiveFilters({
      keyword: " 构图 ",
      q: "个人标签",
    });
    expect(filters.keyword).toBe("构图");
    expect(filters.tagQuery).toBe("个人标签");
  });
  it("preserves legacy aliases when converting URL parameters", () => {
    const id = "10000000-0000-4000-8000-000000000001";
    const filters = parseUserArchiveFilters(
      urlSearchParamsToUserArchiveSearchParams(
        new URLSearchParams({ tags: id, q: "构图", keyword: "PV" }),
      ),
    );
    expect(filters.tagIds).toEqual([id]);
    expect(filters.tagQuery).toBe("构图");
    expect(filters.keyword).toBe("PV");
  });
  it("bounds search length and accepts missing search terms", () => {
    expect(
      parseUserArchiveFilters({ keyword: "a".repeat(100) }).keyword,
    ).toHaveLength(80);
    expect(parseUserArchiveFilters({}).keyword).toBe("");
  });
});
