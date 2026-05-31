import { NextResponse } from "next/server";

import { parseBilibiliUrl, BilibiliUrlError } from "@/lib/bilibili/parse-bilibili-url";
import {
  createSubmission,
  DuplicateSubmissionError,
} from "@/lib/submissions/create-submission";
import { createClient } from "@/lib/supabase/server";

type SubmissionRequestBody = {
  url?: unknown;
};

function badRequest(message: string, status = 400) {
  return NextResponse.json({ message }, { status });
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return badRequest("请先登录后再投稿。", 401);
  }

  let body: SubmissionRequestBody;

  try {
    body = (await request.json()) as SubmissionRequestBody;
  } catch {
    return badRequest("请求内容无效，请重新提交。");
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";

  if (!url) {
    return badRequest("请提供有效的 Bilibili 视频链接。");
  }

  try {
    const { bvid, canonicalUrl } = await parseBilibiliUrl(url);
    const submission = await createSubmission(supabase, {
      userId: user.id,
      sourceUrl: canonicalUrl,
      bvid,
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    if (error instanceof BilibiliUrlError) {
      return badRequest(error.message);
    }

    if (error instanceof DuplicateSubmissionError) {
      return badRequest(error.message, 409);
    }

    console.error("Failed to create submission", error);
    return badRequest("投稿失败，请稍后重试。", 500);
  }
}
