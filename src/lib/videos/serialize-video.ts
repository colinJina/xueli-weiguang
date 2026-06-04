export type VideoDictionaryItem = {
  id: string;
  name: string;
};

export type VideoBaseRow = {
  id: string;
  platform: string;
  source_url: string;
  embed_url: string;
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
  title: string;
  sourceLabel: string;
  visibilityLabel: string;
  authorName: string;
  authorAvatar: string | null;
  publishedAtLabel: string;
  viewCountLabel: string;
  likeCountLabel: string;
  description: string;
  category: VideoDictionaryItem;
  tags: VideoDictionaryItem[];
  tones: VideoDictionaryItem[];
  coverImageUrl: string | null;
  embedUrl: string;
  sourceUrl: string;
};

type VideoRelations = {
  category: VideoDictionaryItem | null;
  tags: VideoDictionaryItem[];
  tones: VideoDictionaryItem[];
};

const sourceLabels: Record<string, string> = {
  bilibili: "Bilibili",
};

const cardSizePattern: ArchiveCardSize[] = ["medium", "tall", "short", "medium", "tall", "short"];

function toNumber(value: number | string) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

export function formatCompactNumber(value: number | string) {
  return new Intl.NumberFormat("zh-CN", {
    maximumFractionDigits: 1,
    notation: "compact",
  }).format(toNumber(value));
}

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

function getFallbackCategory(category: VideoDictionaryItem | null): VideoDictionaryItem {
  return category ?? { id: "uncategorized", name: "未分类" };
}

function normalizeMediaUrl(value: string | null) {
  if (!value) {
    return null;
  }

  return value.startsWith("http://") ? `https://${value.slice("http://".length)}` : value;
}

export function serializeArchiveVideo(
  row: VideoBaseRow,
  relations: VideoRelations,
  index: number,
): ArchiveVideoItem {
  const category = getFallbackCategory(relations.category);
  const viewCountLabel = formatCompactNumber(row.view_count);
  const likeCountLabel = formatCompactNumber(row.like_count);

  return {
    id: row.id,
    title: row.title,
    sourceLabel: getSourceLabel(row.platform),
    category,
    tags: relations.tags,
    tones: relations.tones,
    metricLabel: viewCountLabel,
    viewCountLabel,
    likeCountLabel,
    coverUrl: normalizeMediaUrl(row.cover_url),
    description: row.description ?? "",
    authorName: row.author_name ?? "未知作者",
    publishedAtLabel: formatPublishedDate(row.published_at ?? row.created_at),
    cardSize: cardSizePattern[index % cardSizePattern.length],
  };
}

export function serializeVideoDetail(row: VideoBaseRow, relations: VideoRelations): VideoDetail {
  return {
    id: row.id,
    title: row.title,
    sourceLabel: getSourceLabel(row.platform),
    visibilityLabel: "公开",
    authorName: row.author_name ?? "未知作者",
    authorAvatar: normalizeMediaUrl(row.author_avatar),
    publishedAtLabel: formatPublishedDate(row.published_at ?? row.created_at),
    viewCountLabel: formatCompactNumber(row.view_count),
    likeCountLabel: formatCompactNumber(row.like_count),
    description: row.description ?? "",
    category: getFallbackCategory(relations.category),
    tags: relations.tags,
    tones: relations.tones,
    coverImageUrl: normalizeMediaUrl(row.cover_url),
    embedUrl: row.embed_url,
    sourceUrl: row.source_url,
  };
}
