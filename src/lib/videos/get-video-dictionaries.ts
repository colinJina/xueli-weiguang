import { unstable_cache } from "next/cache";

import { createPublicClient } from "@/lib/supabase/public";
import { serializeDictionaryItem } from "@/lib/videos/serialize-video";
import type { ArchiveDictionaries, VideoDictionaryRow } from "@/lib/videos/types";

async function fetchVideoDictionaries(): Promise<ArchiveDictionaries> {
  const supabase = createPublicClient();
  const [categoriesResult, tagsResult, tonesResult] = await Promise.all([
    supabase.from("categories").select("id,name").order("sort_order", { ascending: true }),
    supabase.from("tags").select("id,name").order("name", { ascending: true }),
    supabase.from("tones").select("id,name,color_hex").order("name", { ascending: true }),
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

  return {
    categories: ((categoriesResult.data ?? []) as VideoDictionaryRow[]).map(serializeDictionaryItem),
    tags: ((tagsResult.data ?? []) as VideoDictionaryRow[]).map(serializeDictionaryItem),
    tones: ((tonesResult.data ?? []) as VideoDictionaryRow[]).map(serializeDictionaryItem),
  };
}

const getCachedVideoDictionaries = unstable_cache(fetchVideoDictionaries, ["video-dictionaries"], {
  revalidate: 60,
});

export async function getVideoDictionaries() {
  return getCachedVideoDictionaries();
}
