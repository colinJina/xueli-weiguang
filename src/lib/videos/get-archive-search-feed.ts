import { createPublicClient } from "@/lib/supabase/public";
import { ARCHIVE_PAGE_SIZE } from "@/lib/videos/archive-filters";
import { parseArchiveSearch } from "@/lib/videos/archive-search";
import { archiveSearchDigest, formatArchiveSearchCursor } from "@/lib/videos/archive-search-cursor";
import type { ArchiveFeedCursor } from "@/lib/videos/archive-search-cursor";
import { serializeArchiveVideo, serializeDictionaryItem } from "@/lib/videos/serialize-video";
import type { ArchiveFilters, ArchiveVideoFeed, VideoBaseRow, VideoDictionaryRow } from "@/lib/videos/types";

type SearchRow = VideoBaseRow & {
  rank: number;
  category: VideoDictionaryRow | null;
  tags: VideoDictionaryRow[];
  tones: (VideoDictionaryRow & { percentage: number | null })[];
};
type SearchPayload = {
  items: SearchRow[];
  has_more: boolean;
  next_cursor: { rank: number; published_at: string; id: string } | null;
};
type SearchRpcQuery = PromiseLike<{ data: SearchPayload | null; error: { message: string } | null }> & {
  abortSignal: (signal: AbortSignal) => SearchRpcQuery;
};
type SearchRpcClient = {
  rpc: (name: "search_archive_video_feed", args: ReturnType<typeof archiveSearchRpcArgs>) => SearchRpcQuery;
};

export function archiveSearchRpcArgs(filters: ArchiveFilters, cursor: ArchiveFeedCursor | null) {
  const search = parseArchiveSearch(filters.query);
  if (search.error || !search.query) {
    throw new Error(search.error ?? "A search query is required");
  }
  const digest = archiveSearchDigest(filters);
  if (cursor && (!("rank" in cursor) || cursor.digest !== digest)) {
    throw new Error("Search cursor does not match the filters");
  }
  return {
    p_query: search.sourceUrl ? "" : search.query,
    p_source_url: search.sourceUrl,
    p_category_id: filters.categoryId,
    p_tag_ids: filters.tagIds,
    p_color_group_keys: filters.toneKeys,
    p_colors: filters.colors,
    p_color_match_mode: filters.colorMode,
    p_limit: ARCHIVE_PAGE_SIZE,
    p_after_rank: cursor && "rank" in cursor ? cursor.rank : null,
    p_after_published_at: cursor?.publishedAt ?? null,
    p_after_id: cursor?.id ?? null,
  };
}

export async function getArchiveSearchFeed(filters: ArchiveFilters, cursor: ArchiveFeedCursor | null, signal?: AbortSignal): Promise<ArchiveVideoFeed> {
  const supabase = createPublicClient();
  // As in get-video-feed, confine the missing generated Database type to the RPC boundary.
  // The response contract is checked before serialization below.
  const rpcClient = supabase as unknown as SearchRpcClient;
  let query = rpcClient.rpc("search_archive_video_feed", archiveSearchRpcArgs(filters, cursor));
  if (signal) {
    query = query.abortSignal(signal);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  const last = data && Array.isArray(data.items) ? data.items.at(-1) : null;
  if (!data || !Array.isArray(data.items) || data.items.length > ARCHIVE_PAGE_SIZE || typeof data.has_more !== "boolean" || data.items.some((row) => !row.id || !Number.isInteger(row.rank) || row.rank < 0 || row.rank > 1564 || !Array.isArray(row.tags) || !Array.isArray(row.tones)) || (data.has_more && (data.items.length !== ARCHIVE_PAGE_SIZE || !data.next_cursor || data.next_cursor.id !== last?.id || data.next_cursor.published_at !== last?.published_at || data.next_cursor.rank !== last?.rank))) {
    throw new Error("Invalid archive search response");
  }
  return {
    filters,
    items: data.items.map((row, index) => serializeArchiveVideo(row, {
      category: row.category ? serializeDictionaryItem(row.category) : null,
      tags: row.tags.map(serializeDictionaryItem),
      tones: row.tones.map((tone) => ({ ...serializeDictionaryItem(tone), percentage: tone.percentage })),
    }, index)),
    hasMore: data.has_more,
    nextCursor: data.has_more && data.next_cursor ? formatArchiveSearchCursor({
      digest: archiveSearchDigest(filters),
      rank: data.next_cursor.rank,
      publishedAt: data.next_cursor.published_at,
      id: data.next_cursor.id,
    }) : null,
  };
}
