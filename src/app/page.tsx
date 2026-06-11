import {
  homeFeaturedCards,
  homeHeroContent,
  homeMetaStrip,
} from "@/components/home/home-content";
import { HomePageShell } from "@/components/home/home-page-shell";

const siteConfig = {
  name: "雪笠微光",
  navigation: [
    { href: "/", label: "探索" },
    { href: "/archive", label: "库" },
    { href: "/user", label: "档案" },
  ],
};

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
