import type { SupabaseClient } from "@supabase/supabase-js";

import { resolveCosPublicUrl } from "@/lib/storage/cos/public-url";
import {
  parseUserArchiveFilters,
} from "@/lib/user-archive/filters";
import { databaseUnavailableError } from "@/lib/user-archive/errors";
import {
  type UserArchiveActiveCollection,
  type UserArchiveCollectionSummary,
  type UserArchiveItem,
  type UserArchivePageData,
  type UserArchiveProfile,
  type UserArchiveSearchParams,
  type UserArchiveTagSummary,
  type UserArchiveVideoFavoriteState,
  type UserArchiveVideoMembership,
} from "@/lib/user-archive/types";
import { formatCompactNumber } from "@/lib/videos/metrics";
import type { VideoStorageProvider } from "@/lib/videos/types";

type ProfileRow = {
  id: string;
  username: string | null;
  display_name?: string | null;
  headline?: string | null;
  avatar_url?: string | null;
};

type CollectionRow = {
  id: string;
  name: string;
  description: string | null;
  sort_order: number | string | null;
  created_at: string;
};

type CollectionItemRow = {
  id: string;
  collection_id: string;
  video_id: string;
  note: string | null;
  sort_order: number | string | null;
  created_at: string;
};

type CollectionTagRow = {
  id: string;
  name: string;
  sort_order: number | string | null;
  created_at: string;
};

type CollectionItemTagRow = {
  collection_item_id: string;
  tag_id: string;
};

type CollectionItemCountRow = {
  collection_id: string;
};

type UserArchiveVideoRow = {
  id: string;
  platform: string;
  storage_provider?: string | null;
  title: string;
  cover_url: string | null;
  view_count: number | string;
  like_count: number | string;
  published_at: string | null;
  created_at: string;
};

const profileSelect = "id,username,display_name,headline,avatar_url";
const videoSelect =
  "id,platform,storage_provider,title,cover_url,view_count,like_count,published_at,created_at";

const sourceLabels: Record<VideoStorageProvider, string> = {
  bilibili: "Bilibili",
  cos: "原创",
};

function toNumber(value: number | string | null | undefined) {
  const numericValue = Number(value);
  return Number.isFinite(numericValue) ? numericValue : 0;
}

function normalizeMediaUrl(value: string | null) {
  if (!value) {
    return null;
  }

  return value.startsWith("http://") ? `https://${value.slice("http://".length)}` : value;
}

function normalizeStorageProvider(value: string | null | undefined): VideoStorageProvider {
  return value === "cos" ? "cos" : "bilibili";
}

function resolvePublicMediaUrl(
  storageProvider: VideoStorageProvider,
  value: string | null | undefined,
) {
  return storageProvider === "cos" ? resolveCosPublicUrl(value) : normalizeMediaUrl(value ?? null);
}

function createInitial(displayName: string) {
  const firstCharacter = displayName.trim().slice(0, 1);
  return firstCharacter ? firstCharacter.toUpperCase() : "U";
}

function serializeProfile(
  row: ProfileRow | null,
  userId: string,
  email: string | null | undefined,
): UserArchiveProfile {
  const username = row?.username?.trim() || null;
  const displayNameValue = row?.display_name?.trim() ?? "";
  const headlineValue = row?.headline?.trim() ?? "";
  const fallbackName = username ?? email ?? `用户 ${userId.slice(0, 8)}`;
  const displayName = displayNameValue || fallbackName;
  const headline = headlineValue || "";

  return {
    id: userId,
    username,
    displayName,
    displayNameValue,
    headline,
    headlineValue,
    avatarUrl: normalizeMediaUrl(row?.avatar_url ?? null),
    email: email ?? null,
    initial: createInitial(displayName),
  };
}

function sortByOrderAndCreatedAt<T extends { sortOrder: number; createdAt: string }>(items: T[]) {
  return [...items].sort((a, b) => {
    if (a.sortOrder !== b.sortOrder) {
      return a.sortOrder - b.sortOrder;
    }

    return b.createdAt.localeCompare(a.createdAt);
  });
}

function createTagIdMap(rows: CollectionItemTagRow[]) {
  const map = new Map<string, string[]>();

  for (const row of rows) {
    map.set(row.collection_item_id, [...(map.get(row.collection_item_id) ?? []), row.tag_id]);
  }

  return map;
}

function createItemTags(
  tagIds: readonly string[],
  tagMap: Map<string, UserArchiveTagSummary>,
) {
  return tagIds.map((tagId) => tagMap.get(tagId)).filter((tag): tag is UserArchiveTagSummary =>
    Boolean(tag),
  );
}

function serializeItem(input: {
  row: CollectionItemRow;
  collectionName: string;
  video: UserArchiveVideoRow;
  tags: UserArchiveTagSummary[];
}): UserArchiveItem {
  const storageProvider = normalizeStorageProvider(
    input.video.storage_provider ?? input.video.platform,
  );

  return {
    id: input.row.id,
    collectionId: input.row.collection_id,
    collectionName: input.collectionName,
    videoId: input.video.id,
    title: input.video.title,
    note: input.row.note ?? "",
    coverUrl: resolvePublicMediaUrl(storageProvider, input.video.cover_url),
    viewCountLabel: formatCompactNumber(input.video.view_count),
    likeCountLabel: formatCompactNumber(input.video.like_count),
    sourceLabel: sourceLabels[storageProvider],
    storageProvider,
    tags: input.tags,
    href: `/video/${input.video.id}`,
    sortOrder: toNumber(input.row.sort_order),
    createdAt: input.row.created_at,
  };
}

function createCollectionCounts(items: readonly UserArchiveItem[]) {
  const counts = new Map<string, number>();

  for (const item of items) {
    counts.set(item.collectionId, (counts.get(item.collectionId) ?? 0) + 1);
  }

  return counts;
}

function createTagCounts(items: readonly UserArchiveItem[]) {
  const counts = new Map<string, number>();

  for (const item of items) {
    for (const tag of item.tags) {
      counts.set(tag.id, (counts.get(tag.id) ?? 0) + 1);
    }
  }

  return counts;
}

function filterTagsByQuery(
  tags: UserArchiveTagSummary[],
  query: string,
  selectedTagIds: readonly string[],
) {
  if (!query) {
    return tags;
  }

  const normalizedQuery = query.toLocaleLowerCase();
  const selected = new Set(selectedTagIds);

  return tags.filter(
    (tag) => selected.has(tag.id) || tag.name.toLocaleLowerCase().includes(normalizedQuery),
  );
}

function createActiveCollection(input: {
  activeCollectionId: string | null;
  collectionMap: Map<string, UserArchiveCollectionSummary>;
  allItemCount: number;
}): UserArchiveActiveCollection {
  if (input.activeCollectionId) {
    const collection = input.collectionMap.get(input.activeCollectionId);

    if (collection) {
      return {
        id: collection.id,
        name: collection.name,
        description: collection.description,
        itemCount: collection.itemCount,
        isAll: false,
      };
    }
  }

  return {
    id: null,
    name: "全部视频",
    description: "当前档案下所有已收藏公开视频。",
    itemCount: input.allItemCount,
    isAll: true,
  };
}

function resolveActiveCollectionId(
  requestedCollectionId: string | null,
  collections: readonly UserArchiveCollectionSummary[],
) {
  if (requestedCollectionId && collections.some((collection) => collection.id === requestedCollectionId)) {
    return requestedCollectionId;
  }

  return null;
}

export function createGuestUserArchivePageData(
  searchParams: UserArchiveSearchParams,
): UserArchivePageData {
  const filters = parseUserArchiveFilters(searchParams);

  return {
    isAuthenticated: false,
    profile: null,
    collections: [],
    tags: [],
    tagLibrary: [],
    activeCollection: {
      id: null,
      name: "我的档案",
      description: "登录后管理你的收藏夹、标签和公开视频收藏。",
      itemCount: 0,
      isAll: true,
    },
    items: [],
    allItems: [],
    filters,
    totalCount: 0,
    allItemCount: 0,
  };
}

export async function getUserArchivePageData(
  client: SupabaseClient,
  userId: string,
  searchParams: UserArchiveSearchParams,
  email?: string | null,
): Promise<UserArchivePageData> {
  const filters = parseUserArchiveFilters(searchParams);

  const [profileResult, collectionsResult, tagsResult, itemsResult] = await Promise.all([
    client.from("profiles").select(profileSelect).eq("id", userId).maybeSingle(),
    client
      .from("collections")
      .select("id,name,description,sort_order,created_at")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    client
      .from("collection_tags")
      .select("id,name,sort_order,created_at")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    client
      .from("collection_items")
      .select("id,collection_id,video_id,note,sort_order,created_at")
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
  ]);

  if (profileResult.error) {
    throw databaseUnavailableError();
  }

  if (collectionsResult.error || tagsResult.error || itemsResult.error) {
    throw databaseUnavailableError();
  }

  const collectionRows = (collectionsResult.data ?? []) as CollectionRow[];
  const itemRows = (itemsResult.data ?? []) as CollectionItemRow[];
  const itemIds = itemRows.map((row) => row.id);
  const videoIds = Array.from(new Set(itemRows.map((row) => row.video_id)));

  const [itemTagsResult, videosResult] = await Promise.all([
    itemIds.length > 0
      ? client
          .from("collection_item_tags")
          .select("collection_item_id,tag_id")
          .in("collection_item_id", itemIds)
      : Promise.resolve({ data: [], error: null }),
    videoIds.length > 0
      ? client
          .from("videos")
          .select(videoSelect)
          .in("id", videoIds)
          .not("published_at", "is", null)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (itemTagsResult.error || videosResult.error) {
    throw databaseUnavailableError();
  }

  const rawTags = ((tagsResult.data ?? []) as CollectionTagRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    itemCount: 0,
    sortOrder: toNumber(row.sort_order),
    active: filters.tagIds.includes(row.id),
  }));
  const baseTagMap = new Map(rawTags.map((tag) => [tag.id, tag]));
  const collectionNameMap = new Map(collectionRows.map((row) => [row.id, row.name]));
  const itemTagIdMap = createTagIdMap((itemTagsResult.data ?? []) as CollectionItemTagRow[]);
  const videoMap = new Map(
    ((videosResult.data ?? []) as UserArchiveVideoRow[]).map((video) => [video.id, video]),
  );
  const allItems = sortByOrderAndCreatedAt(
    itemRows
      .map((row) => {
        const video = videoMap.get(row.video_id);

        if (!video) {
          return null;
        }

        return serializeItem({
          row,
          collectionName: collectionNameMap.get(row.collection_id) ?? "未命名收藏夹",
          video,
          tags: createItemTags(itemTagIdMap.get(row.id) ?? [], baseTagMap),
        });
      })
      .filter((item): item is UserArchiveItem => Boolean(item)),
  );
  const collectionCounts = createCollectionCounts(allItems);
  const allTagCounts = createTagCounts(allItems);
  const tagLibrary = rawTags.map((tag) => ({
    ...tag,
    itemCount: allTagCounts.get(tag.id) ?? 0,
    active: false,
  }));
  const collections = collectionRows.map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    itemCount: collectionCounts.get(row.id) ?? 0,
    sortOrder: toNumber(row.sort_order),
    active: false,
  }));
  const activeCollectionId = resolveActiveCollectionId(filters.collectionId, collections);
  const collectionScopedItems = activeCollectionId
    ? allItems.filter((item) => item.collectionId === activeCollectionId)
    : allItems;
  const selectedTagIds = filters.tagIds.filter((tagId) => baseTagMap.has(tagId));
  const tagCounts = createTagCounts(collectionScopedItems);
  const tags = filterTagsByQuery(
    rawTags.map((tag) => ({
      ...tag,
      itemCount: tagCounts.get(tag.id) ?? 0,
      active: selectedTagIds.includes(tag.id),
    })),
    filters.tagQuery,
    selectedTagIds,
  );
  const selectedTagIdSet = new Set(selectedTagIds);
  const filteredItems =
    selectedTagIds.length > 0
      ? collectionScopedItems.filter((item) =>
          selectedTagIds.every((tagId) => item.tags.some((tag) => tag.id === tagId)),
        )
      : collectionScopedItems;
  const collectionMap = new Map(collections.map((collection) => [collection.id, collection]));
  const activeCollections = collections.map((collection) => ({
    ...collection,
    active: collection.id === activeCollectionId,
  }));

  return {
    isAuthenticated: true,
    profile: serializeProfile((profileResult.data as ProfileRow | null) ?? null, userId, email),
    collections: activeCollections,
    tags: tags.map((tag) => ({
      ...tag,
      active: selectedTagIdSet.has(tag.id),
    })),
    tagLibrary,
    activeCollection: createActiveCollection({
      activeCollectionId,
      collectionMap,
      allItemCount: allItems.length,
    }),
    items: filteredItems,
    allItems,
    filters: {
      ...filters,
      collectionId: activeCollectionId,
      tagIds: selectedTagIds,
    },
    totalCount: filteredItems.length,
    allItemCount: allItems.length,
  };
}

export async function getUserVideoFavoriteState(
  client: SupabaseClient,
  userId: string,
  videoId: string,
): Promise<UserArchiveVideoFavoriteState> {
  const [collectionsResult, tagsResult, videoItemsResult, allItemsResult] = await Promise.all([
    client
      .from("collections")
      .select("id,name,description,sort_order,created_at")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    client
      .from("collection_tags")
      .select("id,name,sort_order,created_at")
      .eq("user_id", userId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    client
      .from("collection_items")
      .select("id,collection_id,video_id,note,sort_order,created_at")
      .eq("video_id", videoId)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: false }),
    client.from("collection_items").select("collection_id"),
  ]);

  if (collectionsResult.error || tagsResult.error || videoItemsResult.error || allItemsResult.error) {
    throw databaseUnavailableError();
  }

  const itemRows = (videoItemsResult.data ?? []) as CollectionItemRow[];
  const itemIds = itemRows.map((row) => row.id);
  const itemTagsResult =
    itemIds.length > 0
      ? await client
          .from("collection_item_tags")
          .select("collection_item_id,tag_id")
          .in("collection_item_id", itemIds)
      : { data: [], error: null };

  if (itemTagsResult.error) {
    throw databaseUnavailableError();
  }

  const collectionCounts = new Map<string, number>();

  for (const row of (allItemsResult.data ?? []) as CollectionItemCountRow[]) {
    collectionCounts.set(row.collection_id, (collectionCounts.get(row.collection_id) ?? 0) + 1);
  }

  const collections = ((collectionsResult.data ?? []) as CollectionRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    description: row.description ?? "",
    itemCount: collectionCounts.get(row.id) ?? 0,
    sortOrder: toNumber(row.sort_order),
    active: false,
  }));
  const collectionMap = new Map(collections.map((collection) => [collection.id, collection]));
  const itemTagIdMap = createTagIdMap((itemTagsResult.data ?? []) as CollectionItemTagRow[]);
  const memberships = sortByOrderAndCreatedAt(
    itemRows
      .map((row): UserArchiveVideoMembership | null => {
        const collection = collectionMap.get(row.collection_id);

        if (!collection) {
          return null;
        }

        return {
          collectionItemId: row.id,
          collectionId: row.collection_id,
          collectionName: collection.name,
          note: row.note ?? "",
          tagIds: itemTagIdMap.get(row.id) ?? [],
          sortOrder: toNumber(row.sort_order),
          createdAt: row.created_at,
        };
      })
      .filter((membership): membership is UserArchiveVideoMembership => Boolean(membership)),
  );
  const tags = ((tagsResult.data ?? []) as CollectionTagRow[]).map((row) => ({
    id: row.id,
    name: row.name,
    itemCount: 0,
    sortOrder: toNumber(row.sort_order),
    active: false,
  }));

  return {
    collections,
    tags,
    memberships,
  };
}
