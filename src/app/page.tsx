import { HomeFeaturedGrid } from "@/components/home/home-featured-grid";
import {
  homeFeaturedCards,
  homeHeroContent,
  homeMetaStrip,
} from "@/components/home/home-content";
import { HomeHeader } from "@/components/home/home-header";
import { HomeHero } from "@/components/home/home-hero";
import { HomeMetaStrip } from "@/components/home/home-meta-strip";
import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <div className="bg-[linear-gradient(180deg,#050505_0,#020202_53rem,#f5f5f3_53rem,#efefeb_100%)] pb-12 sm:pb-16 lg:pb-20">
      <HomeHeader navigation={siteConfig.navigation} />

      <main>
        <HomeHero content={homeHeroContent} />
        <HomeMetaStrip items={homeMetaStrip} />

        <div className="mx-auto w-full max-w-[1520px] px-4 pt-12 sm:px-6 sm:pt-10 lg:px-6 xl:px-8">
          <HomeFeaturedGrid items={homeFeaturedCards} />
        </div>
      </main>
    </div>
  );
}
