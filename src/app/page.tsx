import { HomePageShell } from "@/components/home/home-page-shell";
import { getHomePageData } from "@/lib/home/get-home-page-data";
import type { HomePageData } from "@/lib/home/types";

const siteConfig = {
  name: "雪笠微光",
  navigation: [
    { href: "/", icon: "explore", label: "探索" },
    { href: "/archive", icon: "library", label: "收录作品" },
    { href: "/user", icon: "profile", label: "档案" },
  ],
} as const;

export const revalidate = 60;

const fallbackHomeData: HomePageData = {
  featuredItems: [],
  hero: null,
  metaItems: [
    { label: "已收录作品", value: "读取中" },
    { label: "涵盖分类", value: "读取中" },
    { label: "最近更新", value: "未记录" },
  ],
};

export default async function HomePage() {
  const homeResult = await getHomePageData().then(
    (data) => ({ data, unavailable: false }),
    (error: unknown) => {
      console.error("Failed to load home page data", error);
      return { data: fallbackHomeData, unavailable: true };
    },
  );

  return (
    <HomePageShell
      dataUnavailable={homeResult.unavailable}
      featuredItems={homeResult.data.featuredItems}
      hero={homeResult.data.hero}
      metaItems={homeResult.data.metaItems}
      navigation={siteConfig.navigation}
    />
  );
}
