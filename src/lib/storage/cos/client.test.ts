import COS from "cos-nodejs-sdk-v5";
import { afterEach, describe, expect, it, vi } from "vitest";

import { CosObjectNotFoundError, headCosObject } from "./client";
import type { CosServerConfig } from "./config";

const config: CosServerConfig = {
  bucket: "test-1234567890",
  region: "ap-shanghai",
  secretId: "test-secret-id",
  secretKey: "test-secret-key",
  cdnDomain: null,
  maxBytes: 50 * 1024 * 1024,
  maxCoverBytes: 5 * 1024 * 1024,
};
const key = "submissions/user/session/video.mov";

function successfulHead() {
  return new Response(null, {
    headers: {
      "Content-Length": "1234",
      "Content-Type": "video/quicktime; charset=binary",
      ETag: '"video-etag"',
    },
  });
}

afterEach(() => { vi.restoreAllMocks(); vi.unstubAllEnvs(); });

describe("COS object verification", () => {
  it("logs the function region and connection code without credentials", async () => {
    vi.stubEnv("VERCEL_REGION", "sin1");
    const error = new TypeError("fetch failed", { cause: { code: "UND_ERR_CONNECT_TIMEOUT" } });
    vi.spyOn(globalThis, "fetch").mockRejectedValue(error);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    await expect(headCosObject(config, key)).rejects.toBe(error);
    expect(warn).toHaveBeenCalledWith("COS object HEAD failed", {
      host: "test-1234567890.cos.ap-shanghai.myqcloud.com",
      executionRegion: "sin1", elapsedMs: expect.any(Number), code: "UND_ERR_CONNECT_TIMEOUT",
    });
    expect(JSON.stringify(warn.mock.calls)).not.toContain(config.secretId);
    expect(JSON.stringify(warn.mock.calls)).not.toContain(config.secretKey);
  });

  it("checks the original object using a short-lived signed HEAD without cache or redirects", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(successfulHead());
    const authorization = vi.spyOn(COS, "getAuthorization");

    await expect(headCosObject(config, key)).resolves.toEqual({
      key, size: 1234, mimeType: "video/quicktime", etag: '"video-etag"',
    });
    expect(fetchMock).toHaveBeenCalledOnce();
    expect(fetchMock).toHaveBeenCalledWith(
      `https://test-1234567890.cos.ap-shanghai.myqcloud.com/${key}`,
      expect.objectContaining({
        method: "HEAD", cache: "no-store", redirect: "error",
        signal: expect.any(AbortSignal),
        headers: { Authorization: expect.stringContaining("q-header-list=host") },
      }),
    );
    expect(authorization).toHaveBeenCalledWith(expect.objectContaining({
      Method: "HEAD", Key: key, Expires: 60,
      Headers: { host: "test-1234567890.cos.ap-shanghai.myqcloud.com" },
    }));
  });

  it.each(["timeout", "server error"])("tries the alternate origin with a new Host signature after a %s", async (failure) => {
    const fetchMock = vi.spyOn(globalThis, "fetch");
    if (failure === "timeout") {
      fetchMock.mockRejectedValueOnce(new DOMException("Timed out", "TimeoutError"));
    } else {
      fetchMock.mockResolvedValueOnce(new Response(null, { status: 503 }));
    }
    fetchMock.mockResolvedValueOnce(successfulHead());
    const authorization = vi.spyOn(COS, "getAuthorization");

    await expect(headCosObject(config, key)).resolves.toMatchObject({ size: 1234 });
    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(fetchMock.mock.calls[1][0]).toBe(
      `https://test-1234567890.cos.ap-shanghai.tencentcos.cn/${key}`,
    );
    expect(authorization).toHaveBeenLastCalledWith(expect.objectContaining({
      Headers: { host: "test-1234567890.cos.ap-shanghai.tencentcos.cn" },
    }));
    expect(fetchMock.mock.calls[0][1]?.headers).not.toEqual(fetchMock.mock.calls[1][1]?.headers);
  });

  it.each([403, 404, 301])("preserves an HTTP %i failure without falling back or accepting an unverified object", async (status) => {
    const fetchMock = vi.spyOn(globalThis, "fetch")
      .mockResolvedValue(new Response(null, { status }));

    if (status === 404) {
      await expect(headCosObject(config, key)).rejects.toBeInstanceOf(CosObjectNotFoundError);
    } else {
      await expect(headCosObject(config, key)).rejects.toMatchObject({ status });
    }
    expect(fetchMock).toHaveBeenCalledOnce();
  });

  it("returns a failure after both origins time out", async () => {
    const error = new DOMException("Timed out", "TimeoutError");
    const fetchMock = vi.spyOn(globalThis, "fetch").mockRejectedValue(error);
    await expect(headCosObject(config, key)).rejects.toBe(error);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
