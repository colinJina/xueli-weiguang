import { describe, expect, it } from "vitest";
import { normalizeCollectionIds } from "@/lib/user-archive/mutations";

const id = "10000000-0000-4000-8000-000000000001";
describe("收藏夹选择输入", () => {
  it("allows cancellation and deduplicates valid IDs", () => {
    expect(normalizeCollectionIds([])).toEqual([]);
    expect(normalizeCollectionIds([id, id])).toEqual([id]);
  });
  it.each([
    undefined,
    null,
    "all",
    [id, "invalid"],
    [null],
    Array(21).fill(id),
  ])("rejects invalid or oversized selection %j", (input) => {
    expect(() => normalizeCollectionIds(input)).toThrow("请选择有效的收藏夹");
  });
});
