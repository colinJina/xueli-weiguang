import { NextResponse } from "next/server";

import { getUserVideoFavoriteState } from "@/lib/user-archive/data";
import { validationError } from "@/lib/user-archive/errors";
import { isUuid } from "@/lib/user-archive/filters";
import { setVideoCollections } from "@/lib/user-archive/mutations";
import {
  createAuthenticatedUserArchiveContext,
  readJsonObject,
  userArchiveErrorResponse,
} from "@/lib/user-archive/route-helpers";

type RouteContext = { params: Promise<{ videoId: string }> };
const headers = { "Cache-Control": "private, no-store" };

export async function GET(_request: Request, { params }: RouteContext) {
  try {
    const { videoId } = await params;
    if (!isUuid(videoId)) {
      throw validationError("视频无效，请刷新后重试。");
    }
    const { supabase, user } = await createAuthenticatedUserArchiveContext();
    const result = await getUserVideoFavoriteState(supabase, user.id, videoId);
    return NextResponse.json(result, { headers });
  } catch (error) {
    const response = userArchiveErrorResponse(
      error,
      "Failed to read favorite state",
    );
    response.headers.set("Cache-Control", headers["Cache-Control"]);
    return response;
  }
}

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { videoId } = await params;
    const { supabase } = await createAuthenticatedUserArchiveContext();
    const input = await readJsonObject(request);
    const result = await setVideoCollections(supabase, videoId, input);
    return NextResponse.json(result, { headers });
  } catch (error) {
    const response = userArchiveErrorResponse(
      error,
      "Failed to set favorite collections",
    );
    response.headers.set("Cache-Control", headers["Cache-Control"]);
    return response;
  }
}
