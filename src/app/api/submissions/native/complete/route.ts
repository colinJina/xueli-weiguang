import { NextResponse } from "next/server";

import {
  completeNativeSubmission,
  NativeSubmissionApiError,
} from "@/lib/submissions/native-submission";
import { ADMIN_REQUIRED_MESSAGE, isAdminUser } from "@/lib/auth/admin";
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
  featureOnHome?: unknown;
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

  const isAdmin = await isAdminUser(supabase, user.id);

  if (!isAdmin) {
    return NextResponse.json(
      { code: "ADMIN_REQUIRED", message: ADMIN_REQUIRED_MESSAGE },
      { status: 403 },
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
      featureOnHome: body.featureOnHome,
    });

    return NextResponse.json(submission, { status: 201 });
  } catch (error) {
    if (error instanceof NativeSubmissionApiError) {
      return errorResponse(error);
    }

    console.error("Failed to complete native submission", error);
    return NextResponse.json(
      { code: "INTERNAL_ERROR", message: "投稿保存失败，请稍后重试。" },
      { status: 500 },
    );
  }
}
