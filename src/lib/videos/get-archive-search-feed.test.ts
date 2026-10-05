import { beforeEach, describe, expect, it, vi } from "vitest";
import { getArchiveSearchFeed } from "@/lib/videos/get-archive-search-feed";
import { parseArchiveFilters } from "@/lib/videos/archive-filters";
import { archiveSearchDigest, parseArchiveSearchCursor } from "@/lib/videos/archive-search-cursor";

const state = vi.hoisted(() => ({ args: null as unknown, signal: null as AbortSignal | null, data: null as unknown, error: null as { message: string } | null }));
vi.mock("@/lib/storage/cos/public-url", () => ({ resolveCosPublicUrl: (value: string | null) => value }));
vi.mock("@/lib/supabase/public", () => ({ createPublicClient: () => ({ rpc: (_name: string, args: unknown) => {
  state.args = args;
  const request = Object.assign(Promise.resolve({ data: state.data, error: state.error }), { abortSignal(signal: AbortSignal) { state.signal = signal; return request; } });
  return request;
} }) }));

const stamp = "2026-10-05T01:02:03.123456+00:00";
const rows = Array.from({ length: 24 }, (_, i) => ({
  id: `10000000-0000-4000-8000-${String(i + 1).padStart(12, "0")}`, rank: 8,
  platform: "bilibili", storage_provider: "bilibili", title: "PV", author_name: "作者", category_id: "category",
  view_count: 3, like_count: 1, published_at: stamp, created_at: stamp,
  cover_url: null, description: null,
  category: { id: "category", name: "动画" }, tags: [{ id: "tag", name: "排字" }],
  tones: [{ id: "tone", name: "蓝色", color_hex: "#112233", percentage: 50 }],
}));
beforeEach(() => {
  state.data = { items: rows, has_more: true, next_cursor: { rank: 8, published_at: stamp, id: rows[23].id } };
  state.args = null; state.error = null; state.signal = null;
});
describe("archive search database boundary", () => {
  it("returns card relations in one request and carries the exact ranked cursor", async () => {
    const filters = parseArchiveFilters({ q: "PV", tones: "blue" });
    const controller = new AbortController();
    const feed = await getArchiveSearchFeed(filters, null, controller.signal);
    expect(state.signal).toBe(controller.signal);
    expect(feed.items[0]).toMatchObject({ title: "PV", category: { name: "动画" }, tags: [{ name: "排字" }], tones: [{ percentage: 50 }] });
    expect(state.args).toMatchObject({ p_query: "PV", p_limit: 24, p_after_rank: null, p_color_group_keys: ["blue"] });
    const cursor = parseArchiveSearchCursor(feed.nextCursor);
    expect(cursor).toEqual({ rank: 8, digest: archiveSearchDigest(filters), publishedAt: stamp, id: rows[23].id });
    await getArchiveSearchFeed(filters, cursor);
    expect(state.args).toMatchObject({ p_after_rank: 8, p_after_published_at: stamp, p_after_id: rows[23].id });
    expect(feed).not.toHaveProperty("totalCount");
  });
  it("parses sources and does not pass link text to full text matching", async () => {
    await getArchiveSearchFeed(parseArchiveFilters({ q: "BV1xx411c7mD" }), null);
    expect(state.args).toMatchObject({ p_query: "", p_source_url: "https://www.bilibili.com/video/BV1xx411c7mD" });
  });
  it("rejects mismatched cursors before requesting the database", async () => {
    await expect(getArchiveSearchFeed(parseArchiveFilters({ q: "PV" }), { digest: "wrong", rank: 8, publishedAt: stamp, id: rows[0].id })).rejects.toThrow("does not match");
    expect(state.args).toBeNull();
  });
  it("rejects malformed continuation payloads and reports RPC failure", async () => {
    state.data = { items: rows, has_more: true, next_cursor: { rank: 4, published_at: stamp, id: rows[23].id } };
    await expect(getArchiveSearchFeed(parseArchiveFilters({ q: "PV" }), null)).rejects.toThrow("Invalid archive search response");
    state.error = { message: "migration missing" };
    await expect(getArchiveSearchFeed(parseArchiveFilters({ q: "PV" }), null)).rejects.toThrow("migration missing");
  });
});
