import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import {
  databaseUnavailableError,
  unauthenticatedError,
  validationError,
  UserArchiveError,
} from "@/lib/user-archive/errors";

export async function createAuthenticatedUserArchiveContext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw unauthenticatedError();
  }

  return {
    supabase,
    user,
  };
}

export async function readJsonObject(request: Request) {
  const payload = (await request.json().catch(() => null)) as unknown;

  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    throw validationError("请求内容无效，请检查后重试。");
  }

  return payload as Record<string, unknown>;
}

export function userArchiveErrorResponse(error: unknown, context: string) {
  const archiveError =
    error instanceof UserArchiveError ? error : databaseUnavailableError();

  if (!(error instanceof UserArchiveError)) {
    console.error(context, error);
  }

  return NextResponse.json(
    {
      code: archiveError.code,
      message: archiveError.message,
      fields: archiveError.fields,
    },
    { status: archiveError.status },
  );
}
