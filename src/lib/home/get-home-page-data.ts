import { createPublicClient } from "@/lib/supabase/public";
import { getArchiveVideos } from "@/lib/videos/get-videos";
import { serializeVideoDetail } from "@/lib/videos/serialize-video";
import type { HomeHeroFeature, HomePageData, HomeSiteStatItem } from "@/lib/home/types";
import type { VideoBaseRow } from "@/lib/videos/types";

type HomeHeroFeatureRow = {
  focal_x: number | string | null;
  focal_y: number | string | null;
  overlay_strength: number | string | null;
  video_id: string;
};

type HomeSiteStatsRow = {
  latest_published_at: string | null;
  published_category_count: number | string | null;
  published_video_count: number | string | null;
};

const homeHeroVideoSelect =
  "id,platform,storage_provider,source_url,embed_url,playback_ref,title,cover_url,description,author_name,author_avatar,view_count,like_count,category_id,published_at,created_at";

function toNumber(value: number | string | null | undefined, fallback: number) {
  const nextValue = typeof value === "string" ? Number(value) : value;

  return typeof nextValue === "number" && Number.isFinite(nextValue) ? nextValue : fallback;
}

function formatCount(value: number | string | null | undefined) {
  return new Intl.NumberFormat("zh-CN").format(Math.max(0, Math.round(toNumber(value, 0))));
}

function formatMonthDay(value: string | null | undefined) {
  if (!value) {
    return "未记录";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "未记录";
  }

  return new Intl.DateTimeFormat("zh-CN", {
    day: "2-digit",
    month: "2-digit",
  }).format(date);
}

function createFallbackStats(totalCount: number): HomeSiteStatItem[] {
  return [
    { label: "已收录作品", value: formatCount(totalCount) },
    { label: "涵盖分类", value: "读取中" },
    { label: "最近更新", value: "未记录" },
  ];
}

async function getHomeSiteStats(): Promise<HomeSiteStatItem[] | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("get_home_site_stats").maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as HomeSiteStatsRow;

  return [
    { label: "已收录作品", value: formatCount(row.published_video_count) },
    { label: "涵盖分类", value: formatCount(row.published_category_count) },
    { label: "最近更新", value: formatMonthDay(row.latest_published_at) },
  ];
}

async function getHomeHeroFeature(): Promise<HomeHeroFeature | null> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("home_hero_features")
    .select("video_id,focal_x,focal_y,overlay_strength")
    .eq("is_active", true)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error || !data) {
    return null;
  }

  const row = data as HomeHeroFeatureRow;
  const videoResult = await supabase
    .from("videos")
    .select(homeHeroVideoSelect)
    .eq("id", row.video_id)
    .not("published_at", "is", null)
    .maybeSingle();

  if (videoResult.error || !videoResult.data) {
    return null;
  }

  const video = serializeVideoDetail(videoResult.data as VideoBaseRow, {
    category: null,
    tags: [],
    tones: [],
  });

  return {
    authorName: video.authorName,
    coverUrl: video.coverImageUrl,
    description: video.description,
    focalX: toNumber(row.focal_x, 0.5),
    focalY: toNumber(row.focal_y, 0.5),
    href: `/video/${video.id}`,
    overlayStrength: toNumber(row.overlay_strength, 0.62),
    sourceLabel: video.sourceLabel,
    title: video.title,
    video,
    videoId: video.id,
  };
}

export async function getHomePageData(): Promise<HomePageData> {
  const [archiveData, hero, siteStats] = await Promise.all([
    getArchiveVideos({}),
    getHomeHeroFeature(),
    getHomeSiteStats(),
  ]);

  return {
    featuredItems: archiveData.items,
    hero,
    metaItems: siteStats ?? createFallbackStats(archiveData.totalCount),
  };
}
