import { NextResponse } from "next/server";

import { deleteCollection, updateCollection } from "@/lib/user-archive/mutations";
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
    const result = await updateCollection(supabase, id, payload);

    return NextResponse.json(result);
  } catch (error) {
    return userArchiveErrorResponse(error, "Failed to update user collection");
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { supabase } = await createAuthenticatedUserArchiveContext();
    const result = await deleteCollection(supabase, id);

    return NextResponse.json(result);
  } catch (error) {
    return userArchiveErrorResponse(error, "Failed to delete user collection");
  }
}
