import type { SupabaseClient } from "@supabase/supabase-js";

import { EXTERNAL_STORAGE_PROVIDERS } from "@/lib/storage/types";
import {
  EXTERNAL_LINK_DAILY_SUBMISSION_LIMIT,
  EXTERNAL_LINK_PENDING_SUBMISSION_LIMIT,
  type CreateSubmissionInput,
  type SubmissionInsertResult,
} from "./types";

export class DuplicateSubmissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateSubmissionError";
  }
}

export class SubmissionQuotaExceededError extends Error {
  readonly status: number;

  constructor(message: string, status = 429) {
    super(message);
    this.name = "SubmissionQuotaExceededError";
    this.status = status;
  }
}

function mapQuotaDatabaseError(error: { code?: string; message?: string }) {
  const message = error.message?.toLowerCase() ?? "";

  if (error.code !== "23514") {
    return null;
  }

  if (
    message.includes("external_link_pending_submission_limit_exceeded") ||
    message.includes("bilibili_pending_submission_limit_exceeded")
  ) {
    return new SubmissionQuotaExceededError(
      `当前有 ${EXTERNAL_LINK_PENDING_SUBMISSION_LIMIT} 条待审投稿，审核完成后可继续投稿。`,
    );
  }

  if (
    message.includes("external_link_daily_submission_limit_exceeded") ||
    message.includes("bilibili_daily_submission_limit_exceeded")
  ) {
    return new SubmissionQuotaExceededError(
      `24 小时内最多只能提交 ${EXTERNAL_LINK_DAILY_SUBMISSION_LIMIT} 条外部视频链接。`,
    );
  }

  return null;
}

async function countSubmissions(
  query: PromiseLike<{ count: number | null; error: { code?: string; message?: string } | null }>,
) {
  const { count, error } = await query;

  if (error) {
    throw error;
  }

  return count ?? 0;
}

async function ensureExternalLinkSubmissionQuota(
  client: SupabaseClient,
  userId: string,
) {
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const [pendingCount, dailyCount] = await Promise.all([
    countSubmissions(
      client
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .in("storage_provider", [...EXTERNAL_STORAGE_PROVIDERS])
        .eq("status", "pending"),
    ),
    countSubmissions(
      client
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .in("storage_provider", [...EXTERNAL_STORAGE_PROVIDERS])
        .gte("created_at", since),
    ),
  ]);

  if (pendingCount >= EXTERNAL_LINK_PENDING_SUBMISSION_LIMIT) {
    throw new SubmissionQuotaExceededError(
      `当前有 ${EXTERNAL_LINK_PENDING_SUBMISSION_LIMIT} 条待审投稿，审核完成后可继续投稿。`,
    );
  }

  if (dailyCount >= EXTERNAL_LINK_DAILY_SUBMISSION_LIMIT) {
    throw new SubmissionQuotaExceededError(
      `24 小时内最多只能提交 ${EXTERNAL_LINK_DAILY_SUBMISSION_LIMIT} 条外部视频链接。`,
    );
  }
}

export async function createSubmission(
  client: SupabaseClient,
  input: CreateSubmissionInput,
): Promise<SubmissionInsertResult> {
  await ensureExternalLinkSubmissionQuota(client, input.userId);

  const { data, error } = await client
    .from("submissions")
    .insert({
      user_id: input.userId,
      platform: input.platform,
      storage_provider: input.platform,
      source_url: input.sourceUrl,
      external_id: input.externalId,
      status: "pending",
    })
    .select("id, status, storage_provider, external_id, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw new DuplicateSubmissionError("该视频已投稿，请勿重复提交。");
    }

    const quotaError = mapQuotaDatabaseError(error);

    if (quotaError) {
      throw quotaError;
    }

    throw error;
  }

  return data as SubmissionInsertResult;
}
