import type {
  CosUploadCredential,
  ExternalStorageProvider,
  NativeCoverMimeType,
  NativeVideoMimeType,
  StorageProvider,
} from "@/lib/storage/types";

export const NATIVE_PENDING_SUBMISSION_LIMIT = 3;
export const NATIVE_UPLOAD_SESSION_LIMIT = 3;
export const EXTERNAL_LINK_PENDING_SUBMISSION_LIMIT = 20;
export const EXTERNAL_LINK_DAILY_SUBMISSION_LIMIT = 50;
export const EXTERNAL_LINK_SUBMISSION_BODY_LIMIT_BYTES = 4 * 1024;
export const NATIVE_SUBMISSION_BODY_LIMIT_BYTES = 16 * 1024;
export const SUBMISSION_SOURCE_URL_MAX_LENGTH = 2048;

export type ExternalSubmissionPlatform = ExternalStorageProvider;

export type NativeSubmissionErrorCode =
  | "UNAUTHENTICATED"
  | "ADMIN_REQUIRED"
  | "FILE_TOO_LARGE"
  | "UNSUPPORTED_MIME"
  | "PENDING_QUOTA_EXCEEDED"
  | "UPLOAD_SESSION_EXPIRED"
  | "UPLOAD_SESSION_LIMIT_EXCEEDED"
  | "STORAGE_UNAVAILABLE"
  | "OBJECT_NOT_FOUND"
  | "MIME_MISMATCH"
  | "DUPLICATE_REF"
  | "VALIDATION_FAILED"
  | "INTERNAL_ERROR";

export type NativeSubmissionLimits = {
  maxBytes: number;
  maxCoverBytes: number;
  pendingLimit: number;
  activeUploadSessionLimit: number;
  allowedVideoMimeTypes: readonly NativeVideoMimeType[];
  allowedCoverMimeTypes: readonly NativeCoverMimeType[];
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

export type NativeSubmissionApiErrorPayload = {
  code?: NativeSubmissionErrorCode | string;
  message?: string;
  max?: number;
  pending?: number;
  field?: string;
  allowed?: readonly string[];
  fields?: Record<string, string>;
};

export type CreateNativeUploadSignatureInput = {
  userId: string;
  videoMimeType: unknown;
  videoSize: unknown;
  coverMimeType: unknown;
  featureOnHome?: unknown;
};

export type CompleteNativeSubmissionInput = {
  userId: string;
  submissionId: unknown;
  videoKey: unknown;
  coverKey: unknown;
  title: unknown;
  description: unknown;
  videoSize: unknown;
  videoMimeType: unknown;
  coverMimeType: unknown;
  featureOnHome?: unknown;
};

export type NativeSubmissionInsertResult = {
  id: string;
  status: string;
  storage_provider: "cos";
  source_ref: string;
  source_etag: string | null;
  cover_etag: string | null;
  created_at: string;
  feature_requested: boolean;
};

export type CreateSubmissionInput = {
  userId: string;
  platform: ExternalSubmissionPlatform;
  sourceUrl: string;
  externalId: string;
};

export type SubmissionInsertResult = {
  id: string;
  status: string;
  storage_provider: StorageProvider;
  external_id: string;
  created_at: string;
};
