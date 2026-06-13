import type { SupabaseClient } from "@supabase/supabase-js";

import {
  BILIBILI_DAILY_SUBMISSION_LIMIT,
  BILIBILI_PENDING_SUBMISSION_LIMIT,
  type CreateSubmissionInput,
  type SubmissionInsertResult,
} from "@/lib/submissions/types";

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

  if (message.includes("bilibili_pending_submission_limit_exceeded")) {
    return new SubmissionQuotaExceededError(
      `当前有 ${BILIBILI_PENDING_SUBMISSION_LIMIT} 条待审投稿，审核完成后可继续投稿。`,
    );
  }

  if (message.includes("bilibili_daily_submission_limit_exceeded")) {
    return new SubmissionQuotaExceededError(
      `24 小时内最多只能提交 ${BILIBILI_DAILY_SUBMISSION_LIMIT} 条 Bilibili 链接。`,
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

async function ensureBilibiliSubmissionQuota(
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
        .eq("storage_provider", "bilibili")
        .eq("status", "pending"),
    ),
    countSubmissions(
      client
        .from("submissions")
        .select("id", { count: "exact", head: true })
        .eq("user_id", userId)
        .eq("storage_provider", "bilibili")
        .gte("created_at", since),
    ),
  ]);

  if (pendingCount >= BILIBILI_PENDING_SUBMISSION_LIMIT) {
    throw new SubmissionQuotaExceededError(
      `当前有 ${BILIBILI_PENDING_SUBMISSION_LIMIT} 条待审投稿，审核完成后可继续投稿。`,
    );
  }

  if (dailyCount >= BILIBILI_DAILY_SUBMISSION_LIMIT) {
    throw new SubmissionQuotaExceededError(
      `24 小时内最多只能提交 ${BILIBILI_DAILY_SUBMISSION_LIMIT} 条 Bilibili 链接。`,
    );
  }
}

export async function createSubmission(
  client: SupabaseClient,
  input: CreateSubmissionInput,
): Promise<SubmissionInsertResult> {
  await ensureBilibiliSubmissionQuota(client, input.userId);

  const { data, error } = await client
    .from("submissions")
    .insert({
      user_id: input.userId,
      platform: "bilibili",
      storage_provider: "bilibili",
      source_url: input.sourceUrl,
      external_id: input.bvid,
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
