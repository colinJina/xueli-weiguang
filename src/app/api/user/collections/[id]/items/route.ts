import { NextResponse } from "next/server";

import { createCollectionItem } from "@/lib/user-archive/mutations";
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

export async function POST(request: Request, { params }: RouteContext) {
  try {
    const { id } = await params;
    const { supabase, user } = await createAuthenticatedUserArchiveContext();
    const payload = await readJsonObject(request);
    const result = await createCollectionItem(supabase, user.id, id, payload);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return userArchiveErrorResponse(error, "Failed to create collection item");
  }
}
