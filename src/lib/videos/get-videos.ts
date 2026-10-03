import { createPublicClient } from "@/lib/supabase/public";
import {
  ARCHIVE_PAGE_SIZE,
  parseArchiveFilters,
  resolveArchivePageRequest,
} from "@/lib/videos/archive-filters";
import type { ArchiveSearchParams } from "@/lib/videos/archive-filters";
import { getVideoDictionaries } from "@/lib/videos/get-video-dictionaries";
import { getVideoTones } from "@/lib/videos/get-video-tones";
import { serializeArchiveVideo } from "@/lib/videos/serialize-video";
import type {
  ArchiveDictionaries,
  ArchiveFilters,
  ArchiveVideosResult,
  VideoBaseRow,
  VideoDictionaryItem,
} from "@/lib/videos/types";

export {
  ARCHIVE_PAGE_SIZE,
  ARCHIVE_MAX_PAGE,
  ARCHIVE_MAX_TAG_FILTERS,
  parseArchiveFilters,
  resolveArchivePageRequest,
} from "@/lib/videos/archive-filters";

type ArchiveRpcPayload = {
  total_count: number | string;
  items: VideoBaseRow[];
};
type ArchiveRpcQuery = PromiseLike<{
  data: ArchiveRpcPayload | null;
  error: { message: string } | null;
}> & {
  abortSignal: (signal: AbortSignal) => ArchiveRpcQuery;
};
type ArchiveRpcClient = {
  rpc: (
    name: "get_archive_videos_by_color",
    args: ReturnType<typeof archiveRpcArgs>,
  ) => ArchiveRpcQuery;
};

export function archiveRpcArgs(filters: ArchiveFilters, offset: number) {
  return {
    p_category_id: filters.categoryId,
    p_tag_ids: filters.tagIds,
    p_color_group_keys: filters.toneKeys,
    p_colors: filters.colors,
    p_color_match_mode: filters.colorMode,
    p_limit: ARCHIVE_PAGE_SIZE,
    p_offset: offset,
  };
}

async function fetchPage(
  supabase: ReturnType<typeof createPublicClient>,
  filters: ArchiveFilters,
  offset: number,
  signal?: AbortSignal,
) {
  // No generated Database types exist here. The assertion is limited to the
  // agreed RPC contract; the payload is checked before serialization.
  const rpcClient = supabase as unknown as ArchiveRpcClient;
  let query = rpcClient.rpc(
    "get_archive_videos_by_color",
    archiveRpcArgs(filters, offset),
  );
  if (signal) {
    query = query.abortSignal(signal);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error(error.message);
  }
  if (
    !data ||
    !Array.isArray(data.items) ||
    !Number.isFinite(Number(data.total_count))
  ) {
    throw new Error("Invalid archive response");
  }
  return {
    rows: data.items,
    totalCount: Math.max(0, Math.floor(Number(data.total_count))),
  };
}

export async function getArchiveVideos(
  rawSearchParams: ArchiveSearchParams,
  existingDictionaries?: ArchiveDictionaries,
  signal?: AbortSignal,
): Promise<ArchiveVideosResult> {
  const supabase = createPublicClient();
  const filters = parseArchiveFilters(rawSearchParams);
  // Start the list and cached dictionaries independently.
  const [dictionaries, firstPage] = await Promise.all([
    existingDictionaries ?? getVideoDictionaries(),
    fetchPage(
      supabase,
      filters,
      (filters.page - 1) * ARCHIVE_PAGE_SIZE,
      signal,
    ),
  ]);
  let { rows, totalCount } = firstPage;
  let pageRequest = resolveArchivePageRequest(filters.page, totalCount);
  for (
    let attempt = 0;
    attempt < 2 && pageRequest.shouldRefetch;
    attempt += 1
  ) {
    const requestedPage = pageRequest.page;
    const result = await fetchPage(
      supabase,
      filters,
      pageRequest.offset,
      signal,
    );
    rows = result.rows;
    totalCount = result.totalCount;
    pageRequest = resolveArchivePageRequest(requestedPage, totalCount);
  }
  const videoIds = rows.map((row) => row.id);
  const categoryMap = new Map(
    dictionaries.categories.map((item) => [item.id, item]),
  );
  const tagMap = new Map(dictionaries.tags.map((item) => [item.id, item]));
  const tagsByVideoId = new Map<string, VideoDictionaryItem[]>();
  let tagsQuery = supabase
    .from("video_tags")
    .select("video_id,tag_id")
    .in("video_id", videoIds);
  if (signal) {
    tagsQuery = tagsQuery.abortSignal(signal);
  }
  const [tagResult, tonesByVideoId] = await Promise.all([
    videoIds.length
      ? tagsQuery.returns<{ video_id: string; tag_id: string }[]>()
      : { data: [], error: null },
    getVideoTones(supabase, videoIds, signal),
  ]);
  if (tagResult.error) {
    throw new Error(tagResult.error.message);
  }
  for (const row of tagResult.data ?? []) {
    const tag = tagMap.get(row.tag_id);
    if (tag) {
      tagsByVideoId.set(row.video_id, [
        ...(tagsByVideoId.get(row.video_id) ?? []),
        tag,
      ]);
    }
  }
  return {
    items: rows.map((row, index) =>
      serializeArchiveVideo(
        row,
        {
          category: categoryMap.get(row.category_id) ?? null,
          tags: tagsByVideoId.get(row.id) ?? [],
          tones: tonesByVideoId.get(row.id) ?? [],
        },
        pageRequest.offset + index,
      ),
    ),
    dictionaries,
    filters: { ...filters, page: pageRequest.page },
    totalCount,
    pageCount: pageRequest.pageCount,
  };
}
