import { ArchiveQuery } from "@/lib/videos/archive-query";
import type { ArchiveFilters, ArchiveVideoFeed } from "@/lib/videos/types";

export type ArchiveLoadStatus = "ready" | "loading" | "error";
type Callbacks = {
  load: (filters: ArchiveFilters, signal: AbortSignal, cursor?: string) => Promise<ArchiveVideoFeed>;
  onResult: (feed: ArchiveVideoFeed) => void;
  onStatus: (status: ArchiveLoadStatus) => void;
  onMoreStatus: (status: ArchiveLoadStatus) => void;
};

export class ArchiveFeedQuery {
  private query: ArchiveQuery<ArchiveVideoFeed>;
  private revision = 0;
  private continuation?: AbortController;
  private status: ArchiveLoadStatus;

  constructor(private feed: ArchiveVideoFeed, initialError: boolean, private callbacks: Callbacks) {
    this.status = initialError ? "error" : "ready";
    this.query = new ArchiveQuery({
      load: callbacks.load,
      onPending: () => {
        this.cancelMore();
        this.setStatus("loading");
      },
      onError: () => this.setStatus("error"),
      onResult: (result) => {
        this.feed = result;
        this.setStatus("ready");
        callbacks.onResult(result);
      },
    });
  }

  schedule(filters: ArchiveFilters, immediate = true) {
    this.query.schedule(filters, immediate);
  }

  restore(feed: ArchiveVideoFeed) {
    this.query.dispose();
    this.cancelMore();
    this.feed = feed;
    this.setStatus("ready");
    this.callbacks.onResult(feed);
  }

  async loadMore() {
    const current = this.feed;
    if (this.status !== "ready" || this.continuation || !current.hasMore || !current.nextCursor) {
      return;
    }
    const revision = this.revision;
    const controller = new AbortController();
    this.continuation = controller;
    this.callbacks.onMoreStatus("loading");
    try {
      const result = await this.callbacks.load(current.filters, controller.signal, current.nextCursor);
      if (revision !== this.revision || controller.signal.aborted) {
        return;
      }
      if (result.hasMore && (!result.nextCursor || result.nextCursor === current.nextCursor)) {
        throw new Error("Archive cursor did not advance");
      }
      const ids = new Set(current.items.map((item) => item.id));
      const additions = result.items.filter((item) => {
        if (ids.has(item.id)) {
          return false;
        }
        ids.add(item.id);
        return true;
      });
      this.feed = { ...result, items: [...current.items, ...additions] };
      this.callbacks.onMoreStatus("ready");
      this.callbacks.onResult(this.feed);
    } catch {
      if (revision === this.revision && !controller.signal.aborted) {
        this.callbacks.onMoreStatus("error");
      }
    } finally {
      if (this.continuation === controller) {
        this.continuation = undefined;
      }
    }
  }

  dispose() {
    this.query.dispose();
    this.cancelMore();
  }

  private cancelMore() {
    this.revision += 1;
    this.continuation?.abort();
    this.continuation = undefined;
    this.callbacks.onMoreStatus("ready");
  }

  private setStatus(status: ArchiveLoadStatus) {
    this.status = status;
    this.callbacks.onStatus(status);
  }
}
