import { toMetricNumber } from "@/lib/videos/metrics";

export const VIDEO_ID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export type VideoInteractionErrorCode =
  | "VALIDATION_FAILED"
  | "UNAUTHENTICATED"
  | "VIDEO_NOT_FOUND"
  | "INTERACTION_UNAVAILABLE"
  | "METRICS_UNAVAILABLE";

export type VideoInteractionErrorResponse = {
  code: VideoInteractionErrorCode;
  message: string;
};

export type VideoViewResponse = {
  counted: boolean;
  viewCount: number;
  viewCountLabel: string;
};

export type VideoLikeResponse = {
  liked: boolean;
  likeCount: number;
  likeCountLabel: string;
};

export function isVideoId(value: string) {
  return VIDEO_ID_PATTERN.test(value);
}

export function normalizeMetricCount(value: number | string | null | undefined) {
  return Math.max(0, toMetricNumber(value));
}
