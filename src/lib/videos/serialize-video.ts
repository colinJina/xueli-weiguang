import { normalizeStorageProvider } from "@/lib/storage/types";
import { resolveCosPublicUrl } from "@/lib/storage/cos/public-url";
import { formatCompactNumber, toMetricNumber } from "@/lib/videos/metrics";
import { normalizeToneColorHex } from "@/lib/videos/tone-options";
import type {
  ArchiveCardSize,
  ArchiveVideoItem,
  VideoBaseRow,
  VideoDetail,
  VideoDictionaryItem,
  VideoDictionaryRow,
  VideoStorageProvider,
} from "@/lib/videos/types";

export { formatCompactNumber } from "@/lib/videos/metrics";

type VideoRelations = {
  category: VideoDictionaryItem | null;
  tags: VideoDictionaryItem[];
  tones: VideoDictionaryItem[];
};

const sourceLabels: Record<VideoStorageProvider, string> = {
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

function getSourceLabel(platform: VideoStorageProvider) {
  return sourceLabels[platform] ?? platform;
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
