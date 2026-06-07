import type { SupabaseClient } from "@supabase/supabase-js";

export class DuplicateSubmissionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "DuplicateSubmissionError";
  }
}

type CreateSubmissionInput = {
  userId: string;
  sourceUrl: string;
  bvid: string;
};

type SubmissionInsertResult = {
  id: string;
  status: string;
  storage_provider: string;
  external_id: string;
  created_at: string;
};

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
