import { afterEach, describe, expect, it, vi } from "vitest";
import { ArchiveFeedQuery } from "@/lib/videos/archive-feed-query";
import { parseArchiveFilters } from "@/lib/videos/archive-filters";
import type { ArchiveFilters, ArchiveVideoFeed, ArchiveVideoItem } from "@/lib/videos/types";

const filters = parseArchiveFilters({});
const item = (id: string): ArchiveVideoItem => ({ id, title: id, platform: "bilibili", storageProvider: "bilibili", sourceLabel: "Bilibili", category: { id: "category", name: "影像" }, tags: [], tones: [], metricLabel: "0", viewCountLabel: "0", likeCountLabel: "0", coverUrl: null, description: "", authorName: "作者", publishedAtLabel: "", cardSize: "short" });
const feed = (ids: string[], nextCursor: string | null = "cursor-1", nextFilters = filters): ArchiveVideoFeed => ({ items: ids.map(item), filters: nextFilters, hasMore: nextCursor !== null, nextCursor });
function deferred() {
  let resolve!: (value: ArchiveVideoFeed) => void;
  const promise = new Promise<ArchiveVideoFeed>((done) => { resolve = done; });
  return { promise, resolve };
}
afterEach(() => vi.useRealTimers());

describe("infinite archive requests", () => {
  it("deduplicates overlapping batches and blocks duplicate in-flight loads", async () => {
    const pending = deferred();
    const load = vi.fn(() => pending.promise);
    const onResult = vi.fn();
    const query = new ArchiveFeedQuery(feed(["a", "b"]), false, { load, onResult, onStatus: vi.fn(), onMoreStatus: vi.fn() });
    const first = query.loadMore();
    await query.loadMore();
    expect(load).toHaveBeenCalledTimes(1);
    expect(load.mock.calls[0]).toHaveLength(3);
    pending.resolve(feed(["b", "c", "c"], null));
    await first;
    expect(onResult.mock.calls[0][0].items.map((video: ArchiveVideoItem) => video.id)).toEqual(["a", "b", "c"]);
    await query.loadMore();
    expect(load).toHaveBeenCalledTimes(1);
  });

  it("cancels a continuation immediately when a new filter is throttled", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const pending = deferred();
    const onResult = vi.fn();
    let continuationSignal: AbortSignal | undefined;
    const load = vi.fn((f: ArchiveFilters, signal: AbortSignal, cursor?: string) => {
      if (cursor) {
        continuationSignal = signal;
        return pending.promise;
      }
      return Promise.resolve(feed(["filtered"], "cursor-1", f));
    });
    const query = new ArchiveFeedQuery(feed(["a"]), false, { load, onResult, onStatus: vi.fn(), onMoreStatus: vi.fn() });
    query.schedule(filters);
    await Promise.resolve();
    const append = query.loadMore();
    query.schedule(parseArchiveFilters({ tones: "red" }), false);
    expect(continuationSignal?.aborted).toBe(true);
    pending.resolve(feed(["old"]));
    await append;
    expect(onResult).toHaveBeenCalledTimes(1);
    await vi.advanceTimersByTimeAsync(150);
    expect(onResult.mock.calls[1][0].filters.toneKeys).toEqual(["red"]);
    query.dispose();
  });

  it("keeps existing cards on failure and retries the same cursor", async () => {
    const load = vi.fn().mockRejectedValueOnce(new Error("network")).mockResolvedValueOnce(feed(["b"], null));
    const onResult = vi.fn(), onMoreStatus = vi.fn();
    const query = new ArchiveFeedQuery(feed(["a"]), false, { load, onResult, onMoreStatus, onStatus: vi.fn() });
    await query.loadMore();
    expect(onResult).not.toHaveBeenCalled();
    expect(onMoreStatus).toHaveBeenLastCalledWith("error");
    await query.loadMore();
    expect(load.mock.calls.map((call) => call[2])).toEqual(["cursor-1", "cursor-1"]);
    expect(onResult.mock.calls[0][0].items.map((video: ArchiveVideoItem) => video.id)).toEqual(["a", "b"]);
  });

  it("stops a non-advancing cursor instead of automatically loading forever", async () => {
    const onMoreStatus = vi.fn(), onResult = vi.fn();
    const query = new ArchiveFeedQuery(feed(["a"]), false, { load: async () => feed(["b"]), onResult, onMoreStatus, onStatus: vi.fn() });
    await query.loadMore();
    expect(onMoreStatus).toHaveBeenLastCalledWith("error");
    expect(onResult).not.toHaveBeenCalled();
  });

  it("ignores a continuation completed after disposal or history restoration", async () => {
    const pending = deferred();
    const onResult = vi.fn();
    const query = new ArchiveFeedQuery(feed(["a"]), false, { load: () => pending.promise, onResult, onStatus: vi.fn(), onMoreStatus: vi.fn() });
    const append = query.loadMore();
    query.restore(feed(["restored"], null));
    pending.resolve(feed(["obsolete"], null));
    await append;
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult.mock.calls[0][0].items[0].id).toBe("restored");
    query.dispose();
  });
});
