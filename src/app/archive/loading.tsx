import { ArchiveGridSkeleton, ArchiveSkeletonBlock } from "@/components/archive/archive-grid-skeleton";

export default function ArchiveLoading() {
  return (
    <div className="min-h-screen bg-[#020202]">
      <header className="border-b border-white/[0.06] bg-[rgba(3,3,4,0.94)]">
        <div className="page-container flex min-h-[72px] items-center justify-between gap-5 py-2">
          <ArchiveSkeletonBlock className="h-10 w-56 rounded-full" />
          <ArchiveSkeletonBlock className="h-10 w-72 rounded-full max-md:hidden" />
        </div>
      </header>

      <main className="page-container py-5">
        <div className="space-y-4 border-b border-white/[0.06] pb-5">
          <ArchiveSkeletonBlock className="h-9 w-full" />
          <ArchiveSkeletonBlock className="h-9 w-4/5" />
          <ArchiveSkeletonBlock className="h-9 w-3/5" />
        </div>

        <div className="pt-6">
          <ArchiveGridSkeleton />
        </div>
      </main>
    </div>
  );
}
