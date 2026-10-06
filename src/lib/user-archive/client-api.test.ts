import { afterEach, describe, expect, it, vi } from "vitest";
import { requestUserArchiveMutation } from "@/lib/user-archive/client-api";

afterEach(() => vi.unstubAllGlobals());
describe("收藏请求错误提示", () => {
  it("shows the actionable Chinese fallback for a network failure", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("Failed to fetch")),
    );
    await expect(
      requestUserArchiveMutation("/test", {}, "收藏保存失败，请稍后重试"),
    ).rejects.toThrow("收藏保存失败，请稍后重试");
  });
  it("preserves request cancellation", async () => {
    const controller = new AbortController();
    controller.abort();
    const aborted = new DOMException("Aborted", "AbortError");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(aborted));
    await expect(
      requestUserArchiveMutation(
        "/test",
        { signal: controller.signal },
        "失败",
      ),
    ).rejects.toBe(aborted);
  });
  it("rejects malformed success responses instead of creating invalid local state", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("invalid", { status: 200 })),
    );
    await expect(
      requestUserArchiveMutation("/test", {}, "请重试"),
    ).rejects.toThrow("请重试");
  });
});
