// @vitest-environment jsdom
import "../../../tests/dom-setup";
import { act, renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { useVideoFavoriteStatus } from "@/components/video/use-video-favorite-status";

function deferredResponse() {
  let resolve!: (response: Response) => void;
  const promise = new Promise<Response>((done) => { resolve = done; });
  return { promise, resolve };
}

function response(isFavorited: boolean) {
  return new Response(JSON.stringify({ memberships: isFavorited ? [{}] : [] }));
}

afterEach(() => vi.unstubAllGlobals());

describe("independent favorite status", () => {
  it("skips reads before auth is ready and for anonymous visitors", () => {
    const fetch = vi.fn();
    vi.stubGlobal("fetch", fetch);
    const hook = renderHook(({ userId, ready }: { userId: string | undefined; ready: boolean }) => useVideoFavoriteStatus("video-a", userId, ready), {
      initialProps: { userId: undefined, ready: false },
    });
    expect(hook.result.current.isLoading).toBe(true);
    hook.rerender({ userId: undefined, ready: true });
    expect(hook.result.current.isLoading).toBe(false);
    expect(hook.result.current.isFavorited).toBe(false);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("remains pending while a read is slow and ignores it after a dialog save", async () => {
    const pending = deferredResponse();
    vi.stubGlobal("fetch", vi.fn(() => pending.promise));
    const hook = renderHook(() => useVideoFavoriteStatus("video-a", "user-a", true));
    expect(hook.result.current.isLoading).toBe(true);
    expect(hook.result.current.isFavorited).toBeNull();
    act(() => hook.result.current.updateFavoriteStatus(true));
    await act(async () => pending.resolve(response(false)));
    expect(hook.result.current.isFavorited).toBe(true);
    expect(hook.result.current.isLoading).toBe(false);
  });

  it("aborts old requests and clears state on PV and account changes", async () => {
    const oldRead = deferredResponse();
    const newRead = deferredResponse();
    const fetch = vi.fn().mockReturnValueOnce(oldRead.promise).mockReturnValueOnce(newRead.promise);
    vi.stubGlobal("fetch", fetch);
    const initialProps: { videoId: string; userId: string | undefined } = { videoId: "video-a", userId: "user-a" };
    const hook = renderHook(({ videoId, userId }: { videoId: string; userId: string | undefined }) => useVideoFavoriteStatus(videoId, userId, true), {
      initialProps,
    });
    hook.rerender({ videoId: "video-b", userId: "user-b" });
    expect(fetch.mock.calls[0][1].signal.aborted).toBe(true);
    await act(async () => oldRead.resolve(response(true)));
    expect(hook.result.current.isFavorited).toBeNull();
    await act(async () => newRead.resolve(response(true)));
    expect(hook.result.current.isFavorited).toBe(true);
    hook.rerender({ videoId: "video-b", userId: undefined });
    expect(hook.result.current.isFavorited).toBe(false);
  });

  it("isolates read failures and lets a successful dialog read recover the status", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    const hook = renderHook(() => useVideoFavoriteStatus("video-a", "user-a", true));
    await waitFor(() => expect(hook.result.current.error).toBe("收藏状态暂时无法加载，点击收藏重试"));
    expect(hook.result.current.isLoading).toBe(false);
    expect(hook.result.current.isFavorited).toBeNull();
    act(() => hook.result.current.updateFavoriteStatus(false));
    expect(hook.result.current.error).toBeNull();
    expect(hook.result.current.isFavorited).toBe(false);
  });
});
