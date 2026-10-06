import { beforeEach, describe, expect, it, vi } from "vitest";
import { getArchiveVideoFeed } from "@/lib/videos/get-video-feed";
import type { VideoBaseRow } from "@/lib/videos/types";

const state = vi.hoisted(() => ({
  args: null as unknown,
  name: "",
  signal: null as AbortSignal | null,
  data: null as { items: VideoBaseRow[]; has_more: boolean; next_cursor: { published_at: string; id: string } | null } | null,
  hydrated: [] as string[],
  error: null as { message: string } | null,
}));
vi.mock("@/lib/supabase/public", () => ({ createPublicClient: () => ({ rpc: (name: string, args: unknown) => {
  state.name = name;
  state.args = args;
  const query = Object.assign(Promise.resolve({ data: state.data, error: state.error }), { abortSignal(signal: AbortSignal) { state.signal = signal; return query; } });
  return query;
} }) }));
vi.mock("@/lib/videos/get-video-dictionaries", () => ({ getVideoDictionaries: async () => ({ categories: [], tags: [] }) }));
vi.mock("@/lib/videos/get-archive-search-feed", () => ({ getArchiveSearchFeed: vi.fn() }));
vi.mock("@/lib/videos/get-videos", () => ({ hydrateArchiveRows: async (_client: unknown, rows: VideoBaseRow[]) => { state.hydrated = rows.map((row) => row.id); return []; } }));

const stamp = "2026-10-04T01:02:03.123456+00:00";
const rows: VideoBaseRow[] = Array.from({ length: 24 }, (_, index) => ({ id: `10000000-0000-4000-8000-${String(index + 1).padStart(12, "0")}`, platform: "bilibili", title: "PV", category_id: "category", source_url: null, embed_url: null, cover_url: null, description: null, author_name: null, author_avatar: null, view_count: 0, like_count: 0, published_at: stamp, created_at: stamp }));
beforeEach(() => {
  state.args = null;
  state.signal = null;
  state.hydrated = [];
  state.error = null;
  state.data = { items: rows, has_more: true, next_cursor: { published_at: stamp, id: rows[23].id } };
});
describe("archive cursor database boundary", () => {
  it("uses the indexed cursor, fixed batch size and all filter dimensions without OFFSET/count", async () => {
    const cursor = { publishedAt: stamp, id: rows[0].id };
    const controller = new AbortController();
    const result = await getArchiveVideoFeed({ tones: "red", colors: "CF3030:100", colorMode: "all", page: "500" }, cursor, undefined, controller.signal);
    expect(state.name).toBe("get_archive_video_feed");
    expect(state.args).toEqual({ p_category_id: null, p_tag_ids: [], p_color_group_keys: ["red"], p_colors: [{ hex: "#CF3030", precision: 100 }], p_color_match_mode: "all", p_limit: 24, p_after_published_at: stamp, p_after_id: rows[0].id });
    expect(state.signal).toBe(controller.signal);
    expect(state.hydrated).toEqual(rows.map((row) => row.id));
    expect(result.filters.page).toBe(1);
    expect(result.nextCursor).toBe(`${stamp}~${rows[23].id}`);
    expect(result).not.toHaveProperty("totalCount");
  });
  it("ends cleanly with an empty result", async () => {
    state.data = { items: [], has_more: false, next_cursor: null };
    expect(await getArchiveVideoFeed({})).toMatchObject({ items: [], hasMore: false, nextCursor: null });
  });
  it("rejects oversized batches before loading their relations", async () => {
    state.data = { items: [...rows, rows[0]], has_more: false, next_cursor: null };
    await expect(getArchiveVideoFeed({})).rejects.toThrow("Invalid archive feed response");
    expect(state.hydrated).toEqual([]);
  });
  it("rejects a cursor unrelated to the last returned row", async () => {
    state.data = { items: rows, has_more: true, next_cursor: { published_at: stamp, id: rows[0].id } };
    await expect(getArchiveVideoFeed({})).rejects.toThrow("Invalid archive feed response");
  });
  it("reports a missing migration instead of silently reverting to deep offsets", async () => {
    state.error = { message: "RPC missing" };
    await expect(getArchiveVideoFeed({})).rejects.toThrow("RPC missing");
    expect(state.hydrated).toEqual([]);
  });
});
