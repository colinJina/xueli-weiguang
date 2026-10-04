import type {
  UserArchivePageData,
  UserArchiveVideoFavoriteState,
} from "@/lib/user-archive/types";
import type { VideoDetail, ArchiveFilters } from "@/lib/videos/types";

export const filters: ArchiveFilters = {
  categoryId: null,
  tagIds: [],
  toneKeys: [],
  colors: [],
  colorMode: "any",
  page: 1,
};
export const favorites: UserArchiveVideoFavoriteState = {
  collections: [
    {
      id: "folder-a",
      name: "影像",
      description: "",
      itemCount: 1,
      sortOrder: 0,
      active: true,
    },
    {
      id: "folder-b",
      name: "音乐",
      description: "",
      itemCount: 0,
      sortOrder: 1,
      active: false,
    },
  ],
  tags: [
    { id: "tag-a", name: "风景", itemCount: 1, sortOrder: 0, active: false },
  ],
  memberships: [
    {
      collectionItemId: "item-a",
      collectionId: "folder-a",
      collectionName: "影像",
      note: "第一份备注",
      tagIds: ["tag-a"],
      sortOrder: 0,
      createdAt: "2026-10-04",
    },
    {
      collectionItemId: "item-b",
      collectionId: "folder-b",
      collectionName: "音乐",
      note: "第二份备注",
      tagIds: [],
      sortOrder: 0,
      createdAt: "2026-10-04",
    },
  ],
};
export const video: VideoDetail = {
  id: "video-test",
  title: "光影收藏",
  platform: "youtube",
  storageProvider: "youtube",
  sourceLabel: "YouTube",
  visibilityLabel: "公开",
  authorName: "创作者",
  authorAvatar: null,
  publishedAtLabel: "2026.10.04",
  viewCount: 10,
  likeCount: 2,
  viewCountLabel: "10",
  likeCountLabel: "2",
  description: "一段光影记录。",
  category: { id: "category-test", name: "影像" },
  tags: [{ id: "tag-test", name: "记录" }],
  tones: [{ id: "tone-test", name: "白", colorHex: "#FFFFFF", percentage: 80 }],
  coverImageUrl: null,
  embedUrl: "about:blank",
  playbackRef: null,
  playbackUrl: null,
  sourceUrl: "https://www.youtube.com/watch?v=test-video",
};
export const profile: UserArchivePageData = {
  isAuthenticated: false,
  isAdmin: false,
  profile: null,
  collections: favorites.collections,
  tags: favorites.tags,
  tagLibrary: favorites.tags,
  activeCollection: {
    id: null,
    name: "全部收藏",
    description: "",
    itemCount: 0,
    isAll: true,
  },
  items: [],
  allItems: [],
  filters: {
    collectionId: null,
    keyword: "",
    tagIds: [],
    tagQuery: "",
    view: "grid",
  },
  totalCount: 0,
  allItemCount: 0,
};
