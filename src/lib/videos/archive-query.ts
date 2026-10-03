import type { ArchiveFilters, ArchiveVideosPage } from "@/lib/videos/types";

export const COLOR_QUERY_INTERVAL_MS = 150;
type QueryCallbacks = {
  load: (
    filters: ArchiveFilters,
    signal: AbortSignal,
  ) => Promise<ArchiveVideosPage>;
  onResult: (page: ArchiveVideosPage) => void;
  onError: () => void;
  onPending: () => void;
};

// A trailing throttle, with immediate first/final requests. Every input invalidates
// the previous response immediately, including the time before the next request.
export class ArchiveQuery {
  private revision = 0;
  private controller?: AbortController;
  private timer?: ReturnType<typeof setTimeout>;
  private lastStarted = -Infinity;
  private latest?: ArchiveFilters;

  constructor(private callbacks: QueryCallbacks) {}

  schedule(filters: ArchiveFilters, immediate = false) {
    this.revision += 1;
    this.latest = filters;
    this.controller?.abort();
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = undefined;
    }
    this.callbacks.onPending();
    const remaining = COLOR_QUERY_INTERVAL_MS - (Date.now() - this.lastStarted);
    if (immediate || remaining <= 0) {
      void this.start();
    } else {
      this.timer = setTimeout(() => {
        this.timer = undefined;
        void this.start();
      }, remaining);
    }
  }

  dispose() {
    this.revision += 1;
    this.controller?.abort();
    if (this.timer) {
      clearTimeout(this.timer);
    }
  }

  private async start() {
    const filters = this.latest;
    if (!filters) {
      return;
    }
    const revision = this.revision;
    const controller = new AbortController();
    this.controller = controller;
    this.lastStarted = Date.now();
    try {
      const result = await this.callbacks.load(filters, controller.signal);
      if (revision === this.revision && !controller.signal.aborted) {
        this.callbacks.onResult(result);
      }
    } catch {
      if (revision === this.revision && !controller.signal.aborted) {
        this.callbacks.onError();
      }
    }
  }
}
