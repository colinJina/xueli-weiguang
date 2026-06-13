import type { ArchiveVideoItem, VideoDetail } from "@/lib/videos/types";

export type HomeHeroFeature = {
  authorName: string;
  coverUrl: string | null;
  description: string;
  focalX: number;
  focalY: number;
  href: string;
  overlayStrength: number;
  sourceLabel: string;
  title: string;
  video: VideoDetail;
  videoId: string;
};

export type HomeSiteStatItem = {
  label: string;
  value: string;
};

export type HomePageData = {
  featuredItems: ArchiveVideoItem[];
  hero: HomeHeroFeature | null;
  metaItems: HomeSiteStatItem[];
};
