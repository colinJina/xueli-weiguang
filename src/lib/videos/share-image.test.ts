import { describe, expect, it, vi } from "vitest";

import { loadShareCover } from "@/lib/videos/share-image";

describe("share cover loading failures", () => {
  it.each([
    { status: 403, contentType: "image/jpeg" },
    { status: 404, contentType: "text/plain" },
    { status: 200, contentType: "text/html" },
  ])("rejects unavailable or non-image responses: $status $contentType", async ({ status, contentType }) => {
    const fetchMock = vi.fn().mockResolvedValue(new Response("unavailable", { status, headers: { "content-type": contentType } }));
    vi.stubGlobal("fetch", fetchMock);
    try {
      await expect(loadShareCover("/cover.jpg", new AbortController().signal)).rejects.toThrow("封面暂时无法加载");
      expect(fetchMock).toHaveBeenCalledOnce();
      expect(fetchMock.mock.calls[0][0]).toMatch(/^\/_next\/image\?/);
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it("propagates request cancellation instead of keeping a closed dialog's cover request alive", async () => {
    const controller = new AbortController();
    controller.abort();
    const fetchMock = vi.fn().mockRejectedValue(new DOMException("Aborted", "AbortError"));
    vi.stubGlobal("fetch", fetchMock);
    try {
      await expect(loadShareCover("/cover.jpg", controller.signal)).rejects.toMatchObject({ name: "AbortError" });
      expect(fetchMock.mock.calls[0][1].signal).toBe(controller.signal);
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
