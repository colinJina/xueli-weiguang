import { NextResponse } from "next/server";

import {
  deleteCollectionItem,
  updateCollectionItem,
} from "@/lib/user-archive/mutations";
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

export async function PATCH(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { supabase } = await createAuthenticatedUserArchiveContext();
    const payload = await readJsonObject(request);
    const result = await updateCollectionItem(supabase, id, payload);

    return NextResponse.json(result);
  } catch (error) {
    return userArchiveErrorResponse(error, "Failed to update collection item");
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { supabase } = await createAuthenticatedUserArchiveContext();
    const result = await deleteCollectionItem(supabase, id);

    return NextResponse.json(result);
  } catch (error) {
    return userArchiveErrorResponse(error, "Failed to delete collection item");
  }
}
