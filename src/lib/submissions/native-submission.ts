import type { SupabaseClient } from "@supabase/supabase-js";

import { getCosServerConfig, CosConfigError } from "@/lib/storage/cos/config";
import {
  deleteCosObject,
  headCosObject,
  CosObjectNotFoundError,
} from "@/lib/storage/cos/client";
import { getNativeCosObjectKeys } from "@/lib/storage/cos/keys";
import { createCosUploadCredential } from "@/lib/storage/cos/signature";
import {
  ALLOWED_COVER_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  NATIVE_PENDING_SUBMISSION_LIMIT,
  type NativeCosUploadCredentialResponse,
  type NativeCoverMimeType,
  type NativeSubmissionErrorCode,
  type NativeSubmissionLimits,
  type NativeVideoMimeType,
} from "@/lib/storage/types";

const TITLE_MAX_LENGTH = 80;
const DESCRIPTION_MAX_LENGTH = 500;

type UnknownRecord = Record<string, unknown>;

export class NativeSubmissionApiError extends Error {
  readonly code: NativeSubmissionErrorCode;
  readonly status: number;
  readonly extra: UnknownRecord;

  constructor(input: {
    code: NativeSubmissionErrorCode;
    message: string;
    status: number;
    extra?: UnknownRecord;
  }) {
    super(input.message);
    this.name = "NativeSubmissionApiError";
    this.code = input.code;
    this.status = input.status;
    this.extra = input.extra ?? {};
  }
}

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

type NativeSubmissionInsertResult = {
  id: string;
  status: string;
  storage_provider: "cos";
  source_ref: string;
  source_etag: string | null;
  cover_etag: string | null;
  created_at: string;
};

function validationError(message: string, extra?: UnknownRecord) {
  return new NativeSubmissionApiError({
    code: "VALIDATION_FAILED",
    message,
    status: 400,
    extra,
  });
}

function fileTooLargeError(maxBytes: number) {
  return new NativeSubmissionApiError({
    code: "FILE_TOO_LARGE",
    message: "视频文件不能超过 50MB。",
    status: 400,
    extra: { max: maxBytes },
  });
}

function unsupportedMimeError(extra: UnknownRecord) {
  return new NativeSubmissionApiError({
    code: "UNSUPPORTED_MIME",
    message: "暂不支持该文件格式。",
    status: 400,
    extra,
  });
}

function storageUnavailableError() {
  return new NativeSubmissionApiError({
    code: "STORAGE_UNAVAILABLE",
    message: "视频存储服务暂不可用，请稍后重试。",
    status: 503,
  });
}

function objectNotFoundError(key: string) {
  return new NativeSubmissionApiError({
    code: "OBJECT_NOT_FOUND",
    message: "上传未完成，请重新上传。",
    status: 400,
    extra: { key },
  });
}

function mimeMismatchError(extra: UnknownRecord) {
  return new NativeSubmissionApiError({
    code: "MIME_MISMATCH",
    message: "上传文件格式与提交信息不一致。",
    status: 400,
    extra,
  });
}

function duplicateRefError() {
  return new NativeSubmissionApiError({
    code: "DUPLICATE_REF",
    message: "该视频投稿已存在。",
    status: 409,
  });
}

function pendingQuotaExceededError(pending: number) {
  return new NativeSubmissionApiError({
    code: "PENDING_QUOTA_EXCEEDED",
    message: "当前有 3 条待审稿件，审核完成后可继续投稿。",
    status: 429,
    extra: { pending },
  });
}

function isPendingQuotaDatabaseError(error: { code?: string; message?: string }) {
  return (
    error.code === "23514" &&
    typeof error.message === "string" &&
    error.message.includes("pending native submissions")
  );
}

function getNativeSubmissionLimits(maxBytes: number): NativeSubmissionLimits {
  return {
    maxBytes,
    pendingLimit: NATIVE_PENDING_SUBMISSION_LIMIT,
    allowedVideoMimeTypes: ALLOWED_VIDEO_MIME_TYPES,
    allowedCoverMimeTypes: ALLOWED_COVER_MIME_TYPES,
  };
}

function normalizeMimeType(value: unknown) {
  return typeof value === "string"
    ? value.split(";")[0]?.trim().toLowerCase() || ""
    : "";
}

function parseVideoMimeType(value: unknown): NativeVideoMimeType {
  const mimeType = normalizeMimeType(value);

  if (!ALLOWED_VIDEO_MIME_TYPES.includes(mimeType as NativeVideoMimeType)) {
    throw unsupportedMimeError({
      allowed: ALLOWED_VIDEO_MIME_TYPES,
      field: "videoMimeType",
    });
  }

  return mimeType as NativeVideoMimeType;
}

function parseCoverMimeType(value: unknown): NativeCoverMimeType {
  const mimeType = normalizeMimeType(value);

  if (!ALLOWED_COVER_MIME_TYPES.includes(mimeType as NativeCoverMimeType)) {
    throw unsupportedMimeError({
      allowed: ALLOWED_COVER_MIME_TYPES,
      field: "coverMimeType",
    });
  }

  return mimeType as NativeCoverMimeType;
}

function parsePositiveInteger(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isSafeInteger(value) || value <= 0) {
    throw validationError("请求字段无效。", {
      fields: { [field]: "必须是大于 0 的整数。" },
    });
  }

  return value;
}

function validateVideoSize(value: unknown, maxBytes: number) {
  const size = parsePositiveInteger(value, "videoSize");

  if (size > maxBytes) {
    throw fileTooLargeError(maxBytes);
  }

  return size;
}

function parseString(value: unknown, field: string) {
  if (typeof value !== "string") {
    throw validationError("请求字段无效。", {
      fields: { [field]: "必须是字符串。" },
    });
  }

  return value;
}

function parseTitle(value: unknown) {
  const title = parseString(value, "title").trim();

  if (title.length < 1 || title.length > TITLE_MAX_LENGTH) {
    throw validationError("请填写 1 到 80 字的标题。", {
      fields: { title: `标题长度需在 1 到 ${TITLE_MAX_LENGTH} 字之间。` },
    });
  }

  return title;
}

function parseDescription(value: unknown) {
  if (value === null || typeof value === "undefined") {
    return null;
  }

  const description = parseString(value, "description").trim();

  if (description.length > DESCRIPTION_MAX_LENGTH) {
    throw validationError("简介不能超过 500 字。", {
      fields: {
        description: `简介不能超过 ${DESCRIPTION_MAX_LENGTH} 字。`,
      },
    });
  }

  return description || null;
}

function assertStringEquals(input: {
  field: string;
  actual: unknown;
  expected: string;
}) {
  if (input.actual !== input.expected) {
    throw validationError("上传对象路径无效。", {
      fields: { [input.field]: "对象路径与当前用户不匹配。" },
    });
  }
}

async function countPendingNativeSubmissions(
  client: SupabaseClient,
  userId: string,
) {
  const { count, error } = await client
    .from("submissions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("storage_provider", "cos")
    .eq("status", "pending");

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function cleanupNativeObjects(keys: string[]) {
  let config;

  try {
    config = getCosServerConfig();
  } catch {
    return;
  }

  const results = await Promise.allSettled(
    keys.map((key) => deleteCosObject(config, key)),
  );

  for (const result of results) {
    if (result.status === "rejected") {
      console.error("Failed to delete invalid native upload object", result.reason);
    }
  }
}

export async function createNativeCosUploadSignature(
  client: SupabaseClient,
  input: CreateNativeUploadSignatureInput,
): Promise<NativeCosUploadCredentialResponse> {
  let config;

  try {
    config = getCosServerConfig();
  } catch (error) {
    if (error instanceof CosConfigError) {
      throw storageUnavailableError();
    }

    throw error;
  }

  const videoMimeType = parseVideoMimeType(input.videoMimeType);
  const coverMimeType = parseCoverMimeType(input.coverMimeType);
  validateVideoSize(input.videoSize, config.maxBytes);

  const pendingCount = await countPendingNativeSubmissions(client, input.userId);

  if (pendingCount >= NATIVE_PENDING_SUBMISSION_LIMIT) {
    throw pendingQuotaExceededError(pendingCount);
  }

  const submissionId = crypto.randomUUID();
  const keys = getNativeCosObjectKeys({
    userId: input.userId,
    submissionId,
    videoMimeType,
    coverMimeType,
  });

  let credential;

  try {
    credential = await createCosUploadCredential({
      config,
      allowPrefix: keys.prefix,
      videoKey: keys.videoKey,
      coverKey: keys.coverKey,
      maxBytes: config.maxBytes,
      videoMimeType,
      coverMimeType,
    });
  } catch (error) {
    console.error("Failed to create COS upload credential", error);
    throw storageUnavailableError();
  }

  return {
    storageProvider: "cos",
    submissionId,
    bucket: config.bucket,
    region: config.region,
    videoKey: keys.videoKey,
    coverKey: keys.coverKey,
    credential,
    expiresAt: new Date(credential.expiredTime * 1000).toISOString(),
    limits: getNativeSubmissionLimits(config.maxBytes),
  };
}

export async function completeNativeSubmission(
  client: SupabaseClient,
  input: CompleteNativeSubmissionInput,
): Promise<NativeSubmissionInsertResult> {
  let config;

  try {
    config = getCosServerConfig();
  } catch (error) {
    if (error instanceof CosConfigError) {
      throw storageUnavailableError();
    }

    throw error;
  }

  const submissionId = parseString(input.submissionId, "submissionId").trim();
  const videoMimeType = parseVideoMimeType(input.videoMimeType);
  const coverMimeType = parseCoverMimeType(input.coverMimeType);
  const videoSize = validateVideoSize(input.videoSize, config.maxBytes);
  const title = parseTitle(input.title);
  const description = parseDescription(input.description);

  const expectedKeys = getNativeCosObjectKeys({
    userId: input.userId,
    submissionId,
    videoMimeType,
    coverMimeType,
  });

  assertStringEquals({
    field: "videoKey",
    actual: input.videoKey,
    expected: expectedKeys.videoKey,
  });
  assertStringEquals({
    field: "coverKey",
    actual: input.coverKey,
    expected: expectedKeys.coverKey,
  });

  const objectKeys = [expectedKeys.videoKey, expectedKeys.coverKey];
  let videoHead;
  let coverHead;

  try {
    [videoHead, coverHead] = await Promise.all([
      headCosObject(config, expectedKeys.videoKey),
      headCosObject(config, expectedKeys.coverKey),
    ]);
  } catch (error) {
    await cleanupNativeObjects(objectKeys);

    if (error instanceof CosObjectNotFoundError) {
      throw objectNotFoundError(error.message);
    }

    console.error("Failed to head native submission objects", error);
    throw storageUnavailableError();
  }

  if (videoHead.size !== videoSize) {
    await cleanupNativeObjects(objectKeys);

    throw validationError("视频文件大小与提交信息不一致。", {
      fields: { videoSize: "文件大小与上传对象不匹配。" },
      actual: videoHead.size,
      expected: videoSize,
    });
  }

  if (videoHead.size > config.maxBytes) {
    await cleanupNativeObjects(objectKeys);
    throw fileTooLargeError(config.maxBytes);
  }

  if (videoHead.mimeType !== videoMimeType) {
    await cleanupNativeObjects(objectKeys);

    throw mimeMismatchError({
      field: "videoMimeType",
      actual: videoHead.mimeType,
      expected: videoMimeType,
    });
  }

  if (coverHead.size <= 0) {
    await cleanupNativeObjects(objectKeys);

    throw validationError("封面文件无效，请重新上传。", {
      fields: { coverKey: "封面文件不能为空。" },
    });
  }

  if (coverHead.mimeType !== coverMimeType) {
    await cleanupNativeObjects(objectKeys);

    throw mimeMismatchError({
      field: "coverMimeType",
      actual: coverHead.mimeType,
      expected: coverMimeType,
    });
  }

  let pendingCount;

  try {
    pendingCount = await countPendingNativeSubmissions(client, input.userId);
  } catch (error) {
    await cleanupNativeObjects(objectKeys);
    throw error;
  }

  if (pendingCount >= NATIVE_PENDING_SUBMISSION_LIMIT) {
    await cleanupNativeObjects(objectKeys);
    throw pendingQuotaExceededError(pendingCount);
  }

  const { data, error } = await client
    .from("submissions")
    .insert({
      id: submissionId,
      user_id: input.userId,
      platform: "cos",
      storage_provider: "cos",
      source_url: null,
      external_id: expectedKeys.videoKey,
      source_ref: expectedKeys.videoKey,
      cover_ref: expectedKeys.coverKey,
      source_etag: videoHead.etag,
      cover_etag: coverHead.etag,
      pending_title: title,
      pending_description: description,
      file_size: videoHead.size,
      mime_type: videoMimeType,
      status: "pending",
    })
    .select("id, status, storage_provider, source_ref, source_etag, cover_etag, created_at")
    .single();

  if (error) {
    await cleanupNativeObjects(objectKeys);

    if (error.code === "23505") {
      throw duplicateRefError();
    }

    if (isPendingQuotaDatabaseError(error)) {
      throw pendingQuotaExceededError(NATIVE_PENDING_SUBMISSION_LIMIT);
    }

    throw error;
  }

  return data;
}
