import { cn } from "@/lib/utils";

const skeletonCardHeights = [
  "h-[430px]",
  "h-[500px]",
  "h-[450px]",
  "h-[520px]",
  "h-[470px]",
  "h-[420px]",
  "h-[510px]",
  "h-[455px]",
] as const;

export function ArchiveGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div aria-label="正在加载筛选结果" className="space-y-5" role="status">
      <span className="sr-only">正在加载筛选结果</span>
      <div className="grid grid-cols-1 items-start gap-[18px] md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 xl:gap-6">
        {Array.from({ length: count }).map((_, index) => (
          <ArchiveSkeletonCard
            className={skeletonCardHeights[index % skeletonCardHeights.length]}
            key={index}
          />
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

function ArchiveSkeletonCard({ className }: { className: string }) {
  return (
    <article
      aria-hidden="true"
      className={cn(
        "flex min-w-0 flex-col overflow-hidden rounded-[22px] border border-white/[0.06] bg-white/[0.025] p-3",
        className,
      )}
    >
      <ArchiveSkeletonBlock className="aspect-[4/3] w-full rounded-[18px] border-white/[0.04] bg-white/[0.04]" />
      <div className="flex flex-1 flex-col px-1 pb-1 pt-4">
        <ArchiveSkeletonBlock className="h-4 w-3/4 rounded-full border-white/[0.04]" />
        <ArchiveSkeletonBlock className="mt-3 h-4 w-11/12 rounded-full border-white/[0.04]" />
        <div className="mt-auto flex items-end justify-between gap-4 pt-8">
          <div className="space-y-2.5">
            <ArchiveSkeletonBlock className="h-3 w-24 rounded-full border-white/[0.04]" />
            <ArchiveSkeletonBlock className="h-3 w-16 rounded-full border-white/[0.04]" />
          </div>
          <div className="flex gap-2">
            <ArchiveSkeletonBlock className="h-5 w-12 rounded-full border-white/[0.04]" />
            <ArchiveSkeletonBlock className="h-5 w-9 rounded-full border-white/[0.04]" />
          </div>
        </div>
      </div>
    </article>
  );
}
