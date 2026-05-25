import { PageShell } from "@/components/layout/page-shell";
import { PlaceholderPanel } from "@/components/layout/placeholder-panel";

type VideoDetailPageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export default async function VideoDetailPage({ params }: VideoDetailPageProps) {
  const { slug } = await params;

  return (
    <PageShell
      eyebrow="Video Detail"
      title="播放器与元信息骨架"
      description="视频详情页当前只保留播放器容器、标题层级、标签位和操作位，便于后续接入外链解析结果。"
    >
      <div className="space-y-6">
        <div className="surface-panel overflow-hidden p-3 sm:p-4">
          <div className="flex min-h-[420px] items-center justify-center rounded-xl border border-white/8 bg-gradient-to-br from-white/[0.08] to-transparent text-center">
            <div className="space-y-4">
              <p className="eyebrow">Deferred Player</p>
              <h2 className="text-3xl font-semibold tracking-tight text-foreground">/{slug}</h2>
              <p className="max-w-xl text-sm leading-7 text-muted">
                点击后加载真实播放器的交互会放在下一阶段接入。当前只保留媒体区比例、焦点层级和操作区位置。
              </p>
            </div>
          </div>
        </div>

        <PlaceholderPanel
          label="Metadata"
          title="标题、来源、时间、收藏操作预留"
          description="这里后续承接外链元数据、收藏操作、标签和延迟加载播放器说明。当前所有内容为占位。"
        >
          <div className="flex flex-wrap gap-3">
            {["Bilibili", "Public", "收藏占位", "分享占位"].map((item) => (
              <span
                key={item}
                className="rounded-full border border-white/10 bg-white/[0.03] px-4 py-2 text-sm text-muted"
              >
                {item}
              </span>
            ))}
          </div>
        </PlaceholderPanel>
      </div>
    </PageShell>
  );
}
