export type StorageProvider = "bilibili" | "cos";

export const NATIVE_VIDEO_MAX_BYTES = 52_428_800;
export const NATIVE_PENDING_SUBMISSION_LIMIT = 3;

export const ALLOWED_VIDEO_MIME_TYPES = ["video/mp4", "video/webm"] as const;
export const ALLOWED_COVER_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;

export type NativeVideoMimeType = (typeof ALLOWED_VIDEO_MIME_TYPES)[number];
export type NativeCoverMimeType = (typeof ALLOWED_COVER_MIME_TYPES)[number];

export type NativeSubmissionErrorCode =
  | "UNAUTHENTICATED"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_MIME"
  | "PENDING_QUOTA_EXCEEDED"
  | "STORAGE_UNAVAILABLE"
  | "OBJECT_NOT_FOUND"
  | "MIME_MISMATCH"
  | "DUPLICATE_REF"
  | "VALIDATION_FAILED"
  | "INTERNAL_ERROR";

export type NativeSubmissionLimits = {
  maxBytes: number;
  pendingLimit: number;
  allowedVideoMimeTypes: readonly NativeVideoMimeType[];
  allowedCoverMimeTypes: readonly NativeCoverMimeType[];
};

export type CosUploadCredential = {
  tmpSecretId: string;
  tmpSecretKey: string;
  sessionToken: string;
  startTime: number;
  expiredTime: number;
};

export type NativeCosUploadCredentialResponse = {
  storageProvider: "cos";
  submissionId: string;
  bucket: string;
  region: string;
  videoKey: string;
  coverKey: string;
  credential: CosUploadCredential;
  expiresAt: string;
  limits: NativeSubmissionLimits;
};
