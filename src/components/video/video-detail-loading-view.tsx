import { Skeleton } from "@/components/ui/skeleton";
import { FixedBackButton } from "@/components/layout/fixed-back-button";
import { VideoDetailNav } from "@/components/video/video-detail-nav";

export function VideoDetailLoadingView() {
  return (
    <div className="min-h-screen bg-background">
      <VideoDetailNav />
      <FixedBackButton fallbackHref="/archive" />

      <main className="page-container py-6 sm:py-8 lg:py-10">
        <section
          aria-busy="true"
          aria-label="PV 详情正在加载"
          className="mx-auto flex w-full max-w-[1100px] flex-col gap-7 lg:gap-8"
          role="status"
        >
          <span className="sr-only">PV 详情正在加载</span>

          <div className="overflow-hidden rounded-xl border border-white/10 bg-panel shadow-hero">
            <Skeleton className="aspect-video w-full rounded-none" />
          </div>

          <div aria-hidden="true" className="flex flex-col gap-7">
            <div className="space-y-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
                <Skeleton className="h-10 w-[82%] rounded-full sm:h-12 lg:w-[72%]" />
                <Skeleton className="h-7 w-20 rounded-full lg:mt-1" />
              </div>

              <div className="flex flex-col gap-5 border-b border-white/[0.08] pb-6 lg:flex-row lg:items-end lg:justify-between lg:gap-8">
                <div className="flex min-w-0 flex-1 flex-wrap items-center gap-4">
                  <Skeleton className="h-5 w-36 rounded-full" />
                  <Skeleton className="h-5 w-40 rounded-full" />
                </div>
                <div className="flex shrink-0 gap-3">
                  <Skeleton className="h-10 w-20 rounded-md" />
                  <Skeleton className="h-10 w-20 rounded-md" />
                  <Skeleton className="h-10 w-10 rounded-md" />
                </div>
              </div>
            </div>

            <div className="w-full max-w-reading space-y-5">
              <div className="space-y-3">
                <Skeleton className="h-4 w-full rounded-full" />
                <Skeleton className="h-4 w-11/12 rounded-full" />
                <Skeleton className="h-4 w-3/5 rounded-full" />
              </div>
              <div className="flex flex-wrap gap-3">
                <Skeleton className="h-7 w-16 rounded-full" />
                <Skeleton className="h-7 w-20 rounded-full" />
                <Skeleton className="h-7 w-14 rounded-full" />
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
