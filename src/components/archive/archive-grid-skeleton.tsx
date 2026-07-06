import { cn } from "@/lib/utils";

const tagWidths = ["w-14", "w-20", "w-16"] as const;

export function ArchiveGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div aria-label="正在加载筛选结果" className="space-y-5" role="status">
      <span className="sr-only">正在加载筛选结果</span>
      <div className="grid grid-cols-1 items-start gap-[18px] md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 xl:gap-6">
        {Array.from({ length: count }).map((_, index) => (
          <ArchiveSkeletonCard key={index} />
        ))}
      </div>
    </div>
  );
}

export function ArchiveSkeletonBlock({
  className,
}: {
  className?: string;
}) {
  return (
    <div
      className={cn(
        "motion-safe:animate-pulse rounded-[18px] border border-white/[0.06] bg-white/[0.03]",
        className,
      )}
    />
  );
}

function ArchiveSkeletonCard({ className }: { className?: string }) {
  return (
    <article
      aria-hidden="true"
      className={cn(
        "isolate flex h-full w-full min-w-0 flex-col overflow-hidden rounded-[22px] border border-white/[0.07] bg-[#121214]",
        className,
      )}
    >
      <div className="relative aspect-[16/9] overflow-hidden rounded-t-[22px] bg-[#080808]">
        <ArchiveSkeletonBlock className="h-full w-full rounded-none border-0 bg-white/[0.035]" />

        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-0 z-[1] h-px bg-[#080808]"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[6px] bg-[#141415]"
        />
      </div>

      <div className="flex flex-1 flex-col gap-[18px] bg-[#141415] p-[18px] pb-4 max-md:p-4">
        <div className="space-y-3">
          <ArchiveSkeletonBlock className="h-[1.1rem] w-11/12 rounded-full border-white/[0.04] bg-white/[0.05]" />
          <ArchiveSkeletonBlock className="h-[1.1rem] w-7/12 rounded-full border-white/[0.04] bg-white/[0.04]" />
        </div>

        <div className="mt-auto flex flex-col items-end gap-2.5">
          <div className="flex w-full flex-wrap gap-2">
            {tagWidths.map((width, index) => (
              <ArchiveSkeletonBlock
                className={cn(
                  "h-[26px] rounded-lg border-white/[0.04] bg-white/[0.035]",
                  width,
                )}
                key={`${width}-${index}`}
              />
            ))}
          </div>

          <div className="flex w-full items-center justify-end gap-2 pt-0.5">
            {Array.from({ length: 4 }).map((_, index) => (
              <ArchiveSkeletonBlock
                className="h-2.5 w-2.5 rounded-full border-0 bg-white/[0.08]"
                key={index}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-white/[0.05] pt-3">
          <ArchiveSkeletonBlock className="h-3 w-24 rounded-full border-white/[0.04] bg-white/[0.04]" />
          <div className="flex shrink-0 items-center gap-2">
            <ArchiveSkeletonBlock className="h-3 w-16 rounded-full border-white/[0.04] bg-white/[0.04]" />
          </div>
        </div>
      </div>
    </article>
  );
}
