import { beforeEach, describe, expect, it, vi } from "vitest";
import { GET, PUT } from "@/app/api/user/favorites/[videoId]/route";
import { unauthenticatedError } from "@/lib/user-archive/errors";
import type * as RouteHelpers from "@/lib/user-archive/route-helpers";

const mocks = vi.hoisted(() => ({
  authenticated: true,
  rpc: vi.fn(),
  read: vi.fn(),
}));
vi.mock("@/lib/user-archive/route-helpers", async (importOriginal) => {
  const original = await importOriginal<typeof RouteHelpers>();
  return {
    ...original,
    createAuthenticatedUserArchiveContext: async () => {
      if (!mocks.authenticated) {
        throw unauthenticatedError();
      }
      return { supabase: { rpc: mocks.rpc }, user: { id: "owner" } };
    },
  };
});
vi.mock("@/lib/user-archive/data", () => ({
  getUserVideoFavoriteState: mocks.read,
}));
const videoId = "10000000-0000-4000-8000-000000000001";
const collectionId = "20000000-0000-4000-8000-000000000002";
const context = { params: Promise.resolve({ videoId }) };
function request(body: unknown) {
  return new Request("http://localhost/api/user/favorites/" + videoId, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
beforeEach(() => {
  mocks.authenticated = true;
  mocks.rpc
    .mockReset()
    .mockResolvedValue({ data: [collectionId], error: null });
  mocks.read
    .mockReset()
    .mockResolvedValue({ collections: [], tags: [], memberships: [] });
});
describe("private favorite API", () => {
  it("reads only authenticated state without caching", async () => {
    const response = await GET(new Request("http://localhost"), context);
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toContain("no-store");
    expect(mocks.read.mock.calls[0].slice(1)).toEqual(["owner", videoId]);
  });
  it("uses one atomic RPC and returns the confirmed selection", async () => {
    const response = await PUT(
      request({ collectionIds: [collectionId, collectionId] }),
      context,
    );
    expect(await response.json()).toEqual({
      videoId,
      collectionIds: [collectionId],
      isFavorited: true,
    });
    expect(mocks.rpc).toHaveBeenCalledExactlyOnceWith("set_video_collections", {
      p_video_id: videoId,
      p_collection_ids: [collectionId],
    });
  });
  it("supports clearing every folder", async () => {
    mocks.rpc.mockResolvedValue({ data: [], error: null });
    const response = await PUT(request({ collectionIds: [] }), context);
    expect(await response.json()).toEqual({
      videoId,
      collectionIds: [],
      isFavorited: false,
    });
  });
  it("rejects unauthenticated writes and invalid IDs before the RPC", async () => {
    mocks.authenticated = false;
    expect((await PUT(request({ collectionIds: [] }), context)).status).toBe(
      401,
    );
    mocks.authenticated = true;
    expect(
      (await PUT(request({ collectionIds: ["invalid"] }), context)).status,
    ).toBe(400);
    expect(
      (
        await PUT(request({ collectionIds: [] }), {
          params: Promise.resolve({ videoId: "invalid" }),
        })
      ).status,
    ).toBe(400);
    expect(mocks.rpc).not.toHaveBeenCalled();
  });
  it("maps quota and ownership errors without exposing SQL", async () => {
    mocks.rpc.mockResolvedValue({
      data: null,
      error: {
        code: "23514",
        message: "collection_item_per_collection_limit_exceeded",
      },
    });
    const response = await PUT(
      request({ collectionIds: [collectionId] }),
      context,
    );
    const body = await response.json();
    expect(body.code).toBe("LIMIT_EXCEEDED");
    expect(body.message).toContain("300");
    expect(body.message).not.toContain("collection_item_per");
    mocks.rpc.mockResolvedValue({
      data: null,
      error: { code: "P0002", message: "private SQL" },
    });
    expect(
      (await PUT(request({ collectionIds: [collectionId] }), context)).status,
    ).toBe(404);
  });
});
