import type { createPublicClient } from "@/lib/supabase/public";
import { serializeDictionaryItem } from "@/lib/videos/serialize-video";
import type { VideoDictionaryRow, VideoToneItem } from "@/lib/videos/types";

type ToneRelationRow = {
  video_id: string;
  percentage: number | null;
  sort_order: number;
  tones: VideoDictionaryRow | null;
};

export async function getVideoTones(
  supabase: ReturnType<typeof createPublicClient>,
  videoIds: string[],
  signal?: AbortSignal,
) {
  const byVideoId = new Map<string, VideoToneItem[]>();
  if (videoIds.length === 0) {
    return byVideoId;
  }
  let query = supabase
    .from("video_tones")
    .select("video_id,percentage,sort_order,tones(id,name,color_hex)")
    .in("video_id", videoIds)
    .order("sort_order", { ascending: true })
    .limit(videoIds.length * 5);
  if (signal) {
    query = query.abortSignal(signal);
  }
  // This repository has no generated Database type; specify the selected join's
  // row shape at the query boundary rather than asserting an untyped result.
  const { data, error } = await query.returns<ToneRelationRow[]>();
  if (error) {
    throw new Error(error.message);
  }
  for (const row of data ?? []) {
    if (!row.tones) {
      continue;
    }
    const tones = byVideoId.get(row.video_id) ?? [];
    if (tones.length < 5) {
      tones.push({
        ...serializeDictionaryItem(row.tones),
        percentage: row.percentage,
      });
      byVideoId.set(row.video_id, tones);
    }
  }
  return byVideoId;
}
