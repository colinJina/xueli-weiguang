import type {
  CosUploadCredential,
  NativeCoverMimeType,
  NativeVideoMimeType,
} from "@/lib/storage/types";

export const NATIVE_PENDING_SUBMISSION_LIMIT = 3;

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
  allowed?: readonly string[];
  fields?: Record<string, string>;
};

export type CreateNativeUploadSignatureInput = {
  userId: string;
  videoMimeType: unknown;
  videoSize: unknown;
  coverMimeType: unknown;
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
};

export type NativeSubmissionInsertResult = {
  id: string;
  status: string;
  storage_provider: "cos";
  source_ref: string;
  source_etag: string | null;
  cover_etag: string | null;
  created_at: string;
};

export type CreateSubmissionInput = {
  userId: string;
  sourceUrl: string;
  bvid: string;
};

export type SubmissionInsertResult = {
  id: string;
  status: string;
  storage_provider: string;
  external_id: string;
  created_at: string;
};
