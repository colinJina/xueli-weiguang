import { createPublicClient } from "@/lib/supabase/public";
import {
  serializeDictionaryItem,
  serializeVideoDetail,
  type VideoBaseRow,
  type VideoDictionaryRow,
  type VideoDetail,
  type VideoDictionaryItem,
} from "@/lib/videos/serialize-video";

type RelationRow = {
  tag_id?: string;
  tone_id?: string;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

const videoSelect =
  "id,platform,storage_provider,source_url,embed_url,playback_ref,title,cover_url,description,author_name,author_avatar,view_count,like_count,category_id,published_at,created_at";

function createDictionaryMap(items: VideoDictionaryItem[]) {
  return new Map(items.map((item) => [item.id, item]));
}

export async function getVideoById(id: string): Promise<VideoDetail | null> {
  if (!UUID_PATTERN.test(id)) {
    return null;
  }

  const supabase = createPublicClient();
  const { data, error } = await supabase.from("videos").select(videoSelect).eq("id", id).maybeSingle();

  if (error) {
    throw new Error(error.message);
  }

  if (!data) {
    return null;
  }

  const row = data as VideoBaseRow;
  const [categoriesResult, tagsResult, tonesResult, tagRowsResult, toneRowsResult] =
    await Promise.all([
      supabase.from("categories").select("id,name"),
      supabase.from("tags").select("id,name"),
      supabase.from("tones").select("id,name,color_hex"),
      supabase.from("video_tags").select("tag_id").eq("video_id", row.id),
      supabase.from("video_tones").select("tone_id").eq("video_id", row.id),
    ]);

  if (categoriesResult.error) {
    throw new Error(categoriesResult.error.message);
  }

  if (tagsResult.error) {
    throw new Error(tagsResult.error.message);
  }

  if (tonesResult.error) {
    throw new Error(tonesResult.error.message);
  }

  if (tagRowsResult.error) {
    throw new Error(tagRowsResult.error.message);
  }

  if (toneRowsResult.error) {
    throw new Error(toneRowsResult.error.message);
  }

  const categoryMap = createDictionaryMap(
    ((categoriesResult.data ?? []) as VideoDictionaryRow[]).map(serializeDictionaryItem),
  );
  const tagMap = createDictionaryMap(
    ((tagsResult.data ?? []) as VideoDictionaryRow[]).map(serializeDictionaryItem),
  );
  const toneMap = createDictionaryMap(
    ((tonesResult.data ?? []) as VideoDictionaryRow[]).map(serializeDictionaryItem),
  );
  const tags = ((tagRowsResult.data ?? []) as RelationRow[])
    .map((relation) => (relation.tag_id ? tagMap.get(relation.tag_id) : null))
    .filter((tag): tag is VideoDictionaryItem => Boolean(tag));
  const tones = ((toneRowsResult.data ?? []) as RelationRow[])
    .map((relation) => (relation.tone_id ? toneMap.get(relation.tone_id) : null))
    .filter((tone): tone is VideoDictionaryItem => Boolean(tone));

  return serializeVideoDetail(row, {
    category: categoryMap.get(row.category_id) ?? null,
    tags,
    tones,
  });
}
