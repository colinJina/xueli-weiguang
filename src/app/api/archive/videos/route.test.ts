import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/archive/videos/route";
import { parseArchiveFilters } from "@/lib/videos/archive-filters";
import type { ArchiveVideosResult } from "@/lib/videos/types";
import type { ArchiveVideoFeed } from "@/lib/videos/types";

const state = vi.hoisted(() => ({
  result: null as ArchiveVideosResult | null,
  fail: false,
  calls: 0,
  feed: null as ArchiveVideoFeed | null,
  feedCalls: [] as unknown[][],
}));
vi.mock("@/lib/videos/get-video-feed", () => ({
  getArchiveVideoFeed: async (...args: unknown[]) => {
    state.feedCalls.push(args);
    return state.feed;
  },
}));
vi.mock("@/lib/videos/get-videos", () => ({
  getArchiveVideos: async () => {
    state.calls += 1;
    if (state.fail) {
      throw new Error("secret database stack");
    }
    return state.result;
  },
}));
beforeEach(() => {
  state.result = null;
  state.fail = false;
  state.calls = 0;
  state.feedCalls = [];
  state.feed = null;
});

describe("public realtime archive GET", () => {
  it.each(["stream=2", "stream=1&cursor=invalid", "cursor=invalid", "stream=1&stream=1", "stream=1&cursor=&cursor=invalid"])("rejects invalid feed request %s", async (params) => {
    const response = await GET(new Request(`http://localhost/api/archive/videos?${params}`));
    expect(response.status).toBe(400);
    expect(state.feedCalls).toHaveLength(0);
    expect(state.calls).toBe(0);
  });
  it("returns a bounded feed without counts or dictionaries and forwards the exact cursor", async () => {
    const publishedAt = "2026-10-04T01:02:03.123456+00:00";
    const id = "10000000-0000-4000-8000-000000000001";
    state.feed = { items: [], filters: parseArchiveFilters({ tones: "red" }), hasMore: false, nextCursor: null };
    const params = new URLSearchParams({ stream: "1", tones: "red", cursor: `${publishedAt}~${id}` });
    const response = await GET(new Request(`http://localhost/api/archive/videos?${params}`));
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual(state.feed);
    expect(state.feedCalls[0][1]).toEqual({ publishedAt, id });
    expect(state.calls).toBe(0);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
  it("rejects invalid filters before the database", async () => {
    const response = await GET(
      new Request("http://localhost/api/archive/videos?colors=FF0000:101"),
    );
    expect(response.status).toBe(400);
    expect(state.calls).toBe(0);
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
  it("returns only the current page and normalized filters, without dictionaries", async () => {
    const filters = parseArchiveFilters({ colors: "CF3030:30", tones: "red" });
    state.result = {
      items: [],
      totalCount: 0,
      pageCount: 1,
      filters,
      dictionaries: { categories: [], tags: [] },
    };
    const response = await GET(
      new Request(
        "http://localhost/api/archive/videos?colors=CF3030:30&tones=red",
      ),
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toEqual({
      items: [],
      totalCount: 0,
      pageCount: 1,
      filters,
    });
    expect(response.headers.get("Cache-Control")).toBe("no-store");
  });
  it("returns a safe actionable failure when the new RPC is unavailable", async () => {
    const log = vi.spyOn(console, "error").mockImplementation(() => undefined);
    state.fail = true;
    const response = await GET(
      new Request("http://localhost/api/archive/videos?tones=red"),
    );
    const body = await response.json();
    expect(response.status).toBe(503);
    expect(body.code).toBe("ARCHIVE_UNAVAILABLE");
    expect(JSON.stringify(body)).not.toContain("secret");
    log.mockRestore();
  });
});
