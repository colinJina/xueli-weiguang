export type StorageProvider = "bilibili" | "cos";

export const NATIVE_VIDEO_MAX_BYTES = 52_428_800;

export const ALLOWED_VIDEO_MIME_TYPES = ["video/mp4", "video/webm"] as const;
export const ALLOWED_COVER_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type NativeVideoMimeType = (typeof ALLOWED_VIDEO_MIME_TYPES)[number];
export type NativeCoverMimeType = (typeof ALLOWED_COVER_MIME_TYPES)[number];

export type CosUploadCredential = {
  tmpSecretId: string;
  tmpSecretKey: string;
  sessionToken: string;
  startTime: number;
  expiredTime: number;
};
