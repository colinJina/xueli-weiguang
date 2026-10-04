import { PageShell } from "@/components/layout/page-shell";
import { SiteHeader } from "@/components/layout/site-header";
import { StatePanel } from "@/components/ui/state-panel";

type ProfilePageProps = { params: Promise<{ handle: string }> };
export default async function ProfilePage({ params }: ProfilePageProps) {
  const { handle } = await params;
  return <>
    <SiteHeader />
    <PageShell eyebrow="公开主页" title={`@${handle}`} description="该用户的公开主页暂未开放">
      <StatePanel kind="info" title="公开主页暂未开放" description="当前可以在我的收藏中管理自己的 PV" />
    </PageShell>
  </>;
}
