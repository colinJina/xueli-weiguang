import { PageShell } from "@/components/layout/page-shell";
import { PlaceholderPanel } from "@/components/layout/placeholder-panel";

const filters = ["Featured", "Bilibili", "YouTube", "Longform", "Motion", "Environment"];

export default function ArchivePage() {
  return (
    <PageShell
      eyebrow="Archive"
      title="聚合页骨架"
      description="这里先固定筛选条、卡片区和黑白层级，后续再接真实排序、搜索、分类和瀑布流数据。"
    >
      <PlaceholderPanel
        label="Filter System"
        title="筛选条和卡片节奏已经预留。"
        description="当前只展示页面结构。所有筛选均为视觉占位，不绑定数据逻辑。"
      >
        <div className="flex flex-wrap gap-3">
          {filters.map((filter, index) => (
            <div
              key={filter}
              className={
                index === 0
                  ? "rounded-md bg-white px-4 py-2 text-sm font-semibold text-black"
                  : "rounded-md border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-muted"
              }
            >
              {filter}
            </div>
          ))}
        </div>
      </PlaceholderPanel>

      <div className="mt-8 grid gap-5 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="surface-panel overflow-hidden">
            <div className="h-60 bg-gradient-to-br from-white/[0.08] to-transparent" />
            <div className="space-y-4 p-5">
              <div className="space-y-2">
                <p className="eyebrow">Card Placeholder</p>
                <h3 className="text-xl font-semibold text-foreground">Archive Card {index + 1}</h3>
                <p className="text-sm leading-7 text-muted">
                  保留封面区与信息区的固定骨架，后续接入真实视频卡片组件。
                </p>
              </div>
              <div className="flex items-center justify-between font-mono text-xs uppercase tracking-[0.24em] text-subtle">
                <span>Source</span>
                <span>00:{index + 2}0</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageShell>
  );
}
