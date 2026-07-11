import { createPublicClient } from "@/lib/supabase/public";
import { getVideoDictionaries } from "@/lib/videos/get-video-dictionaries";
import { serializeArchiveVideo } from "@/lib/videos/serialize-video";
import { parseToneFamilyKeyList } from "@/lib/videos/tone-options";
import type {
  ArchiveDictionaries,
  ArchiveFilters,
  ArchiveVideosResult,
  ToneFamilyItem,
  VideoBaseRow,
  VideoDictionaryItem,
} from "@/lib/videos/types";

export const ARCHIVE_PAGE_SIZE = 24;
export const ARCHIVE_MAX_PAGE = 500;

type SearchParamValue = string | string[] | undefined;
type SearchParamsInput = Record<string, SearchParamValue>;
type PublicSupabaseClient = ReturnType<typeof createPublicClient>;
type RelationRow = {
  video_id: string;
  tag_id?: string;
  tone_id?: string;
};
type ArchiveVideosRpcPayload = {
  total_count?: number | string | null;
  items?: unknown;
};
type ArchiveVideosRpcArgs = {
  p_category_id: string | null;
  p_tag_ids: string[];
  p_tone_family_keys: string[];
  p_limit: number;
  p_offset: number;
};
type ArchiveVideosRpcClient = {
  rpc: (
    functionName: "get_archive_videos",
    args: ArchiveVideosRpcArgs,
  ) => Promise<{
    data: ArchiveVideosRpcPayload | null;
    error: { message: string } | null;
  }>;
};
type ArchivePageRequest = {
  offset: number;
  page: number;
  pageCount: number;
  shouldRefetch: boolean;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function getSingleParam(value: SearchParamValue) {
  return Array.isArray(value) ? value[0] : value;
}

function parseIdList(value: SearchParamValue) {
  const rawValue = getSingleParam(value);

  if (!rawValue) {
    return [];
  }

  return Array.from(
    new Set(
      rawValue
        .split(",")
        .map((item) => item.trim())
        .filter((item) => UUID_PATTERN.test(item)),
    ),
  );
}

function parseArchivePage(value: SearchParamValue) {
  const rawValue = getSingleParam(value)?.trim();

  if (!rawValue || !/^\d+$/.test(rawValue)) {
    return 1;
  }

  const pageValue = Number(rawValue);

  if (!Number.isSafeInteger(pageValue)) {
    return ARCHIVE_MAX_PAGE;
  }

  return Math.min(Math.max(1, pageValue), ARCHIVE_MAX_PAGE);
}

function getArchivePageOffset(page: number) {
  return (page - 1) * ARCHIVE_PAGE_SIZE;
}

export function resolveArchivePageRequest(
  requestedPage: number,
  totalCount: number,
): ArchivePageRequest {
  const safeTotalCount = Number.isFinite(totalCount) && totalCount > 0 ? Math.floor(totalCount) : 0;
  const pageCount = Math.max(1, Math.ceil(safeTotalCount / ARCHIVE_PAGE_SIZE));
  const safeRequestedPage =
    Number.isSafeInteger(requestedPage) && requestedPage > 0
      ? Math.min(requestedPage, ARCHIVE_MAX_PAGE)
      : 1;
  const page = Math.min(safeRequestedPage, pageCount);

  return {
    offset: getArchivePageOffset(page),
    page,
    pageCount,
    shouldRefetch: page !== safeRequestedPage,
  };
}

export function parseArchiveFilters(
  searchParams: SearchParamsInput,
  toneFamilies: readonly ToneFamilyItem[] = [],
): ArchiveFilters {
  const categoryValue = getSingleParam(searchParams.category);

  return {
    categoryId: categoryValue && UUID_PATTERN.test(categoryValue) ? categoryValue : null,
    tagIds: parseIdList(searchParams.tags),
    toneKeys: parseToneFamilyKeyList(searchParams.tones, toneFamilies),
    page: parseArchivePage(searchParams.page),
  };
}

function createDictionaryMap(items: VideoDictionaryItem[]) {
  return new Map(items.map((item) => [item.id, item]));
}

function parseArchiveVideosRpcPayload(payload: ArchiveVideosRpcPayload | null) {
  const totalCount = Number(payload?.total_count ?? 0);
  const rows = Array.isArray(payload?.items) ? (payload.items as VideoBaseRow[]) : [];

  return {
    rows,
    totalCount: Number.isFinite(totalCount) && totalCount > 0 ? totalCount : 0,
  };
}

async function listVideoRelations(
  supabase: PublicSupabaseClient,
  videoIds: string[],
  dictionaries: ArchiveDictionaries,
) {
  const tagMap = createDictionaryMap(dictionaries.tags);
  const toneMap = createDictionaryMap(dictionaries.tones);

  if (videoIds.length === 0) {
    return {
      tagsByVideoId: new Map<string, VideoDictionaryItem[]>(),
      tonesByVideoId: new Map<string, VideoDictionaryItem[]>(),
    };
  }

  const [tagRowsResult, toneRowsResult] = await Promise.all([
    supabase.from("video_tags").select("video_id,tag_id").in("video_id", videoIds),
    supabase.from("video_tones").select("video_id,tone_id").in("video_id", videoIds),
  ]);

  if (tagRowsResult.error) {
    throw new Error(tagRowsResult.error.message);
  }

  if (toneRowsResult.error) {
    throw new Error(toneRowsResult.error.message);
  }

  const tagsByVideoId = new Map<string, VideoDictionaryItem[]>();
  const tonesByVideoId = new Map<string, VideoDictionaryItem[]>();

  for (const row of (tagRowsResult.data ?? []) as RelationRow[]) {
    const tag = row.tag_id ? tagMap.get(row.tag_id) : null;

    if (tag) {
      tagsByVideoId.set(row.video_id, [...(tagsByVideoId.get(row.video_id) ?? []), tag]);
    }
  }

  for (const row of (toneRowsResult.data ?? []) as RelationRow[]) {
    const tone = row.tone_id ? toneMap.get(row.tone_id) : null;

    if (tone) {
      tonesByVideoId.set(row.video_id, [...(tonesByVideoId.get(row.video_id) ?? []), tone]);
    }
  }

  return { tagsByVideoId, tonesByVideoId };
}

async function fetchArchiveVideosPage(
  archiveRpcClient: ArchiveVideosRpcClient,
  filters: ArchiveFilters,
  offset: number,
) {
  const { data, error } = await archiveRpcClient.rpc("get_archive_videos", {
    p_category_id: filters.categoryId,
    p_tag_ids: filters.tagIds,
    p_tone_family_keys: filters.toneKeys,
    p_limit: ARCHIVE_PAGE_SIZE,
    p_offset: offset,
  });

  if (error) {
    throw new Error(error.message);
  }

  return parseArchiveVideosRpcPayload(data);
}

export async function getArchiveVideos(
  rawSearchParams: SearchParamsInput,
): Promise<ArchiveVideosResult> {
  const supabase = createPublicClient();
  const dictionaries = await getVideoDictionaries();
  const filters = parseArchiveFilters(rawSearchParams, dictionaries.toneFamilies);
  const archiveRpcClient = supabase as unknown as ArchiveVideosRpcClient;
  let requestedPage = filters.page;
  let pageRequest: ArchivePageRequest;
  let rows: VideoBaseRow[] = [];
  let totalCount = 0;

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const pageResult = await fetchArchiveVideosPage(
      archiveRpcClient,
      filters,
      getArchivePageOffset(requestedPage),
    );

    rows = pageResult.rows;
    totalCount = pageResult.totalCount;
    pageRequest = resolveArchivePageRequest(requestedPage, totalCount);

    if (!pageRequest.shouldRefetch) {
      break;
    }

    requestedPage = pageRequest.page;
  }

  pageRequest = resolveArchivePageRequest(requestedPage, totalCount);

  const categoryMap = createDictionaryMap(dictionaries.categories);
  const { tagsByVideoId, tonesByVideoId } = await listVideoRelations(
    supabase,
    rows.map((row) => row.id),
    dictionaries,
  );

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
    filters: pageRequest.page === filters.page ? filters : { ...filters, page: pageRequest.page },
    totalCount,
    pageCount: pageRequest.pageCount,
  };
}
