/// <reference lib="webworker" />

import { cacheNames, clientsClaim, setCacheNameDetails } from "workbox-core";
import { ExpirationPlugin } from "workbox-expiration";
import { CacheableResponsePlugin } from "workbox-cacheable-response";
import { cleanupOutdatedCaches, precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { CacheFirst, StaleWhileRevalidate } from "workbox-strategies";

import type { PushNotificationPayload } from "@/lib/push/types";

declare const __IS_PRODUCTION__: boolean;
declare const __VAPID_PUBLIC_KEY__: string;

declare const self: ServiceWorkerGlobalScope & {
  __WB_MANIFEST: Array<{ revision: string | null; url: string }>;
};

type SubscriptionChangeEvent = ExtendableEvent & {
  oldSubscription?: PushSubscription | null;
};

const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const VIDEO_PATH_PATTERN =
  /^\/video\/[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const NOTIFICATION_ICON = "/icons/notification-icon-192.png";
const NOTIFICATION_BADGE = "/icons/notification-badge-96.png";
const STATIC_CACHE = "xlwg-next-static-v1";
const IMAGE_CACHE = "xlwg-images-v1";

setCacheNameDetails({ prefix: "xlwg", suffix: "v1" });
precacheAndRoute(self.__WB_MANIFEST);
cleanupOutdatedCaches();
clientsClaim();

if (__IS_PRODUCTION__) {
  registerRoute(
    ({ request, sameOrigin, url }) =>
      request.method === "GET" &&
      sameOrigin &&
      url.pathname.startsWith("/_next/static/"),
    new CacheFirst({
      cacheName: STATIC_CACHE,
      plugins: [
        new CacheableResponsePlugin({ statuses: [200] }),
        new ExpirationPlugin({
          maxAgeSeconds: 365 * 24 * 60 * 60,
          maxEntries: 200,
          purgeOnQuotaError: true,
        }),
      ],
    }),
  );

  registerRoute(
    ({ request, sameOrigin, url }) =>
      request.method === "GET" &&
      sameOrigin &&
      (url.pathname === "/_next/image" || request.destination === "image"),
    new StaleWhileRevalidate({
      cacheName: IMAGE_CACHE,
      plugins: [
        new CacheableResponsePlugin({ statuses: [200] }),
        new ExpirationPlugin({
          maxAgeSeconds: 7 * 24 * 60 * 60,
          maxEntries: 80,
          purgeOnQuotaError: true,
        }),
      ],
    }),
  );
}

self.addEventListener("activate", (event) => {
  event.waitUntil(removeOldXlwgCaches());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") {
    void self.skipWaiting();
  }
});

self.addEventListener("push", (event) => {
  const payload = readPushPayload(event.data);

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      badge: NOTIFICATION_BADGE,
      body: payload.body,
      data: {
        broadcastId: payload.broadcastId,
        url: payload.url,
        videoId: payload.videoId,
      },
      icon: NOTIFICATION_ICON,
      requireInteraction: false,
      tag: payload.tag,
    }),
  );
});

self.addEventListener("notificationclick", (event) => {
  event.notification.close();

  const rawUrl = event.notification.data?.url;
  const targetPath =
    typeof rawUrl === "string" &&
    (rawUrl === "/" || VIDEO_PATH_PATTERN.test(rawUrl))
      ? rawUrl
      : "/";

  event.waitUntil(focusOrOpenWindow(targetPath));
});

self.addEventListener("pushsubscriptionchange", (rawEvent) => {
  const event = rawEvent as SubscriptionChangeEvent;
  event.waitUntil(refreshPushSubscription(event.oldSubscription ?? null));
});

function readPushPayload(data: PushMessageData | null): PushNotificationPayload {
  if (data) {
    try {
      const value = data.json() as unknown;

      if (isPushNotificationPayload(value)) {
        return value;
      }
    } catch {
      // Fall through to a safe same-origin notification.
    }
  }

  return {
    badge: NOTIFICATION_BADGE,
    body: "有新作品公开，点击查看",
    broadcastId: "00000000-0000-4000-8000-000000000000",
    icon: NOTIFICATION_ICON,
    tag: "video:new",
    title: "雪笠微光",
    url: "/",
    version: 1,
    videoId: "00000000-0000-4000-8000-000000000000",
  };
}

function isPushNotificationPayload(
  value: unknown,
): value is PushNotificationPayload {
  if (!value || typeof value !== "object") {
    return false;
  }

  const payload = value as Partial<PushNotificationPayload>;

  return (
    payload.version === 1 &&
    typeof payload.broadcastId === "string" &&
    UUID_PATTERN.test(payload.broadcastId) &&
    typeof payload.videoId === "string" &&
    UUID_PATTERN.test(payload.videoId) &&
    typeof payload.title === "string" &&
    payload.title.length > 0 &&
    payload.title.length <= 160 &&
    typeof payload.body === "string" &&
    payload.body.length > 0 &&
    payload.body.length <= 300 &&
    typeof payload.url === "string" &&
    VIDEO_PATH_PATTERN.test(payload.url) &&
    typeof payload.tag === "string" &&
    payload.tag === `video:${payload.videoId}`
  );
}

async function focusOrOpenWindow(targetPath: string) {
  const targetUrl = new URL(targetPath, self.location.origin).href;
  const windowClients = await self.clients.matchAll({
    includeUncontrolled: true,
    type: "window",
  });
  const existingClient = windowClients[0];

  if (existingClient) {
    await existingClient.navigate(targetUrl);
    return existingClient.focus();
  }

  return self.clients.openWindow(targetUrl);
}

async function removeOldXlwgCaches() {
  const currentCaches = new Set([
    cacheNames.precache,
    ...(__IS_PRODUCTION__ ? [STATIC_CACHE, IMAGE_CACHE] : []),
  ]);
  const existingCaches = await caches.keys();

  await Promise.all(
    existingCaches
      .filter(
        (cacheName) =>
          cacheName.startsWith("xlwg-") && !currentCaches.has(cacheName),
      )
      .map((cacheName) => caches.delete(cacheName)),
  );
}

async function refreshPushSubscription(
  previousSubscription: PushSubscription | null,
) {
  if (!__VAPID_PUBLIC_KEY__) {
    return;
  }

  const subscription = await self.registration.pushManager.subscribe({
    applicationServerKey: urlBase64ToUint8Array(__VAPID_PUBLIC_KEY__),
    userVisibleOnly: true,
  });
  const serialized = subscription.toJSON();
  const response = await fetch("/api/push/subscriptions", {
    body: JSON.stringify({
      endpoint: serialized.endpoint,
      expirationTime: serialized.expirationTime ?? null,
      keys: serialized.keys,
      previousEndpoint: previousSubscription?.endpoint,
    }),
    headers: { "Content-Type": "application/json" },
    method: "POST",
  });

  if (!response.ok) {
    await subscription.unsubscribe();
  }
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/-/g, "+")
    .replace(/_/g, "/");
  const rawData = self.atob(base64);

  return Uint8Array.from(rawData, (character) => character.charCodeAt(0));
}

export {};
