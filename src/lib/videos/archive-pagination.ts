export type ArchivePaginationItem =
  | {
      page: number;
      type: "page";
    }
  | {
      key: "end-gap" | "start-gap";
      type: "gap";
    };

type BuildArchivePaginationItemsInput = {
  currentPage: number;
  pageCount: number;
  siblingCount?: number;
};

const DEFAULT_SIBLING_COUNT = 2;

function getIntegerPage(value: number, fallback: number) {
  return Number.isFinite(value) ? Math.trunc(value) : fallback;
}

function getPageRange(start: number, end: number) {
  return Array.from({ length: Math.max(0, end - start + 1) }, (_, index) => start + index);
}

export function buildArchivePaginationItems({
  currentPage,
  pageCount,
  siblingCount = DEFAULT_SIBLING_COUNT,
}: BuildArchivePaginationItemsInput): ArchivePaginationItem[] {
  const normalizedPageCount = Math.max(0, getIntegerPage(pageCount, 0));

  if (normalizedPageCount === 0) {
    return [];
  }

  const normalizedSiblingCount = Math.max(0, getIntegerPage(siblingCount, DEFAULT_SIBLING_COUNT));
  const normalizedCurrentPage = Math.min(
    normalizedPageCount,
    Math.max(1, getIntegerPage(currentPage, 1)),
  );
  const visiblePageLimit = normalizedSiblingCount * 2 + 5;

  if (normalizedPageCount <= visiblePageLimit) {
    return getPageRange(1, normalizedPageCount).map((page) => ({
      page,
      type: "page",
    }));
  }

  const windowStart = Math.max(2, normalizedCurrentPage - normalizedSiblingCount);
  const windowEnd = Math.min(
    normalizedPageCount - 1,
    normalizedCurrentPage + normalizedSiblingCount,
  );
  const items: ArchivePaginationItem[] = [{ page: 1, type: "page" }];

  if (windowStart > 3) {
    items.push({ key: "start-gap", type: "gap" });
  } else {
    getPageRange(2, windowStart - 1).forEach((page) => {
      items.push({ page, type: "page" });
    });
  }

  getPageRange(windowStart, windowEnd).forEach((page) => {
    items.push({ page, type: "page" });
  });

  if (windowEnd < normalizedPageCount - 2) {
    items.push({ key: "end-gap", type: "gap" });
  } else {
    getPageRange(windowEnd + 1, normalizedPageCount - 1).forEach((page) => {
      items.push({ page, type: "page" });
    });
  }

  items.push({ page: normalizedPageCount, type: "page" });

  return items;
}
