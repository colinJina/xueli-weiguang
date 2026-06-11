import { NextResponse } from "next/server";

import { normalizeTagIds, setCollectionItemTags } from "@/lib/user-archive/mutations";
import {
  createAuthenticatedUserArchiveContext,
  readJsonObject,
  userArchiveErrorResponse,
} from "@/lib/user-archive/route-helpers";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export async function PUT(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { supabase, user } = await createAuthenticatedUserArchiveContext();
    const payload = await readJsonObject(request);
    const tagIds = normalizeTagIds(payload.tagIds) ?? [];

    await setCollectionItemTags(supabase, user.id, id, tagIds);

    return NextResponse.json({ id });
  } catch (error) {
    return userArchiveErrorResponse(error, "Failed to set collection item tags");
  }
}
