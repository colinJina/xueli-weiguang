import { NextResponse } from "next/server";

import {
  createNativeCosUploadSignature,
  NativeSubmissionApiError,
} from "@/lib/submissions/native-submission";
import { ADMIN_REQUIRED_MESSAGE, isAdminUser } from "@/lib/auth/admin";
import { createClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

type UploadSignatureRequestBody = {
  videoMimeType?: unknown;
  videoSize?: unknown;
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

  const isAdmin = await isAdminUser(supabase, user.id);

  if (!isAdmin) {
    return NextResponse.json(
      { code: "ADMIN_REQUIRED", message: ADMIN_REQUIRED_MESSAGE },
      { status: 403 },
    );
  }

  let body: UploadSignatureRequestBody;

  try {
    body = (await request.json()) as UploadSignatureRequestBody;
  } catch {
    return NextResponse.json(
      { code: "VALIDATION_FAILED", message: "请求内容无效，请重新提交。" },
      { status: 400 },
    );
  }

  try {
    const credential = await createNativeCosUploadSignature(supabase, {
      userId: user.id,
      videoMimeType: body.videoMimeType,
      videoSize: body.videoSize,
      coverMimeType: body.coverMimeType,
    });

    return NextResponse.json(credential);
  } catch (error) {
    if (error instanceof NativeSubmissionApiError) {
      return errorResponse(error);
    }

    console.error("Failed to create native COS upload signature", error);
    return NextResponse.json(
      { code: "STORAGE_UNAVAILABLE", message: "视频存储服务暂不可用，请稍后重试。" },
      { status: 503 },
    );
  }
}
