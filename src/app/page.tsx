import {
  homeFeaturedCards,
  homeHeroContent,
  homeMetaStrip,
} from "@/components/home/home-content";
import { HomePageShell } from "@/components/home/home-page-shell";
import { siteConfig } from "@/config/site";

export default function HomePage() {
  return (
    <HomePageShell
      navigation={siteConfig.navigation}
      heroContent={homeHeroContent}
      metaItems={homeMetaStrip}
      featuredItems={homeFeaturedCards}
    />
  );
}
