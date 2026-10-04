import { describe, expect, it } from "vitest";
import {
  filterArchiveItems,
  uniqueVideos,
} from "@/lib/user-archive/presentation";
import type { UserArchiveItem } from "@/lib/user-archive/types";

function item(
  id: string,
  videoId: string,
  title: string,
  tagIds: string[] = [],
): UserArchiveItem {
  return {
    id,
    videoId,
    title,
    collectionId: id,
    collectionName: id,
    note: "私有备注",
    coverUrl: null,
    viewCountLabel: "0",
    likeCountLabel: "0",
    sourceLabel: "原创",
    storageProvider: "cos",
    tags: tagIds.map((tagId) => ({
      id: tagId,
      name: tagId,
      itemCount: 0,
      sortOrder: 0,
      active: false,
    })),
    href: "/video/" + videoId,
    isAvailable: true,
    sortOrder: 0,
    createdAt: "2026-10-04",
  };
}

describe("收藏展示与筛选", () => {
  it("deduplicates videos in order without destroying their source memberships", () => {
    const rows = [
      item("a", "v1", "构图"),
      item("b", "v1", "构图"),
      item("c", "v2", "剪辑"),
    ];
    expect(uniqueVideos(rows).map((row) => row.id)).toEqual(["a", "c"]);
    expect(rows).toHaveLength(3);
    expect(rows[1].note).toBe("私有备注");
  });
  it("searches titles case-insensitively instead of private tags", () => {
    const rows = [
      item("a", "v1", "Motion 构图"),
      item("b", "v2", "剪辑", ["motion"]),
    ];
    expect(
      filterArchiveItems(rows, " motion ", []).map((row) => row.videoId),
    ).toEqual(["v1"]);
    expect(filterArchiveItems(rows, "构图", [])).toHaveLength(1);
  });
  it("filters each membership before deduplication and does not merge tags across folders", () => {
    const rows = [
      item("a", "v1", "标题", ["x"]),
      item("b", "v1", "标题", ["y"]),
      item("c", "v2", "标题", ["x", "y"]),
    ];
    expect(filterArchiveItems(rows, "", ["y"]).map((row) => row.id)).toEqual([
      "b",
      "c",
    ]);
    expect(
      filterArchiveItems(rows, "", ["x", "y"]).map((row) => row.videoId),
    ).toEqual(["v2"]);
  });
  it("also deduplicates unavailable videos by ID", () => {
    const row = {
      ...item("a", "v1", "视频已下架"),
      isAvailable: false,
      href: null,
    };
    expect(uniqueVideos([row, { ...row, id: "b" }])).toHaveLength(1);
  });
});
