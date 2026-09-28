import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";

import { dispatchBrowserPush } from "@/lib/push/dispatch";

const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

export const dynamic = "force-dynamic";
export const maxDuration = 60;
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!hasValidDispatchSecret(request)) {
    return NextResponse.json(
      { code: "UNAUTHORIZED", message: "Unauthorized." },
      { status: 401, headers: NO_STORE_HEADERS },
    );
  }

  try {
    const summary = await dispatchBrowserPush();
    return NextResponse.json(summary, { headers: NO_STORE_HEADERS });
  } catch (error) {
    console.error("Browser push dispatch failed", error);
    return NextResponse.json(
      { code: "PUSH_DISPATCH_FAILED", message: "Push dispatch failed." },
      { status: 503, headers: NO_STORE_HEADERS },
    );
  }
}

function hasValidDispatchSecret(request: Request) {
  const expectedSecret = process.env.PUSH_DISPATCH_SECRET;
  const authorization = request.headers.get("authorization");

  if (!expectedSecret || !authorization?.startsWith("Bearer ")) {
    return false;
  }

  const providedSecret = authorization.slice("Bearer ".length);
  const expectedBuffer = Buffer.from(expectedSecret);
  const providedBuffer = Buffer.from(providedSecret);

  return (
    expectedBuffer.length === providedBuffer.length &&
    timingSafeEqual(expectedBuffer, providedBuffer)
  );
}
