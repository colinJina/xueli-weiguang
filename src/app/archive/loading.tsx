function SkeletonBlock({ className }: { className: string }) {
  return (
    <div
      className={`animate-pulse rounded-[18px] border border-white/[0.06] bg-white/[0.03] ${className}`}
    />
  );
}

export default function ArchiveLoading() {
  return (
    <div className="min-h-screen bg-[#020202]">
      <header className="border-b border-white/[0.06] bg-[rgba(3,3,4,0.94)]">
        <div className="page-container flex min-h-[72px] items-center justify-between gap-5 py-2">
          <SkeletonBlock className="h-10 w-56 rounded-full" />
          <SkeletonBlock className="h-10 w-72 rounded-full max-md:hidden" />
        </div>
      </header>

      <main className="page-container py-5">
        <div className="space-y-4 border-b border-white/[0.06] pb-5">
          <SkeletonBlock className="h-9 w-full" />
          <SkeletonBlock className="h-9 w-4/5" />
          <SkeletonBlock className="h-9 w-3/5" />
        </div>

        <div className="grid gap-6 pt-6 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <SkeletonBlock
              className={index % 3 === 1 ? "h-[520px]" : "h-[420px]"}
              key={index}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
