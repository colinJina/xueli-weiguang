import { HomePageShell } from "@/components/home/home-page-shell";
import { getHomePageData } from "@/lib/home/get-home-page-data";
import type { HomePageData } from "@/lib/home/types";

const siteConfig = {
  name: "雪笠微光",
  navigation: [
    { href: "/", label: "探索" },
    { href: "/archive", label: "库" },
    { href: "/user", label: "档案" },
  ],
};

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
  const homeData = await getHomePageData().catch((error) => {
    console.error("Failed to load home page data", error);
    return fallbackHomeData;
  });
  return (
    <HomePageShell
      featuredItems={homeData.featuredItems}
      hero={homeData.hero}
      metaItems={homeData.metaItems}
      navigation={siteConfig.navigation}
    />
  );
}
