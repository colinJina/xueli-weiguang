import { toMetricNumber } from "@/lib/videos/metrics";

export const VIDEO_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isVideoId(value: string) {
  return VIDEO_ID_PATTERN.test(value);
}

export function normalizeMetricCount(value: number | string | null | undefined) {
  return Math.max(0, toMetricNumber(value));
}
