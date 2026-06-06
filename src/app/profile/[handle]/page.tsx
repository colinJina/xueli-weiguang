import { PageShell } from "@/components/layout/page-shell";
import { PlaceholderPanel } from "@/components/layout/placeholder-panel";

type ProfilePageProps = {
  params: Promise<{
    handle: string;
  }>;
};

export default async function ProfilePage({ params }: ProfilePageProps) {
  const { handle } = await params;

  return (
    <PageShell
      eyebrow="公开主页"
      title={`@${handle}`}
      description="公开个人主页当前只保留简介、收藏分区和作品流位置。后续再接用户数据与公开展示规则。"
    >
      <div className="grid gap-6 lg:grid-cols-[320px_minmax(0,1fr)]">
        <PlaceholderPanel
          label="个人概览"
          title="档案式个人概览"
          description="头像、简介、公开统计、外链与管理操作都将在这里承接。现阶段只锁定版式与黑白层级。"
        />

        <div className="space-y-6">
          <PlaceholderPanel
            label="精选内容"
            title="公开收藏与精选内容"
            description="后续可以承接收藏夹横列、精选视频卡片与品牌展示区。当前只保留结构。"
          />

          <div className="grid gap-5 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, index) => (
              <div key={index} className="surface-panel h-56 p-5">
                <div className="flex h-full flex-col justify-between">
                  <div className="space-y-2">
                    <p className="eyebrow">个人模块</p>
                    <h3 className="text-xl font-semibold text-foreground">
                      公开卡片 {index + 1}
                    </h3>
                    <p className="text-sm leading-7 text-muted">
                      公开展示区的内容与卡片节奏已保留。
                    </p>
                  </div>
                  <span className="font-sans text-xs uppercase tracking-[0.24em] text-subtle">
                    模块结构
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
