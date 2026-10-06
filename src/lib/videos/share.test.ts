import { describe, expect, it } from "vitest";

import { getVideoShareSource, getVideoShareSummary, getVideoShareUrl } from "@/lib/videos/share";

describe("video sharing", () => {
  it("shares the video permalink without navigation queries or anchors", () => {
    expect(getVideoShareUrl("https://example.com/video/old?from=archive#player", "new-id"))
      .toBe("https://example.com/video/new-id");
    expect(getVideoShareUrl("http://localhost:3000/archive?q=test", "new-id"))
      .toBe("http://localhost:3000/video/new-id");
  });

  it.each(["bilibili", "youtube"] as const)("shares %s's stored original link", (storageProvider) => {
    expect(getVideoShareSource({ storageProvider, sourceUrl: "https://example.com/watch?v=test", playbackUrl: "https://cdn.example.com/other.mp4" }))
      .toEqual({ label: "原始链接", url: "https://example.com/watch?v=test" });
  });

  it("shares a local video's public playback address instead of an unrelated source", () => {
    expect(getVideoShareSource({ storageProvider: "cos", sourceUrl: "https://example.com/old", playbackUrl: "https://cdn.example.com/submissions/video.mp4" }))
      .toEqual({ label: "PV 文件链接", url: "https://cdn.example.com/submissions/video.mp4" });
    expect(getVideoShareSource({ storageProvider: "cos", sourceUrl: "https://example.com/old", playbackUrl: null })).toBeNull();
  });

  it.each([null, "", " ", "/relative", "javascript:alert(1)", "blob:https://example.com/id", "https://user:password@example.com/video"])(
    "omits unusable addresses: %s", (sourceUrl) => {
      expect(getVideoShareSource({ storageProvider: "youtube", sourceUrl, playbackUrl: null })).toBeNull();
    },
  );

  it("collapses whitespace while preserving Japanese, Chinese and emoji", () => {
    expect(getVideoShareSummary({ storageProvider: "bilibili", description: "  雪笠\n\t微光　 日本語  🎬  " }))
      .toEqual({ label: "PV 简介", text: "雪笠 微光 日本語 🎬" });
  });

  it("truncates after 80 Unicode characters without splitting emoji or adding a needless ellipsis", () => {
    expect(getVideoShareSummary({ storageProvider: "cos", description: "🎬".repeat(81) }).text).toBe(`${"🎬".repeat(80)}…`);
    expect(getVideoShareSummary({ storageProvider: "cos", description: "影".repeat(80) }).text).toBe("影".repeat(80));
  });

  it.each([
    { storageProvider: "bilibili", text: "Bilibili" },
    { storageProvider: "youtube", text: "YouTube" },
    { storageProvider: "cos", text: "站内 PV" },
  ] as const)("uses an accurate source for empty $storageProvider descriptions", ({ storageProvider, text }) => {
    expect(getVideoShareSummary({ storageProvider, description: "\n\t " })).toEqual({ label: "PV 来源", text });
  });
});
