import { createPublicClient } from "@/lib/supabase/public";
import { formatArchiveCursor } from "@/lib/videos/archive-cursor";
import type { ArchiveCursor } from "@/lib/videos/archive-cursor";
import type { ArchiveFeedCursor } from "@/lib/videos/archive-search-cursor";
import { getArchiveSearchFeed } from "@/lib/videos/get-archive-search-feed";
import { ARCHIVE_PAGE_SIZE, parseArchiveFilters } from "@/lib/videos/archive-filters";
import type { ArchiveSearchParams } from "@/lib/videos/archive-filters";
import { getVideoDictionaries } from "@/lib/videos/get-video-dictionaries";
import { hydrateArchiveRows } from "@/lib/videos/get-videos";
import type { ArchiveDictionaries, ArchiveFilters, ArchiveVideoFeed, VideoBaseRow } from "@/lib/videos/types";

type FeedPayload = {
  items: VideoBaseRow[];
  has_more: boolean;
  next_cursor: { published_at: string; id: string } | null;
};

type FeedRpcQuery = PromiseLike<{ data: FeedPayload | null; error: { message: string } | null }> & {
  abortSignal: (signal: AbortSignal) => FeedRpcQuery;
};
type FeedRpcClient = {
  rpc: (name: "get_archive_video_feed", args: ReturnType<typeof archiveFeedRpcArgs>) => FeedRpcQuery;
};

export function archiveFeedRpcArgs(filters: ArchiveFilters, cursor: ArchiveCursor | null) {
  return {
    p_category_id: filters.categoryId,
    p_tag_ids: filters.tagIds,
    p_color_group_keys: filters.toneKeys,
    p_colors: filters.colors,
    p_color_match_mode: filters.colorMode,
    p_limit: ARCHIVE_PAGE_SIZE,
    p_after_published_at: cursor?.publishedAt ?? null,
    p_after_id: cursor?.id ?? null,
  };
}

export async function getArchiveVideoFeed(
  raw: ArchiveSearchParams,
  cursor: ArchiveFeedCursor | null = null,
  existingDictionaries?: ArchiveDictionaries,
  signal?: AbortSignal,
): Promise<ArchiveVideoFeed> {
  const supabase = createPublicClient();
  const filters = { ...parseArchiveFilters(raw), page: 1 };
  if (filters.query) {
    return getArchiveSearchFeed(filters, cursor, signal);
  }
  if (cursor && "rank" in cursor) {
    throw new Error("Search cursor cannot be used for an ordinary feed");
  }
  // Like the legacy archive RPC, constrain only this RPC boundary until Database types are generated.
  const rpcClient = supabase as unknown as FeedRpcClient;
  let query = rpcClient.rpc("get_archive_video_feed", archiveFeedRpcArgs(filters, cursor));
  if (signal) {
    query = query.abortSignal(signal);
  }
  const [{ data, error }, dictionaries] = await Promise.all([
    query,
    existingDictionaries ?? getVideoDictionaries(),
  ]);
  if (error) {
    throw new Error(error.message);
  }
  if (!data || !Array.isArray(data.items) || data.items.length > ARCHIVE_PAGE_SIZE || typeof data.has_more !== "boolean" || (data.has_more && (data.items.length !== ARCHIVE_PAGE_SIZE || !data.next_cursor || data.next_cursor.id !== data.items.at(-1)?.id || data.next_cursor.published_at !== data.items.at(-1)?.published_at))) {
    throw new Error("Invalid archive feed response");
  }
  const nextCursor = data.has_more && data.next_cursor
    ? formatArchiveCursor({ publishedAt: data.next_cursor.published_at, id: data.next_cursor.id })
    : null;
  return {
    items: await hydrateArchiveRows(supabase, data.items, dictionaries, 0, signal),
    filters,
    hasMore: data.has_more,
    nextCursor,
  };
}
