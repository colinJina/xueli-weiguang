import { createPublicClient } from "@/lib/supabase/public";
import { getVideoDictionaries } from "@/lib/videos/get-video-dictionaries";
import { serializeArchiveVideo } from "@/lib/videos/serialize-video";
import { getToneIdsForFamilyKeys, parseToneFamilyKeyList } from "@/lib/videos/tone-options";
import type {
  ArchiveDictionaries,
  ArchiveFilters,
  ArchiveVideosResult,
  ToneFamilyItem,
  VideoBaseRow,
  VideoDictionaryItem,
} from "@/lib/videos/types";

export const ARCHIVE_PAGE_SIZE = 24;

type SearchParamValue = string | string[] | undefined;
type SearchParamsInput = Record<string, SearchParamValue>;
type PublicSupabaseClient = ReturnType<typeof createPublicClient>;
type RelationRow = {
  video_id: string;
  tag_id?: string;
  tone_id?: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const videoSelect =
  "id,platform,storage_provider,source_url,embed_url,playback_ref,title,cover_url,description,author_name,author_avatar,view_count,like_count,category_id,published_at,created_at";

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

export function parseArchiveFilters(
  searchParams: SearchParamsInput,
  toneFamilies: readonly ToneFamilyItem[] = [],
): ArchiveFilters {
  const categoryValue = getSingleParam(searchParams.category);
  const pageValue = Number(getSingleParam(searchParams.page) ?? "1");
  const safePage = Number.isInteger(pageValue) && pageValue > 0 ? pageValue : 1;

  return {
    categoryId: categoryValue && UUID_PATTERN.test(categoryValue) ? categoryValue : null,
    tagIds: parseIdList(searchParams.tags),
    toneKeys: parseToneFamilyKeyList(searchParams.tones, toneFamilies),
    page: safePage,
  };
}

async function getVideoIdsForRelation(
  supabase: PublicSupabaseClient,
  tableName: "video_tags" | "video_tones",
  columnName: "tag_id" | "tone_id",
  ids: string[],
) {
  if (ids.length === 0) {
    return null;
  }

  const { data, error } = await supabase
    .from(tableName)
    .select(`video_id,${columnName}`)
    .in(columnName, ids);

  if (error) {
    throw new Error(error.message);
  }

  return new Set(((data ?? []) as RelationRow[]).map((row) => row.video_id));
}

function intersectVideoIdSets(sets: Array<Set<string> | null>) {
  const activeSets = sets.filter((set): set is Set<string> => Boolean(set));

  if (activeSets.length === 0) {
    return null;
  }

  const [firstSet, ...restSets] = activeSets;
  return Array.from(firstSet).filter((id) => restSets.every((set) => set.has(id)));
}

function createDictionaryMap(items: VideoDictionaryItem[]) {
  return new Map(items.map((item) => [item.id, item]));
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

export async function getArchiveVideos(
  rawSearchParams: SearchParamsInput,
): Promise<ArchiveVideosResult> {
  const supabase = createPublicClient();
  const dictionaries = await getVideoDictionaries();
  const filters = parseArchiveFilters(rawSearchParams, dictionaries.toneFamilies);
  const selectedToneIds = getToneIdsForFamilyKeys(
    dictionaries.tones,
    dictionaries.toneFamilies,
    filters.toneKeys,
  );

  if (filters.toneKeys.length > 0 && selectedToneIds.length === 0) {
    return {
      items: [],
      dictionaries,
      filters,
      totalCount: 0,
      pageCount: 1,
    };
  }

  const [tagVideoIds, toneVideoIds] = await Promise.all([
    getVideoIdsForRelation(supabase, "video_tags", "tag_id", filters.tagIds),
    getVideoIdsForRelation(supabase, "video_tones", "tone_id", selectedToneIds),
  ]);
  const constrainedVideoIds = intersectVideoIdSets([tagVideoIds, toneVideoIds]);

  if (constrainedVideoIds && constrainedVideoIds.length === 0) {
    return {
      items: [],
      dictionaries,
      filters,
      totalCount: 0,
      pageCount: 1,
    };
  }

  const from = (filters.page - 1) * ARCHIVE_PAGE_SIZE;
  const to = from + ARCHIVE_PAGE_SIZE - 1;
  let query = supabase
    .from("videos")
    .select(videoSelect, { count: "exact" })
    .order("published_at", { ascending: false })
    .range(from, to);

  if (filters.categoryId) {
    query = query.eq("category_id", filters.categoryId);
  }

  if (constrainedVideoIds) {
    query = query.in("id", constrainedVideoIds);
  }

  const { data, error, count } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as VideoBaseRow[];
  const categoryMap = createDictionaryMap(dictionaries.categories);
  const { tagsByVideoId, tonesByVideoId } = await listVideoRelations(
    supabase,
    rows.map((row) => row.id),
    dictionaries,
  );
  const totalCount = count ?? 0;

  return {
    items: rows.map((row, index) =>
      serializeArchiveVideo(
        row,
        {
          category: categoryMap.get(row.category_id) ?? null,
          tags: tagsByVideoId.get(row.id) ?? [],
          tones: tonesByVideoId.get(row.id) ?? [],
        },
        from + index,
      ),
    ),
    dictionaries,
    filters,
    totalCount,
    pageCount: Math.max(1, Math.ceil(totalCount / ARCHIVE_PAGE_SIZE)),
  };
}
