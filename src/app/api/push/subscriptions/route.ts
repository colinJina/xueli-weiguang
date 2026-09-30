import { NextResponse } from "next/server";
import type { SupabaseClient } from "@supabase/supabase-js";

import { readLimitedJsonObject, JsonRequestError } from "@/lib/http/read-limited-json";
import {
  parsePushSubscriptionInput,
  parsePushUnsubscribeInput,
  PushSubscriptionValidationError,
} from "@/lib/push/subscription-input";
import { createAdminClient } from "@/lib/supabase/admin";

const MAX_REQUEST_BYTES = 8 * 1024;
const NO_STORE_HEADERS = { "Cache-Control": "no-store" } as const;

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST(request: Request) {
  if (!isSameOriginJsonRequest(request)) {
    return jsonError("INVALID_ORIGIN", "请求来源无效。", 403);
  }

  try {
    const payload = await readLimitedJsonObject(request, MAX_REQUEST_BYTES);
    const input = parsePushSubscriptionInput(payload);
    const client = createAdminClient() as SupabaseClient;

    if (input.previousEndpoint) {
      const { error: revokeError } = await client
        .from("push_subscriptions")
        .update({
          revoked_at: new Date().toISOString(),
          status: "revoked",
        })
        .eq("endpoint", input.previousEndpoint)
        .neq("endpoint", input.endpoint);

      if (revokeError) {
        throw revokeError;
      }
    }

    const { error } = await client.from("push_subscriptions").upsert(
      {
        auth: input.keys.auth,
        consecutive_failure_count: 0,
        endpoint: input.endpoint,
        expiration_time: input.expirationTime,
        p256dh: input.keys.p256dh,
        revoked_at: null,
        status: "active",
      },
      { onConflict: "endpoint" },
    );

    if (error) {
      throw error;
    }

    return NextResponse.json(
      { subscribed: true },
      { headers: NO_STORE_HEADERS },
    );
  } catch (error) {
    return handleSubscriptionError(error);
  }
}

export async function DELETE(request: Request) {
  if (!isSameOriginJsonRequest(request)) {
    return jsonError("INVALID_ORIGIN", "请求来源无效。", 403);
  }

  try {
    const payload = await readLimitedJsonObject(request, MAX_REQUEST_BYTES);
    const input = parsePushUnsubscribeInput(payload);
    const { error } = await (createAdminClient() as SupabaseClient)
      .from("push_subscriptions")
      .update({
        revoked_at: new Date().toISOString(),
        status: "revoked",
      })
      .eq("endpoint", input.endpoint);

    if (error) {
      throw error;
    }

    return new Response(null, { status: 204, headers: NO_STORE_HEADERS });
  } catch (error) {
    return handleSubscriptionError(error);
  }
}

function isSameOriginJsonRequest(request: Request) {
  const origin = request.headers.get("origin");
  const contentType = request.headers.get("content-type")?.toLowerCase() ?? "";

  if (!contentType.startsWith("application/json")) {
    return false;
  }

  if (!origin) {
    return request.headers.get("sec-fetch-site") === "same-origin";
  }

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

function handleSubscriptionError(error: unknown) {
  if (
    error instanceof JsonRequestError ||
    error instanceof PushSubscriptionValidationError
  ) {
    return jsonError(
      "VALIDATION_FAILED",
      error.message,
      error instanceof JsonRequestError ? error.status : 400,
    );
  }

  console.error("Failed to persist browser push subscription");
  return jsonError(
    "PUSH_SUBSCRIPTION_UNAVAILABLE",
    "通知订阅暂时不可用，请稍后重试。",
    503,
  );
}

function jsonError(code: string, message: string, status: number) {
  return NextResponse.json(
    { code, message },
    { status, headers: NO_STORE_HEADERS },
  );
}
