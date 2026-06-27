export const STORAGE_PROVIDERS = ["bilibili", "youtube", "cos"] as const;
export const EXTERNAL_STORAGE_PROVIDERS = ["bilibili", "youtube"] as const;

export type StorageProvider = (typeof STORAGE_PROVIDERS)[number];
export type ExternalStorageProvider = (typeof EXTERNAL_STORAGE_PROVIDERS)[number];

export function isStorageProvider(value: unknown): value is StorageProvider {
  return typeof value === "string" && STORAGE_PROVIDERS.includes(value as StorageProvider);
}

export function normalizeStorageProvider(
  value: string | null | undefined,
  fallback: StorageProvider = "bilibili",
): StorageProvider {
  return isStorageProvider(value) ? value : fallback;
}

export const NATIVE_VIDEO_MAX_BYTES = 52_428_800;
export const NATIVE_COVER_MAX_BYTES = 5_242_880;

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
