import { NextResponse } from "next/server";

import { createCollection } from "@/lib/user-archive/mutations";
import {
  createAuthenticatedUserArchiveContext,
  readJsonObject,
  userArchiveErrorResponse,
} from "@/lib/user-archive/route-helpers";

export async function POST(request: Request) {
  try {
    const { supabase, user } = await createAuthenticatedUserArchiveContext();
    const payload = await readJsonObject(request);
    const result = await createCollection(supabase, user.id, payload);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return userArchiveErrorResponse(error, "Failed to create user collection");
  }
}
