import { PageShell } from "@/components/layout/page-shell";
import { PlaceholderPanel } from "@/components/layout/placeholder-panel";

const folders = ["精选参考", "环境叙事", "镜头语言", "音画节奏"];
const tags = ["cinematic", "forest", "ritual", "monochrome", "study"];

export default function CollectionsPage() {
  return (
    <PageShell
      eyebrow="Collections"
      title="收藏夹与标签骨架"
      description="这一页先保留侧边组织、标签检索和内容区位置关系，不接用户体系和数据读写。"
    >
      <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
        <aside className="surface-panel p-6">
          <p className="eyebrow mb-4">Folders</p>
          <div className="space-y-3">
            {folders.map((folder, index) => (
              <div
                key={folder}
                className={
                  index === 0
                    ? "rounded-md border border-white/12 bg-white/[0.06] px-4 py-3 text-sm font-medium text-foreground"
                    : "rounded-md border border-transparent px-4 py-3 text-sm text-muted"
                }
              >
                {folder}
              </div>
            ))}
          </div>
        </aside>

        <div className="space-y-6">
          <PlaceholderPanel
            label="Tag Query"
            title="标签检索与收藏结果占位"
            description="后续会在这里承接标签筛选、卡片网格和批量操作，目前仅保留布局骨架。"
          >
            <div className="flex flex-wrap gap-3">
              {tags.map((tag, index) => (
                <div
                  key={tag}
                  className={
                    index === 0
                      ? "rounded-full bg-white px-4 py-2 text-sm font-semibold text-black"
                      : "rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-muted"
                  }
                >
                  #{tag}
                </div>
              ))}
            </div>
          </PlaceholderPanel>

          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="surface-panel h-56 p-5">
                <div className="flex h-full flex-col justify-between">
                  <div className="space-y-2">
                    <p className="eyebrow">Saved Item</p>
                    <h3 className="text-xl font-semibold text-foreground">Collection Card {index + 1}</h3>
                    <p className="text-sm leading-7 text-muted">内容位、标签位、统计位都已预留。</p>
                  </div>
                  <span className="font-mono text-xs uppercase tracking-[0.24em] text-subtle">
                    Placeholder
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageShell>
  );
}
