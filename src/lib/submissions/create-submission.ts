import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  CreateSubmissionInput,
  SubmissionInsertResult,
} from "@/lib/submissions/types";

export class DuplicateSubmissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateSubmissionError";
  }
}

export async function createSubmission(
  client: SupabaseClient,
  input: CreateSubmissionInput,
): Promise<SubmissionInsertResult> {
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

    throw error;
  }

  return data as SubmissionInsertResult;
}
