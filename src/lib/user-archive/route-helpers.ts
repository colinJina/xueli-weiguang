import { NextResponse } from "next/server";

import {
  JsonRequestError,
  readLimitedJsonObject,
} from "@/lib/http/read-limited-json";
import { createClient } from "@/lib/supabase/server";
import {
  databaseUnavailableError,
  limitExceededError,
  unauthenticatedError,
  validationError,
  UserArchiveError,
} from "@/lib/user-archive/errors";
import { USER_ARCHIVE_MUTATION_BODY_LIMIT_BYTES } from "@/lib/user-archive/limits";

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
  try {
    return await readLimitedJsonObject(
      request,
      USER_ARCHIVE_MUTATION_BODY_LIMIT_BYTES,
    );
  } catch (error) {
    if (error instanceof JsonRequestError) {
      if (error.status === 413) {
        throw limitExceededError(error.message, 413);
      }

      throw validationError("请求内容无效，请检查后重试。");
    }

    throw error;
  }
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
