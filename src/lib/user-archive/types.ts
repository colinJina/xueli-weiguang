import type { VideoStorageProvider } from "@/lib/videos/types";

export const USER_ARCHIVE_ALL_COLLECTION_ID = "all";

export type UserArchiveView = "grid" | "list";

export type UserArchiveSearchParamValue = string | string[] | undefined;

export type UserArchiveSearchParams = Record<string, UserArchiveSearchParamValue>;

export type UserArchiveFilters = {
  collectionId: string | null;
  tagIds: string[];
  tagQuery: string;
  view: UserArchiveView;
};

export type UserArchiveProfile = {
  id: string;
  username: string | null;
  displayName: string;
  displayNameValue: string;
  headline: string;
  headlineValue: string;
  avatarUrl: string | null;
  email: string | null;
  initial: string;
};

export type UserArchiveCollectionSummary = {
  id: string;
  name: string;
  description: string;
  itemCount: number;
  sortOrder: number;
  active: boolean;
};

export type UserArchiveActiveCollection = {
  id: string | null;
  name: string;
  description: string;
  itemCount: number;
  isAll: boolean;
};

export type UserArchiveTagSummary = {
  id: string;
  name: string;
  itemCount: number;
  sortOrder: number;
  active: boolean;
};

export type UserArchiveItem = {
  id: string;
  collectionId: string;
  collectionName: string;
  videoId: string;
  title: string;
  note: string;
  coverUrl: string | null;
  viewCountLabel: string;
  likeCountLabel: string;
  sourceLabel: string;
  storageProvider: VideoStorageProvider;
  tags: UserArchiveTagSummary[];
  href: string;
  sortOrder: number;
  createdAt: string;
};

export type UserArchiveVideoMembership = {
  collectionItemId: string;
  collectionId: string;
  collectionName: string;
  note: string;
  tagIds: string[];
  sortOrder: number;
  createdAt: string;
};

export type UserArchiveVideoFavoriteState = {
  collections: UserArchiveCollectionSummary[];
  tags: UserArchiveTagSummary[];
  memberships: UserArchiveVideoMembership[];
};

export type UserArchivePageData = {
  isAuthenticated: boolean;
  isAdmin: boolean;
  profile: UserArchiveProfile | null;
  collections: UserArchiveCollectionSummary[];
  tags: UserArchiveTagSummary[];
  tagLibrary: UserArchiveTagSummary[];
  activeCollection: UserArchiveActiveCollection;
  items: UserArchiveItem[];
  allItems: UserArchiveItem[];
  filters: UserArchiveFilters;
  totalCount: number;
  allItemCount: number;
};

export type UserArchiveErrorCode =
  | "UNAUTHENTICATED"
  | "FORBIDDEN"
  | "VALIDATION_FAILED"
  | "NOT_FOUND"
  | "CONFLICT"
  | "LIMIT_EXCEEDED"
  | "DATABASE_UNAVAILABLE";

export type UserArchiveErrorResponse = {
  code: UserArchiveErrorCode;
  message: string;
  fields?: Record<string, string>;
};
