import { NextResponse } from "next/server";

import { parseBilibiliUrl, BilibiliUrlError } from "@/lib/bilibili/parse-bilibili-url";
import {
  JsonRequestError,
  readLimitedJsonObject,
} from "@/lib/http/read-limited-json";
import {
  createSubmission,
  DuplicateSubmissionError,
  SubmissionQuotaExceededError,
} from "@/lib/submissions/create-submission";
import {
  BILIBILI_SUBMISSION_BODY_LIMIT_BYTES,
  SUBMISSION_SOURCE_URL_MAX_LENGTH,
} from "@/lib/submissions/types";
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
    body = await readLimitedJsonObject(
      request,
      BILIBILI_SUBMISSION_BODY_LIMIT_BYTES,
    );
  } catch (error) {
    if (error instanceof JsonRequestError) {
      return badRequest(error.message, error.status);
    }

    return badRequest("请求内容无效，请重新提交。");
  }

  const url = typeof body.url === "string" ? body.url.trim() : "";

  if (!url) {
    return badRequest("请提供有效的 Bilibili 视频链接。");
  }

  if (url.length > SUBMISSION_SOURCE_URL_MAX_LENGTH) {
    return badRequest(`视频链接不能超过 ${SUBMISSION_SOURCE_URL_MAX_LENGTH} 个字符。`);
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

    if (error instanceof SubmissionQuotaExceededError) {
      return badRequest(error.message, error.status);
    }

    console.error("Failed to create submission", error);
    return badRequest("投稿失败，请稍后重试。", 500);
  }
}
