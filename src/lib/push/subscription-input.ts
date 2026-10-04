import type { PushSubscriptionInput } from "@/lib/push/types";

const BASE64_URL_PATTERN = /^[A-Za-z0-9_-]+$/;
const MAX_ENDPOINT_LENGTH = 2048;

export class PushSubscriptionValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PushSubscriptionValidationError";
  }
}

export function parsePushSubscriptionInput(
  payload: Record<string, unknown>,
): PushSubscriptionInput {
  const endpoint = parseEndpoint(payload.endpoint, "订阅地址无效");
  const expirationTime = parseExpirationTime(payload.expirationTime);
  const keys = parseKeys(payload.keys);
  const previousEndpoint =
    payload.previousEndpoint === undefined
      ? undefined
      : parseEndpoint(payload.previousEndpoint, "旧订阅地址无效");

  return {
    endpoint,
    expirationTime,
    keys,
    ...(previousEndpoint && previousEndpoint !== endpoint
      ? { previousEndpoint }
      : {}),
  };
}

export function parsePushUnsubscribeInput(payload: Record<string, unknown>) {
  return {
    endpoint: parseEndpoint(payload.endpoint, "订阅地址无效"),
  };
}

function parseEndpoint(value: unknown, message: string) {
  if (typeof value !== "string" || value.length > MAX_ENDPOINT_LENGTH) {
    throw new PushSubscriptionValidationError(message);
  }

  try {
    const url = new URL(value);

    if (url.protocol !== "https:" || url.username || url.password) {
      throw new PushSubscriptionValidationError(message);
    }

    return url.href;
  } catch (error) {
    if (error instanceof PushSubscriptionValidationError) {
      throw error;
    }

    throw new PushSubscriptionValidationError(message);
  }
}

function parseExpirationTime(value: unknown) {
  if (value === null || value === undefined) {
    return null;
  }

  if (!Number.isSafeInteger(value) || Number(value) < 0) {
    throw new PushSubscriptionValidationError("订阅过期时间无效");
  }

  return Number(value);
}

function parseKeys(value: unknown) {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new PushSubscriptionValidationError("订阅密钥无效");
  }

  const keys = value as Record<string, unknown>;
  const p256dh = parseBase64Url(keys.p256dh, 40, 256);
  const auth = parseBase64Url(keys.auth, 8, 128);

  return { auth, p256dh };
}

function parseBase64Url(value: unknown, minLength: number, maxLength: number) {
  if (
    typeof value !== "string" ||
    value.length < minLength ||
    value.length > maxLength ||
    !BASE64_URL_PATTERN.test(value)
  ) {
    throw new PushSubscriptionValidationError("订阅密钥无效");
  }

  return value;
}
