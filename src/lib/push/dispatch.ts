import "server-only";

import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";
import webPush, { WebPushError } from "web-push";

import type { PushNotificationPayload } from "@/lib/push/types";
import { createAdminClient } from "@/lib/supabase/admin";

const BROADCAST_LEASE_SECONDS = 120;
const DELIVERY_BATCH_SIZE = 100;
const DELIVERY_CONCURRENCY = 10;
const DISPATCH_TIME_BUDGET_MS = 45_000;
const MAX_BROADCASTS_PER_RUN = 5;
const PUSH_TTL_SECONDS = 24 * 60 * 60;
const RETRY_DELAYS_SECONDS = [60, 5 * 60, 30 * 60, 2 * 60 * 60, 12 * 60 * 60] as const;

type ClaimedBroadcast = {
  body_snapshot: string;
  created_at: string;
  expanded_at: string | null;
  id: string;
  target_url: `/video/${string}`;
  title_snapshot: string;
  video_id: string;
};

type ClaimedDelivery = {
  attempt_count: number;
  auth: string;
  broadcast_id: string;
  endpoint: string;
  expiration_time: number | null;
  p256dh: string;
  subscription_id: string;
};

type DeliveryOutcome = {
  errorCode: string | null;
  globalConfigurationFailure: boolean;
  outcome: "sent" | "retry" | "dead";
  retryAfterSeconds: number;
  revokeSubscription: boolean;
  statusCode: number | null;
};

export type PushDispatchSummary = {
  broadcastsClaimed: number;
  deliveriesClaimed: number;
  deliveriesDead: number;
  deliveriesRetried: number;
  deliveriesSent: number;
  disabled: boolean;
  stoppedForConfigurationError: boolean;
};

export async function dispatchBrowserPush(): Promise<PushDispatchSummary> {
  const summary: PushDispatchSummary = {
    broadcastsClaimed: 0,
    deliveriesClaimed: 0,
    deliveriesDead: 0,
    deliveriesRetried: 0,
    deliveriesSent: 0,
    disabled: process.env.NEXT_PUBLIC_PUSH_ENABLED !== "true",
    stoppedForConfigurationError: false,
  };

  if (summary.disabled) {
    return summary;
  }

  const config = readPushServerConfig();
  const client = createAdminClient() as SupabaseClient;
  const deadline = Date.now() + DISPATCH_TIME_BUDGET_MS;

  webPush.setVapidDetails(
    config.vapidSubject,
    config.vapidPublicKey,
    config.vapidPrivateKey,
  );

  while (
    Date.now() < deadline &&
    summary.broadcastsClaimed < MAX_BROADCASTS_PER_RUN &&
    !summary.stoppedForConfigurationError
  ) {
    const leaseToken = randomUUID();
    const broadcast = await claimBroadcast(client, leaseToken);

    if (!broadcast) {
      break;
    }

    summary.broadcastsClaimed += 1;
    const isPublished = await isVideoPublished(client, broadcast.video_id);

    if (!isPublished) {
      await callRpc(client, "cancel_push_broadcast", {
        p_broadcast_id: broadcast.id,
        p_lease_token: leaseToken,
        p_reason: "video_unpublished",
      });
      continue;
    }

    await callRpc(client, "expand_push_broadcast", {
      p_broadcast_id: broadcast.id,
      p_lease_token: leaseToken,
    });

    while (Date.now() < deadline) {
      const deliveries = await claimDeliveries(
        client,
        broadcast.id,
        leaseToken,
      );

      if (deliveries.length === 0) {
        break;
      }

      summary.deliveriesClaimed += deliveries.length;

      for (
        let offset = 0;
        offset < deliveries.length;
        offset += DELIVERY_CONCURRENCY
      ) {
        const chunk = deliveries.slice(offset, offset + DELIVERY_CONCURRENCY);
        const results = await Promise.all(
          chunk.map((delivery) =>
            sendDelivery(client, broadcast, delivery, leaseToken),
          ),
        );

        for (const result of results) {
          if (result.outcome === "sent") {
            summary.deliveriesSent += 1;
          } else if (result.outcome === "retry") {
            summary.deliveriesRetried += 1;
          } else {
            summary.deliveriesDead += 1;
          }

          if (result.globalConfigurationFailure) {
            summary.stoppedForConfigurationError = true;
          }
        }

        if (summary.stoppedForConfigurationError || Date.now() >= deadline) {
          break;
        }
      }

      if (summary.stoppedForConfigurationError) {
        break;
      }
    }

    await callRpc(client, "finalize_push_broadcast", {
      p_broadcast_id: broadcast.id,
      p_lease_token: leaseToken,
    });
  }

  await cleanupExpiredPushData(client);
  return summary;
}

function readPushServerConfig() {
  const vapidPublicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim();
  const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY?.trim();
  const vapidSubject = process.env.VAPID_SUBJECT?.trim();

  if (!vapidPublicKey || !vapidPrivateKey || !vapidSubject) {
    throw new Error("Missing browser push VAPID configuration.");
  }

  if (!/^(mailto:|https:\/\/)/.test(vapidSubject)) {
    throw new Error("VAPID_SUBJECT must use mailto: or https://.");
  }

  return { vapidPrivateKey, vapidPublicKey, vapidSubject };
}

async function claimBroadcast(
  client: SupabaseClient,
  leaseToken: string,
) {
  const rows = await callRpc<ClaimedBroadcast[]>(client, "claim_push_broadcasts", {
    p_lease_seconds: BROADCAST_LEASE_SECONDS,
    p_lease_token: leaseToken,
    p_limit: 1,
  });

  return rows[0] ?? null;
}

async function claimDeliveries(
  client: SupabaseClient,
  broadcastId: string,
  leaseToken: string,
) {
  return callRpc<ClaimedDelivery[]>(client, "claim_push_deliveries", {
    p_batch_size: DELIVERY_BATCH_SIZE,
    p_broadcast_id: broadcastId,
    p_lease_seconds: BROADCAST_LEASE_SECONDS,
    p_lease_token: leaseToken,
  });
}

async function isVideoPublished(
  client: SupabaseClient,
  videoId: string,
) {
  const { data, error } = await client
    .from("videos")
    .select("published_at")
    .eq("id", videoId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return Boolean(data?.published_at);
}

async function sendDelivery(
  client: SupabaseClient,
  broadcast: ClaimedBroadcast,
  delivery: ClaimedDelivery,
  leaseToken: string,
) {
  const payload: PushNotificationPayload = {
    badge: "/icons/notification-badge-96.png",
    body: broadcast.body_snapshot,
    broadcastId: broadcast.id,
    icon: "/icons/notification-icon-192.png",
    tag: `video:${broadcast.video_id}`,
    title: "雪笠微光 · 新 PV 已收录",
    url: broadcast.target_url,
    version: 1,
    videoId: broadcast.video_id,
  };
  let result: DeliveryOutcome;

  try {
    const response = await webPush.sendNotification(
      {
        endpoint: delivery.endpoint,
        expirationTime: delivery.expiration_time,
        keys: { auth: delivery.auth, p256dh: delivery.p256dh },
      },
      JSON.stringify(payload),
      {
        TTL: PUSH_TTL_SECONDS,
        timeout: 10_000,
        topic: broadcast.video_id.replaceAll("-", ""),
        urgency: "normal",
      },
    );

    result = {
      errorCode: null,
      globalConfigurationFailure: false,
      outcome: "sent",
      retryAfterSeconds: 60,
      revokeSubscription: false,
      statusCode: response.statusCode,
    };
  } catch (error) {
    result = classifyPushFailure(error, delivery.attempt_count);
  }

  await callRpc(client, "finish_push_delivery", {
    p_broadcast_id: broadcast.id,
    p_error_code: result.errorCode,
    p_lease_token: leaseToken,
    p_outcome: result.outcome,
    p_retry_after_seconds: result.retryAfterSeconds,
    p_revoke_subscription: result.revokeSubscription,
    p_status_code: result.statusCode,
    p_subscription_id: delivery.subscription_id,
  });

  return result;
}

function classifyPushFailure(
  error: unknown,
  attemptCount: number,
): DeliveryOutcome {
  const retryAfterSeconds = getRetryDelaySeconds(error, attemptCount);

  if (error instanceof WebPushError) {
    const statusCode = error.statusCode;

    if (statusCode === 404 || statusCode === 410) {
      return {
        errorCode: "subscription_gone",
        globalConfigurationFailure: false,
        outcome: "dead",
        retryAfterSeconds,
        revokeSubscription: true,
        statusCode,
      };
    }

    if (statusCode === 401 || statusCode === 403) {
      return {
        errorCode: "vapid_configuration",
        globalConfigurationFailure: true,
        outcome: "retry",
        retryAfterSeconds,
        revokeSubscription: false,
        statusCode,
      };
    }

    if (statusCode === 429 || statusCode >= 500) {
      return {
        errorCode: statusCode === 429 ? "push_rate_limited" : "push_service_error",
        globalConfigurationFailure: false,
        outcome: "retry",
        retryAfterSeconds,
        revokeSubscription: false,
        statusCode,
      };
    }

    return {
      errorCode: "push_request_rejected",
      globalConfigurationFailure: false,
      outcome: "dead",
      retryAfterSeconds,
      revokeSubscription: false,
      statusCode,
    };
  }

  return {
    errorCode: "push_network_error",
    globalConfigurationFailure: false,
    outcome: "retry",
    retryAfterSeconds,
    revokeSubscription: false,
    statusCode: null,
  };
}

function getRetryDelaySeconds(error: unknown, attemptCount: number) {
  if (error instanceof WebPushError) {
    const retryAfter = error.headers["retry-after"];
    const rawValue = Array.isArray(retryAfter) ? retryAfter[0] : retryAfter;
    const parsedSeconds = rawValue ? Number.parseInt(rawValue, 10) : Number.NaN;

    if (Number.isFinite(parsedSeconds) && parsedSeconds > 0) {
      return Math.min(parsedSeconds, 24 * 60 * 60);
    }
  }

  return RETRY_DELAYS_SECONDS[
    Math.min(Math.max(attemptCount - 1, 0), RETRY_DELAYS_SECONDS.length - 1)
  ];
}

async function cleanupExpiredPushData(
  client: SupabaseClient,
) {
  const now = Date.now();
  await callRpc(client, "cleanup_browser_push_data", {
    p_broadcast_before: new Date(now - 90 * 24 * 60 * 60 * 1000).toISOString(),
    p_limit: 1000,
    p_revoked_before: new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString(),
  });
}

async function callRpc<T = unknown>(
  client: SupabaseClient,
  functionName: string,
  parameters: Record<string, unknown>,
) {
  const { data, error } = await client.rpc(functionName, parameters);

  if (error) {
    throw error;
  }

  return data as T;
}
