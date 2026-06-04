function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-[18px] border border-white/[0.06] bg-white/[0.03] ${className}`}
    />
  );
}

export default function VideoDetailLoading() {
  return (
    <div className="min-h-screen bg-background">
      <div className="page-container py-6 sm:py-8 lg:py-10">
        <div className="mx-auto flex w-full max-w-[1100px] flex-col gap-7 lg:gap-8">
          <SkeletonBlock className="aspect-video w-full rounded-xl" />
          <div className="space-y-5">
            <SkeletonBlock className="h-12 w-4/5" />
            <SkeletonBlock className="h-6 w-2/3" />
            <SkeletonBlock className="h-28 w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
