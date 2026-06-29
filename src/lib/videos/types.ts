import type { StorageProvider } from "@/lib/storage/types";

export type VideoDictionaryItem = {
  id: string;
  name: string;
  colorHex?: string;
  familyId?: string;
};

export type VideoDictionaryRow = {
  id: string;
  name: string;
  color_hex?: string | null;
  family_id?: string | null;
};

export type ToneFamilyItem = {
  id: string;
  key: string;
  name: string;
  colorHex: string;
  sortOrder: number;
  isActive: boolean;
};

export type ToneFamilyRow = {
  id: string;
  key: string;
  name: string;
  color_hex: string;
  sort_order: number;
  is_active: boolean;
};

export type VideoStorageProvider = StorageProvider;

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

export type ArchiveFilters = {
  categoryId: string | null;
  tagIds: string[];
  toneKeys: string[];
  page: number;
};

export type ArchiveDictionaries = {
  categories: VideoDictionaryItem[];
  tags: VideoDictionaryItem[];
  toneFamilies: ToneFamilyItem[];
  tones: VideoDictionaryItem[];
};

export type ArchiveVideosResult = {
  items: ArchiveVideoItem[];
  dictionaries: ArchiveDictionaries;
  filters: ArchiveFilters;
  totalCount: number;
  pageCount: number;
};

export type VideoInteractionErrorCode =
  | "VALIDATION_FAILED"
  | "UNAUTHENTICATED"
  | "VIDEO_NOT_FOUND"
  | "INTERACTION_UNAVAILABLE"
  | "METRICS_UNAVAILABLE";

export type VideoInteractionErrorResponse = {
  code: VideoInteractionErrorCode;
  message: string;
};

export type VideoViewResponse = {
  counted: boolean;
  viewCount: number;
  viewCountLabel: string;
};

export type VideoLikeResponse = {
  liked: boolean;
  likeCount: number;
  likeCountLabel: string;
};
