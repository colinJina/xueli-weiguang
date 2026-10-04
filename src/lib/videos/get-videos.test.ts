import { beforeEach, describe, expect, it, vi } from "vitest";
import { getArchiveVideos } from "@/lib/videos/get-videos";

const state = vi.hoisted(() => ({
  calls: [] as { kind: string; value: unknown }[],
  failRpc: false,
  video: {
    id: "v1",
    platform: "bilibili",
    category_id: "c1",
    title: "影像",
    source_url: null,
    embed_url: null,
    cover_url: null,
    description: null,
    author_name: null,
    author_avatar: null,
    view_count: 0,
    like_count: 0,
    published_at: null,
    created_at: "2026-10-01T00:00:00Z",
  },
}));
vi.mock("@/lib/videos/get-video-dictionaries", () => ({
  getVideoDictionaries: async () => ({
    categories: [{ id: "c1", name: "影像" }],
    tags: [{ id: "t1", name: "风景" }],
  }),
}));
vi.mock("@/lib/storage/cos/public-url", () => ({
  resolveCosPublicUrl: (value: string | null) => value,
}));
vi.mock("@/lib/supabase/public", () => ({
  createPublicClient: () => ({
    rpc: (name: string, args: { p_offset: number }) => {
      state.calls.push({ kind: "rpc", value: { name, args } });
      return Promise.resolve(
        state.failRpc
          ? { data: null, error: { message: "RPC missing" } }
          : {
              data: {
                total_count: 25,
                items: args.p_offset > 24 ? [] : [state.video],
              },
              error: null,
            },
      );
    },
    from: (table: string) => {
      state.calls.push({ kind: "table", value: table });
      const query = {
        select: (value: string) => {
          state.calls.push({ kind: "select", value });
          return query;
        },
        in: (column: string, ids: string[]) => {
          state.calls.push({ kind: "ids", value: { column, ids } });
          return query;
        },
        order: (column: string) => {
          state.calls.push({ kind: "order", value: column });
          return query;
        },
        limit: (value: number) => {
          state.calls.push({ kind: "limit", value });
          return query;
        },
        returns: async () => ({
          error: null,
          data:
            table === "video_tags"
              ? [{ video_id: "v1", tag_id: "t1" }]
              : Array.from({ length: 5 }, (_, i) => ({
                  video_id: "v1",
                  sort_order: i,
                  percentage: i === 0 ? 0.5 : null,
                  tones: {
                    id: `tone${i}`,
                    name: `色${i}`,
                    color_hex: "#CF3030",
                  },
                })),
        }),
      };
      return query;
    },
  }),
}));
beforeEach(() => {
  state.calls = [];
  state.failRpc = false;
});

describe("archive database read boundary", () => {
  it("calls only the new color RPC, combining presets, colors and mode", async () => {
    const result = await getArchiveVideos({
      colors: "CF3030:30",
      colorMode: "all",
      tones: "red",
    });
    expect(state.calls[0]).toEqual({
      kind: "rpc",
      value: {
        name: "get_archive_videos_by_color",
        args: {
          p_category_id: null,
          p_tag_ids: [],
          p_color_group_keys: ["red"],
          p_colors: [{ hex: "#CF3030", precision: 30 }],
          p_color_match_mode: "all",
          p_limit: 24,
          p_offset: 0,
        },
      },
    });
    expect(result.items[0].tones).toHaveLength(5);
    expect(result.items[0].tones[0].percentage).toBe(0.5);
    expect(result.items[0].tones[1].percentage).toBeNull();
    expect(
      state.calls
        .filter((call) => call.kind === "table")
        .map((call) => call.value),
    ).toEqual(["video_tags", "video_tones"]);
    expect(state.calls).toContainEqual({
      kind: "select",
      value: "video_id,percentage,sort_order,tones(id,name,color_hex)",
    });
    expect(state.calls).toContainEqual({ kind: "order", value: "sort_order" });
    expect(state.calls).toContainEqual({ kind: "limit", value: 5 });
    expect(state.calls).toContainEqual({
      kind: "ids",
      value: { column: "video_id", ids: ["v1"] },
    });
  });
  it("refetches a page that exceeds the current result count", async () => {
    const result = await getArchiveVideos({ page: "3" });
    expect(result.filters.page).toBe(2);
    expect(result.pageCount).toBe(2);
    expect(state.calls.filter((call) => call.kind === "rpc")).toHaveLength(2);
  });
  it("fails explicitly without falling back to the old RPC", async () => {
    state.failRpc = true;
    await expect(getArchiveVideos({ tones: "red" })).rejects.toThrow(
      "RPC missing",
    );
    expect(state.calls.filter((call) => call.kind === "rpc")).toHaveLength(1);
    expect(state.calls.filter((call) => call.kind === "table")).toHaveLength(0);
  });
});
