import { afterEach, describe, expect, it, vi } from "vitest";
import { parseArchiveFilters } from "@/lib/videos/archive-filters";
import { ArchiveQuery } from "@/lib/videos/archive-query";
import type { ArchiveFilters, ArchiveVideosPage } from "@/lib/videos/types";

const filters = (hex: string) => parseArchiveFilters({ colors: `${hex}:30` });
const result = (f: ArchiveFilters): ArchiveVideosPage => ({
  items: [],
  filters: f,
  totalCount: 0,
  pageCount: 1,
});

afterEach(() => vi.useRealTimers());

describe("realtime archive requests", () => {
  it("queries during continuous dragging every 150ms and immediately on release", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const load = vi.fn(async (f: ArchiveFilters) => result(f));
    const query = new ArchiveQuery({
      load,
      onPending: vi.fn(),
      onResult: vi.fn(),
      onError: vi.fn(),
    });
    query.schedule(filters("AA0000"));
    for (let i = 1; i <= 6; i++) {
      await vi.advanceTimersByTimeAsync(50);
      query.schedule(filters(`AA00${String(i).padStart(2, "0")}`));
    }
    expect(load.mock.calls).toHaveLength(3);
    await vi.advanceTimersByTimeAsync(20);
    query.schedule(filters("CF3030"), true);
    expect(load.mock.calls).toHaveLength(4);
    expect(load.mock.calls[3][0].colors[0].hex).toBe("#CF3030");
    query.dispose();
    await vi.advanceTimersByTimeAsync(1000);
    expect(load.mock.calls).toHaveLength(4);
  });
  it("aborts immediately and ignores old responses even before a throttled request starts", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(0);
    const pending: {
      signal: AbortSignal;
      resolve: (page: ArchiveVideosPage) => void;
    }[] = [];
    const onResult = vi.fn();
    const query = new ArchiveQuery({
      load: (_filters, signal) =>
        new Promise((resolve) => pending.push({ signal, resolve })),
      onPending: vi.fn(),
      onResult,
      onError: vi.fn(),
    });
    query.schedule(filters("AA0000"));
    await vi.advanceTimersByTimeAsync(40);
    query.schedule(filters("BB0000"));
    expect(pending[0].signal.aborted).toBe(true);
    pending[0].resolve(result(filters("AA0000")));
    await Promise.resolve();
    expect(onResult).not.toHaveBeenCalled();
    await vi.advanceTimersByTimeAsync(110);
    query.schedule(filters("CC0000"), true);
    pending[2].resolve(result(filters("CC0000")));
    await Promise.resolve();
    pending[1].resolve(result(filters("BB0000")));
    await Promise.resolve();
    expect(onResult).toHaveBeenCalledTimes(1);
    expect(onResult.mock.calls[0][0].filters.colors[0].hex).toBe("#CC0000");
    query.dispose();
  });
  it("reports only current failures and can retry the same filters", async () => {
    const onError = vi.fn(),
      onResult = vi.fn();
    const load = vi
      .fn()
      .mockRejectedValueOnce(new Error("unavailable"))
      .mockResolvedValueOnce(result(filters("CF3030")));
    const query = new ArchiveQuery({
      load,
      onError,
      onResult,
      onPending: vi.fn(),
    });
    query.schedule(filters("CF3030"), true);
    await Promise.resolve();
    expect(onError).toHaveBeenCalledTimes(1);
    query.schedule(filters("CF3030"), true);
    await Promise.resolve();
    expect(onResult).toHaveBeenCalledTimes(1);
    query.dispose();
  });
});
