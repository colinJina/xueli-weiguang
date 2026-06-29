import { unstable_cache } from "next/cache";

import { createPublicClient } from "@/lib/supabase/public";
import { serializeDictionaryItem, serializeToneFamilyItem } from "@/lib/videos/serialize-video";
import type { ArchiveDictionaries, ToneFamilyRow, VideoDictionaryRow } from "@/lib/videos/types";

async function fetchVideoDictionaries(): Promise<ArchiveDictionaries> {
  const supabase = createPublicClient();
  const [categoriesResult, tagsResult, toneFamiliesResult, tonesResult] = await Promise.all([
    supabase.from("categories").select("id,name").order("sort_order", { ascending: true }),
    supabase.from("tags").select("id,name").order("name", { ascending: true }),
    supabase
      .from("tone_families")
      .select("id,key,name,color_hex,sort_order,is_active")
      .order("sort_order", { ascending: true })
      .order("name", { ascending: true }),
    supabase.from("tones").select("id,name,color_hex,family_id").order("name", { ascending: true }),
  ]);

  if (categoriesResult.error) {
    throw new Error(categoriesResult.error.message);
  }

  if (tagsResult.error) {
    throw new Error(tagsResult.error.message);
  }

  if (toneFamiliesResult.error) {
    throw new Error(toneFamiliesResult.error.message);
  }

  if (tonesResult.error) {
    throw new Error(tonesResult.error.message);
  }

  return {
    categories: ((categoriesResult.data ?? []) as VideoDictionaryRow[]).map(serializeDictionaryItem),
    tags: ((tagsResult.data ?? []) as VideoDictionaryRow[]).map(serializeDictionaryItem),
    toneFamilies: ((toneFamiliesResult.data ?? []) as ToneFamilyRow[]).map(serializeToneFamilyItem),
    tones: ((tonesResult.data ?? []) as VideoDictionaryRow[]).map(serializeDictionaryItem),
  };
}

const getCachedVideoDictionaries = unstable_cache(fetchVideoDictionaries, ["video-dictionaries"], {
  revalidate: 60,
});

export async function getVideoDictionaries() {
  return getCachedVideoDictionaries();
}
