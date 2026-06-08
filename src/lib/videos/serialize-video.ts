import { resolveCosPublicUrl } from "@/lib/storage/cos/public-url";
import { formatCompactNumber, toMetricNumber } from "@/lib/videos/metrics";
import { normalizeToneColorHex } from "@/lib/videos/tone-options";

export { formatCompactNumber } from "@/lib/videos/metrics";

export type VideoDictionaryItem = {
  id: string;
  name: string;
  colorHex?: string;
};

export type VideoDictionaryRow = {
  id: string;
  name: string;
  color_hex?: string | null;
};

export type VideoStorageProvider = "bilibili" | "cos";

export type VideoBaseRow = {
  id: string;
  platform: string;
  storage_provider?: string | null;
  source_url: string | null;
  embed_url: string | null;
  playback_ref?: string | null;
  title: string;
  cover_url: string | null;
  description: string | null;
  author_name: string | null;
  author_avatar: string | null;
  view_count: number | string;
  like_count: number | string;
  category_id: string;
  published_at: string | null;
  created_at: string;
};

export type ArchiveCardSize = "short" | "medium" | "tall";

export type ArchiveVideoItem = {
  id: string;
  platform: string;
  storageProvider: VideoStorageProvider;
  title: string;
  sourceLabel: string;
  category: VideoDictionaryItem;
  tags: VideoDictionaryItem[];
  tones: VideoDictionaryItem[];
  metricLabel: string;
  viewCountLabel: string;
  likeCountLabel: string;
  coverUrl: string | null;
  description: string;
  authorName: string;
  publishedAtLabel: string;
  cardSize: ArchiveCardSize;
};

export type VideoDetail = {
  id: string;
  platform: string;
  storageProvider: VideoStorageProvider;
  title: string;
  sourceLabel: string;
  visibilityLabel: string;
  authorName: string;
  authorAvatar: string | null;
  publishedAtLabel: string;
  viewCount: number;
  likeCount: number;
  viewCountLabel: string;
  likeCountLabel: string;
  description: string;
  category: VideoDictionaryItem;
  tags: VideoDictionaryItem[];
  tones: VideoDictionaryItem[];
  coverImageUrl: string | null;
  embedUrl: string;
  playbackRef: string | null;
  playbackUrl: string | null;
  sourceUrl: string | null;
};

type VideoRelations = {
  category: VideoDictionaryItem | null;
  tags: VideoDictionaryItem[];
  tones: VideoDictionaryItem[];
};

const sourceLabels: Record<string, string> = {
  bilibili: "Bilibili",
  cos: "原创",
  youtube: "YouTube",
};

const cardSizePattern: ArchiveCardSize[] = ["medium", "tall", "short", "medium", "tall", "short"];

export function formatPublishedDate(value: string | null) {
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
    year: "numeric",
  }).format(date);
}

function getSourceLabel(platform: string) {
  return sourceLabels[platform] ?? platform;
}

function normalizeStorageProvider(value: string | null | undefined): VideoStorageProvider {
  return value === "cos" ? "cos" : "bilibili";
}

function getFallbackCategory(category: VideoDictionaryItem | null): VideoDictionaryItem {
  return category ?? { id: "uncategorized", name: "未分类" };
}

export function serializeDictionaryItem(row: VideoDictionaryRow): VideoDictionaryItem {
  const colorHex = normalizeToneColorHex(row.color_hex);

  return {
    id: row.id,
    name: row.name,
    ...(colorHex ? { colorHex } : {}),
  };
}

function normalizeMediaUrl(value: string | null) {
  if (!value) {
    return null;
  }

  return value.startsWith("http://") ? `https://${value.slice("http://".length)}` : value;
}

function resolvePublicMediaUrl(
  storageProvider: VideoStorageProvider,
  value: string | null | undefined,
) {
  return storageProvider === "cos" ? resolveCosPublicUrl(value) : normalizeMediaUrl(value ?? null);
}

export function serializeArchiveVideo(
  row: VideoBaseRow,
  relations: VideoRelations,
  index: number,
): ArchiveVideoItem {
  const category = getFallbackCategory(relations.category);
  const storageProvider = normalizeStorageProvider(row.storage_provider ?? row.platform);
  const viewCountLabel = formatCompactNumber(row.view_count);
  const likeCountLabel = formatCompactNumber(row.like_count);

  return {
    id: row.id,
    platform: row.platform,
    storageProvider,
    title: row.title,
    sourceLabel: getSourceLabel(storageProvider),
    category,
    tags: relations.tags,
    tones: relations.tones,
    metricLabel: viewCountLabel,
    viewCountLabel,
    likeCountLabel,
    coverUrl: resolvePublicMediaUrl(storageProvider, row.cover_url),
    description: row.description ?? "",
    authorName: row.author_name ?? "未知作者",
    publishedAtLabel: formatPublishedDate(row.published_at ?? row.created_at),
    cardSize: cardSizePattern[index % cardSizePattern.length],
  };
}

export function serializeVideoDetail(row: VideoBaseRow, relations: VideoRelations): VideoDetail {
  const storageProvider = normalizeStorageProvider(row.storage_provider ?? row.platform);

  return {
    id: row.id,
    platform: row.platform,
    storageProvider,
    title: row.title,
    sourceLabel: getSourceLabel(storageProvider),
    visibilityLabel: "公开",
    authorName: row.author_name ?? "未知作者",
    authorAvatar: normalizeMediaUrl(row.author_avatar),
    publishedAtLabel: formatPublishedDate(row.published_at ?? row.created_at),
    viewCount: toMetricNumber(row.view_count),
    likeCount: toMetricNumber(row.like_count),
    viewCountLabel: formatCompactNumber(row.view_count),
    likeCountLabel: formatCompactNumber(row.like_count),
    description: row.description ?? "",
    category: getFallbackCategory(relations.category),
    tags: relations.tags,
    tones: relations.tones,
    coverImageUrl: resolvePublicMediaUrl(storageProvider, row.cover_url),
    embedUrl: row.embed_url ?? "",
    playbackRef: row.playback_ref ?? null,
    playbackUrl: storageProvider === "cos" ? resolveCosPublicUrl(row.playback_ref) : null,
    sourceUrl: normalizeMediaUrl(row.source_url),
  };
}
