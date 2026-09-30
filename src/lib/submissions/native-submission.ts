import type { SupabaseClient } from "@supabase/supabase-js";

import { getCosServerConfig, CosConfigError } from "@/lib/storage/cos/config";
import {
  deleteCosObject,
  headCosObject,
  CosObjectNotFoundError,
} from "@/lib/storage/cos/client";
import { getNativeCosObjectKeys } from "@/lib/storage/cos/keys";
import {
  createCosUploadCredential,
  UPLOAD_CREDENTIAL_DURATION_SECONDS,
} from "@/lib/storage/cos/signature";
import {
  NATIVE_PENDING_SUBMISSION_LIMIT,
  NATIVE_UPLOAD_SESSION_LIMIT,
  type CompleteNativeSubmissionInput,
  type CreateNativeUploadSignatureInput,
  type NativeCosUploadCredentialResponse,
  type NativeSubmissionErrorCode,
  type NativeSubmissionInsertResult,
  type NativeSubmissionLimits,
} from "@/lib/submissions/types";
import {
  ALLOWED_COVER_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  type NativeCoverMimeType,
  type NativeVideoMimeType,
} from "@/lib/storage/types";

const TITLE_MAX_LENGTH = 80;
const DESCRIPTION_MAX_LENGTH = 500;
const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type UnknownRecord = Record<string, unknown>;
type NativeCompletionRpcRow = {
  outcome?: string | null;
  lease_expires_at?: string | null;
  submission_id?: string | null;
  submission_status?: string | null;
  storage_provider?: string | null;
  source_ref?: string | null;
  source_etag?: string | null;
  cover_etag?: string | null;
  created_at?: string | null;
  feature_requested?: boolean | null;
};
type NativeCompletionFailureRpcRow = {
  outcome?: string | null;
  cleanup_allowed?: boolean | null;
  video_key?: string | null;
  cover_key?: string | null;
};

function formatMegabytes(bytes: number) {
  return `${Math.round(bytes / 1024 / 1024)}MB`;
}

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
    message: `视频文件不能超过 ${formatMegabytes(maxBytes)}。`,
    status: 400,
    extra: { max: maxBytes, field: "video" },
  });
}

function coverTooLargeError(maxBytes: number) {
  return new NativeSubmissionApiError({
    code: "FILE_TOO_LARGE",
    message: `封面文件不能超过 ${formatMegabytes(maxBytes)}。`,
    status: 400,
    extra: { max: maxBytes, field: "cover" },
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
    message: `当前有 ${NATIVE_PENDING_SUBMISSION_LIMIT} 条待审稿件，审核完成后可继续投稿。`,
    status: 429,
    extra: { pending },
  });
}

function uploadSessionLimitExceededError(active: number) {
  return new NativeSubmissionApiError({
    code: "UPLOAD_SESSION_LIMIT_EXCEEDED",
    message: `当前有 ${NATIVE_UPLOAD_SESSION_LIMIT} 个未完成上传，请完成或稍后再试。`,
    status: 429,
    extra: { pending: active },
  });
}

function uploadSessionExpiredError() {
  return new NativeSubmissionApiError({
    code: "UPLOAD_SESSION_EXPIRED",
    message: "上传凭证已过期，请重新选择文件上传。",
    status: 400,
  });
}

function submissionCompletionInProgressError(leaseExpiresAt?: string | null) {
  return new NativeSubmissionApiError({
    code: "SUBMISSION_COMPLETION_IN_PROGRESS",
    message: "投稿正在完成，请稍后重试。",
    status: 409,
    extra: leaseExpiresAt ? { retryAfter: leaseExpiresAt } : undefined,
  });
}

function isPendingQuotaDatabaseError(error: { code?: string; message?: string }) {
  return (
    error.code === "23514" &&
    typeof error.message === "string" &&
    error.message.includes("pending native submissions")
  );
}

function isUploadSessionLimitDatabaseError(error: { code?: string; message?: string }) {
  return (
    error.code === "23514" &&
    typeof error.message === "string" &&
    error.message.toLowerCase().includes("native_upload_session_limit_exceeded")
  );
}

function getNativeSubmissionLimits(
  maxBytes: number,
  maxCoverBytes: number,
): NativeSubmissionLimits {
  return {
    maxBytes,
    maxCoverBytes,
    pendingLimit: NATIVE_PENDING_SUBMISSION_LIMIT,
    activeUploadSessionLimit: NATIVE_UPLOAD_SESSION_LIMIT,
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

function parseSubmissionId(value: unknown) {
  const submissionId = parseString(value, "submissionId").trim();

  if (!UUID_PATTERN.test(submissionId)) {
    throw validationError("上传会话无效，请重新上传。", {
      fields: { submissionId: "上传会话标识无效。" },
    });
  }

  return submissionId;
}

function parseObjectKey(value: unknown, field: "videoKey" | "coverKey") {
  const key = parseString(value, field).trim();

  if (!key) {
    throw validationError("上传对象路径无效。", {
      fields: { [field]: "对象路径不能为空。" },
    });
  }

  return key;
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

function parseFeatureOnHome(value: unknown) {
  return value === true;
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

async function expireStaleNativeUploadSessions(
  client: SupabaseClient,
  userId: string,
) {
  const { error } = await client
    .from("native_upload_sessions")
    .update({ status: "expired" })
    .eq("user_id", userId)
    .eq("status", "active")
    .lte("expires_at", new Date().toISOString());

  if (error) {
    throw error;
  }
}

async function countOpenNativeUploadSessions(
  client: SupabaseClient,
  userId: string,
) {
  const { count, error } = await client
    .from("native_upload_sessions")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .in("status", ["active", "completing"]);

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function deleteNativeUploadSession(client: SupabaseClient, sessionId: string) {
  const { error } = await client
    .from("native_upload_sessions")
    .delete()
    .eq("id", sessionId);

  if (error) {
    console.error("Failed to delete native upload session", error);
  }
}

function getFirstRpcRow<T>(data: unknown): T | null {
  if (!Array.isArray(data) || data.length === 0) {
    return null;
  }

  return data[0] as T;
}

function toNativeSubmissionResult(
  row: NativeCompletionRpcRow,
): NativeSubmissionInsertResult {
  if (
    !row.submission_id ||
    !row.submission_status ||
    row.storage_provider !== "cos" ||
    !row.source_ref ||
    !row.created_at
  ) {
    throw new Error("Native submission completion RPC returned an invalid result.");
  }

  return {
    id: row.submission_id,
    status: row.submission_status,
    storage_provider: "cos",
    source_ref: row.source_ref,
    source_etag: row.source_etag ?? null,
    cover_etag: row.cover_etag ?? null,
    created_at: row.created_at,
    feature_requested: Boolean(row.feature_requested),
  };
}

async function claimNativeSubmissionCompletion(input: {
  client: SupabaseClient;
  userId: string;
  sessionId: string;
  videoKey: string;
  coverKey: string;
  claimToken: string;
}) {
  const { data, error } = await input.client.rpc(
    "claim_native_submission_completion",
    {
      p_session_id: input.sessionId,
      p_user_id: input.userId,
      p_video_key: input.videoKey,
      p_cover_key: input.coverKey,
      p_claim_token: input.claimToken,
    },
  );

  if (error) {
    throw error;
  }

  const row = getFirstRpcRow<NativeCompletionRpcRow>(data);

  if (!row) {
    throw new Error("Native submission claim RPC returned no result.");
  }

  if (row.outcome === "completed") {
    return { kind: "completed" as const, result: toNativeSubmissionResult(row) };
  }

  if (row.outcome === "claimed") {
    return { kind: "claimed" as const };
  }

  if (row.outcome === "busy") {
    throw submissionCompletionInProgressError(row.lease_expires_at);
  }

  if (row.outcome === "invalid_keys") {
    throw validationError("上传对象路径无效。", {
      fields: { videoKey: "上传会话与对象路径不匹配。" },
    });
  }

  throw uploadSessionExpiredError();
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

async function resolveNativeSubmissionCompletionFailure(input: {
  client: SupabaseClient;
  userId: string;
  sessionId: string;
  claimToken: string;
  requestCleanup: boolean;
}) {
  const { data, error } = await input.client.rpc(
    "resolve_native_submission_completion_failure",
    {
      p_session_id: input.sessionId,
      p_user_id: input.userId,
      p_claim_token: input.claimToken,
      p_request_cleanup: input.requestCleanup,
    },
  );

  if (error) {
    console.error("Failed to resolve native submission completion claim", error);
    return null;
  }

  return getFirstRpcRow<NativeCompletionFailureRpcRow>(data);
}

async function releaseNativeSubmissionCompletion(input: {
  client: SupabaseClient;
  userId: string;
  sessionId: string;
  claimToken: string;
}) {
  await resolveNativeSubmissionCompletionFailure({
    ...input,
    requestCleanup: false,
  });
}

async function expireClaimAndCleanupNativeObjects(input: {
  client: SupabaseClient;
  userId: string;
  sessionId: string;
  claimToken: string;
}) {
  const resolution = await resolveNativeSubmissionCompletionFailure({
    ...input,
    requestCleanup: true,
  });

  if (
    !resolution?.cleanup_allowed ||
    !resolution.video_key ||
    !resolution.cover_key
  ) {
    return;
  }

  await cleanupNativeObjects([resolution.video_key, resolution.cover_key]);
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

  await expireStaleNativeUploadSessions(client, input.userId);

  const pendingCount = await countPendingNativeSubmissions(client, input.userId);

  if (pendingCount >= NATIVE_PENDING_SUBMISSION_LIMIT) {
    throw pendingQuotaExceededError(pendingCount);
  }

  const activeSessionCount = await countOpenNativeUploadSessions(client, input.userId);

  if (activeSessionCount >= NATIVE_UPLOAD_SESSION_LIMIT) {
    throw uploadSessionLimitExceededError(activeSessionCount);
  }

  const submissionId = crypto.randomUUID();
  const keys = getNativeCosObjectKeys({
    userId: input.userId,
    submissionId,
    videoMimeType,
    coverMimeType,
  });
  const expiresAt = new Date(
    Date.now() + UPLOAD_CREDENTIAL_DURATION_SECONDS * 1000,
  ).toISOString();

  const { error: sessionError } = await client.from("native_upload_sessions").insert({
    id: submissionId,
    user_id: input.userId,
    video_key: keys.videoKey,
    cover_key: keys.coverKey,
    status: "active",
    expires_at: expiresAt,
  });

  if (sessionError) {
    if (isUploadSessionLimitDatabaseError(sessionError)) {
      throw uploadSessionLimitExceededError(NATIVE_UPLOAD_SESSION_LIMIT);
    }

    throw sessionError;
  }

  let credential;

  try {
    credential = await createCosUploadCredential({
      config,
      allowPrefix: keys.prefix,
      videoKey: keys.videoKey,
      coverKey: keys.coverKey,
      maxVideoBytes: config.maxBytes,
      maxCoverBytes: config.maxCoverBytes,
      videoMimeType,
      coverMimeType,
    });
  } catch (error) {
    await deleteNativeUploadSession(client, submissionId);
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
    limits: getNativeSubmissionLimits(config.maxBytes, config.maxCoverBytes),
  };
}

function prepareNativeSubmissionCompletion(
  input: CompleteNativeSubmissionInput,
  submissionId: string,
) {
  const config = getCosServerConfig();
  const videoMimeType = parseVideoMimeType(input.videoMimeType);
  const coverMimeType = parseCoverMimeType(input.coverMimeType);
  const videoSize = validateVideoSize(input.videoSize, config.maxBytes);
  const title = parseTitle(input.title);
  const description = parseDescription(input.description);
  const featureOnHome = parseFeatureOnHome(input.featureOnHome);
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

  return {
    config,
    coverMimeType,
    description,
    expectedKeys,
    featureOnHome,
    title,
    videoMimeType,
    videoSize,
  };
}

export async function completeNativeSubmission(
  client: SupabaseClient,
  input: CompleteNativeSubmissionInput,
): Promise<NativeSubmissionInsertResult> {
  const submissionId = parseSubmissionId(input.submissionId);
  const videoKey = parseObjectKey(input.videoKey, "videoKey");
  const coverKey = parseObjectKey(input.coverKey, "coverKey");
  const claimToken = crypto.randomUUID();
  const claim = await claimNativeSubmissionCompletion({
    client,
    userId: input.userId,
    sessionId: submissionId,
    videoKey,
    coverKey,
    claimToken,
  });

  if (claim.kind === "completed") {
    return claim.result;
  }

  const claimContext = {
    client,
    userId: input.userId,
    sessionId: submissionId,
    claimToken,
  };
  let preparedCompletion;

  try {
    preparedCompletion = prepareNativeSubmissionCompletion(input, submissionId);
  } catch (error) {
    await releaseNativeSubmissionCompletion(claimContext);

    if (error instanceof CosConfigError) {
      throw storageUnavailableError();
    }

    throw error;
  }

  const {
    config,
    coverMimeType,
    description,
    expectedKeys,
    featureOnHome,
    title,
    videoMimeType,
    videoSize,
  } = preparedCompletion;
  let videoHead;
  let coverHead;

  try {
    [videoHead, coverHead] = await Promise.all([
      headCosObject(config, expectedKeys.videoKey),
      headCosObject(config, expectedKeys.coverKey),
    ]);
  } catch (error) {
    if (error instanceof CosObjectNotFoundError) {
      await expireClaimAndCleanupNativeObjects(claimContext);
      throw objectNotFoundError(error.message);
    }

    await releaseNativeSubmissionCompletion(claimContext);
    console.error("Failed to head native submission objects", error);
    throw storageUnavailableError();
  }

  if (videoHead.size !== videoSize) {
    await expireClaimAndCleanupNativeObjects(claimContext);

    throw validationError("视频文件大小与提交信息不一致。", {
      fields: { videoSize: "文件大小与上传对象不匹配。" },
      actual: videoHead.size,
      expected: videoSize,
    });
  }

  if (videoHead.size > config.maxBytes) {
    await expireClaimAndCleanupNativeObjects(claimContext);
    throw fileTooLargeError(config.maxBytes);
  }

  if (videoHead.mimeType !== videoMimeType) {
    await expireClaimAndCleanupNativeObjects(claimContext);

    throw mimeMismatchError({
      field: "videoMimeType",
      actual: videoHead.mimeType,
      expected: videoMimeType,
    });
  }

  if (coverHead.size <= 0) {
    await expireClaimAndCleanupNativeObjects(claimContext);

    throw validationError("封面文件无效，请重新上传。", {
      fields: { coverKey: "封面文件不能为空。" },
    });
  }

  if (coverHead.size > config.maxCoverBytes) {
    await expireClaimAndCleanupNativeObjects(claimContext);
    throw coverTooLargeError(config.maxCoverBytes);
  }

  if (coverHead.mimeType !== coverMimeType) {
    await expireClaimAndCleanupNativeObjects(claimContext);

    throw mimeMismatchError({
      field: "coverMimeType",
      actual: coverHead.mimeType,
      expected: coverMimeType,
    });
  }

  if (!videoHead.etag || !coverHead.etag) {
    await releaseNativeSubmissionCompletion(claimContext);
    console.error("Native submission HEAD response is missing an ETag", {
      coverKey: expectedKeys.coverKey,
      videoKey: expectedKeys.videoKey,
    });
    throw storageUnavailableError();
  }

  const { data, error } = await client.rpc(
    "finalize_native_submission_completion",
    {
      p_session_id: submissionId,
      p_user_id: input.userId,
      p_claim_token: claimToken,
      p_title: title,
      p_description: description,
      p_file_size: videoHead.size,
      p_mime_type: videoMimeType,
      p_source_etag: videoHead.etag,
      p_cover_etag: coverHead.etag,
      p_feature_on_home: featureOnHome,
    },
  );

  if (error) {
    if (error.code === "23505") {
      await expireClaimAndCleanupNativeObjects(claimContext);
      throw duplicateRefError();
    }

    if (isPendingQuotaDatabaseError(error)) {
      await releaseNativeSubmissionCompletion(claimContext);
      throw pendingQuotaExceededError(NATIVE_PENDING_SUBMISSION_LIMIT);
    }

    await releaseNativeSubmissionCompletion(claimContext);
    throw error;
  }

  const completion = getFirstRpcRow<NativeCompletionRpcRow>(data);

  if (!completion || completion.outcome !== "completed") {
    await releaseNativeSubmissionCompletion(claimContext);
    throw new Error("Native submission completion RPC returned no completed result.");
  }

  return toNativeSubmissionResult(completion);
}
