import Link from "next/link";

import { PageShell } from "@/components/layout/page-shell";
import { PlaceholderPanel } from "@/components/layout/placeholder-panel";
import { Button } from "@/components/ui/button";

const entryPoints = [
  {
    href: "/archive",
    label: "Archive",
    description: "聚合浏览骨架，后续承接筛选、排序与卡片流。",
  },
  {
    href: "/collections",
    label: "Collections",
    description: "收藏夹与标签入口骨架，预留个人整理空间。",
  },
  {
    href: "/profile/curator-x",
    label: "Profile",
    description: "公开个人主页骨架，后续承接收藏与展示。",
  },
];

export default function HomePage() {
  return (
    <PageShell
      eyebrow="Project Skeleton"
      title="严格黑白系统的前端骨架已建立。"
      description="当前阶段只交付 UI 结构与主题 token。数据库、登录、视频导入、举报、评论、隐藏下载页与普通用户上传均保持空白。"
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <div className="surface-panel flex min-h-[420px] flex-col justify-between overflow-hidden p-8 shadow-hero">
          <div className="space-y-5">
            <p className="eyebrow">Hero Placeholder</p>
            <h2 className="max-w-3xl font-display text-5xl font-bold tracking-tight text-foreground sm:text-6xl">
              雪笠微光将以黑白档案馆的方式承载视频收藏与展示。
            </h2>
            <p className="max-w-2xl text-base leading-8 text-muted">
              首屏当前只保留品牌语气、主次操作和版面节奏。后续会在不破坏黑白 UI 系统的前提下承接真实内容封面与推荐流。
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <Button size="lg">Explore Skeleton</Button>
            <Button size="lg" variant="secondary">
              Read Design Tokens
            </Button>
          </div>
        </div>

        <PlaceholderPanel
          label="Phase Scope"
          title="这一轮只做前端地基。"
          description="结构已经为 App Router、Tailwind、shadcn/ui-ready 目录、动态路由和全局主题留好位置。后面接数据库与业务能力时不用重搭框架。"
        >
          <div className="grid gap-3 text-sm text-muted">
            <div className="rounded-md border border-white/8 bg-white/[0.03] px-4 py-3">
              不做数据库与鉴权接入
            </div>
            <div className="rounded-md border border-white/8 bg-white/[0.03] px-4 py-3">
              不做视频导入与上传
            </div>
            <div className="rounded-md border border-white/8 bg-white/[0.03] px-4 py-3">
              不做举报、评论与隐藏下载页
            </div>
          </div>
        </PlaceholderPanel>
      </div>

      <div className="mt-10 grid gap-4 md:grid-cols-3">
        {entryPoints.map((item) => (
          <Link
            key={item.href}
            className="surface-panel flex min-h-48 flex-col justify-between p-6 transition duration-200 hover:border-white/16 hover:bg-panelHover"
            href={item.href}
          >
            <div className="space-y-3">
              <p className="eyebrow">Route Placeholder</p>
              <h3 className="text-2xl font-semibold tracking-tight text-foreground">{item.label}</h3>
              <p className="text-sm leading-7 text-muted">{item.description}</p>
            </div>
            <span className="font-mono text-xs uppercase tracking-[0.28em] text-subtle">
              {item.href}
            </span>
          </Link>
        ))}
      </div>
    </PageShell>
  );
}
