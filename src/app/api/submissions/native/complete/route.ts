import { NextResponse } from "next/server";

import {
  completeNativeSubmission,
  NativeSubmissionApiError,
} from "@/lib/submissions/native-submission";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type CompleteNativeSubmissionRequestBody = {
  submissionId?: unknown;
  videoKey?: unknown;
  coverKey?: unknown;
  title?: unknown;
  description?: unknown;
  videoSize?: unknown;
  videoMimeType?: unknown;
  coverMimeType?: unknown;
};

function errorResponse(error: NativeSubmissionApiError) {
  return NextResponse.json(
    {
      code: error.code,
      message: error.message,
      ...error.extra,
    },
    { status: error.status },
  );
}

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      { code: "UNAUTHENTICATED", message: "请先登录后再投稿。" },
      { status: 401 },
    );
  }

  let body: CompleteNativeSubmissionRequestBody;

  try {
    body = (await request.json()) as CompleteNativeSubmissionRequestBody;
  } catch {
    return NextResponse.json(
      { code: "VALIDATION_FAILED", message: "请求内容无效，请重新提交。" },
      { status: 400 },
    );
  }

  try {
    const adminClient = createAdminClient();
    const submission = await completeNativeSubmission(adminClient, {
      userId: user.id,
      submissionId: body.submissionId,
      videoKey: body.videoKey,
      coverKey: body.coverKey,
      title: body.title,
      description: body.description,
      videoSize: body.videoSize,
      videoMimeType: body.videoMimeType,
      coverMimeType: body.coverMimeType,
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    if (error instanceof NativeSubmissionApiError) {
      return errorResponse(error);
    }

    console.error("Failed to complete native submission", error);
    return NextResponse.json(
      { code: "STORAGE_UNAVAILABLE", message: "视频存储服务暂不可用，请稍后重试。" },
      { status: 503 },
    );
  }
}
