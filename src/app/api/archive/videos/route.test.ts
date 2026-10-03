import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET } from "@/app/api/archive/videos/route";
import { parseArchiveFilters } from "@/lib/videos/archive-filters";
import type { ArchiveVideosResult } from "@/lib/videos/types";

const state = vi.hoisted(() => ({
  result: null as ArchiveVideosResult | null,
  fail: false,
  calls: 0,
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
});

describe("public realtime archive GET", () => {
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
