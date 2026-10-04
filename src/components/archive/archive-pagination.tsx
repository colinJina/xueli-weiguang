import { Button } from "@/components/ui/button";
import { FilterButton } from "@/components/ui/filter-button";
import ChevronLeftIcon from "@/components/icons/archive/chevron-left.svg";
import ChevronRightIcon from "@/components/icons/archive/chevron-right.svg";
import { buildArchivePaginationItems } from "@/lib/videos/archive-pagination";

export function ArchivePagination({
  page,
  pageCount,
  onChange,
}: {
  page: number;
  pageCount: number;
  onChange: (page: number) => void;
}) {
  if (pageCount <= 1) {
    return null;
  }
  return (
    <nav
      aria-label="分页"
      className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5"
    >
      <Button
        disabled={page <= 1}
        onClick={() => onChange(page - 1)}
        size="md"
        variant="pill"
      >
        <ChevronLeftIcon aria-hidden="true" className="mr-2 h-4 w-4" />
        上一页
      </Button>
      <div className="flex flex-wrap items-center justify-center gap-2 max-sm:order-3 max-sm:w-full">
        {buildArchivePaginationItems({ currentPage: page, pageCount }).map(
          (item) =>
            item.type === "gap" ? (
              <span
                aria-hidden="true"
                className="px-2 text-subtle"
                key={item.key}
              >
                …
              </span>
            ) : (
              <FilterButton
                active={page === item.page}
                aria-current={page === item.page ? "page" : undefined}
                aria-label={`第 ${item.page} 页`}
                className="h-9 w-9 px-0"
                key={item.page}
                onClick={() => onChange(item.page)}
              >
                {item.page}
              </FilterButton>
            ),
        )}
      </div>
      <Button
        disabled={page >= pageCount}
        onClick={() => onChange(page + 1)}
        size="md"
        variant="pill"
      >
        下一页
        <ChevronRightIcon aria-hidden="true" className="ml-2 h-4 w-4" />
      </Button>
    </nav>
  );
}
