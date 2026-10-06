import COS from "cos-nodejs-sdk-v5";

import type { CosServerConfig } from "./config";

export class CosObjectNotFoundError extends Error {
  constructor(key: string) {
    super(`COS object not found: ${key}`);
    this.name = "CosObjectNotFoundError";
  }
}

export type CosObjectHead = {
  key: string;
  size: number;
  mimeType: string | null;
  etag: string | null;
};

const OBJECT_REQUEST_TIMEOUT_MS = 10_000;
const COS_DOMAIN_SUFFIXES = ["myqcloud.com", "tencentcos.cn"] as const;

class CosObjectRequestError extends Error {
  constructor(readonly status: number) {
    super(`COS object request failed with status ${status}`);
    this.name = "CosObjectRequestError";
  }
}

function createCosClient(config: CosServerConfig) {
  return new COS({
    SecretId: config.secretId,
    SecretKey: config.secretKey,
    Timeout: OBJECT_REQUEST_TIMEOUT_MS,
  });
}

function normalizeMimeType(value: string | null) {
  return value?.split(";")[0]?.trim().toLowerCase() || null;
}

function getRequestErrorCode(error: unknown): string {
  if (error instanceof CosObjectRequestError) {
    return `HTTP_${error.status}`;
  }
  const cause = error instanceof Error ? error.cause : null;
  if (cause && typeof cause === "object" && "code" in cause && typeof cause.code === "string") {
    return cause.code;
  }
  if (error && typeof error === "object" && "code" in error && typeof error.code === "string") {
    return error.code;
  }
  return error instanceof Error ? error.name : "UNKNOWN";
}

function isCosNotFoundError(error: unknown) {
  if (!error || typeof error !== "object") {
    return false;
  }

  const maybeError = error as { code?: unknown; statusCode?: unknown };

  return maybeError.code === "NoSuchKey" || maybeError.statusCode === 404;
}

export async function headCosObject(
  config: CosServerConfig,
  key: string,
): Promise<CosObjectHead> {
  let lastError: unknown;

  // Use native fetch for HEAD instead of the SDK's legacy request transport.
  // Each origin gets its own Host signature; never follow a signed redirect.
  for (const suffix of COS_DOMAIN_SUFFIXES) {
    const host = `${config.bucket}.cos.${config.region}.${suffix}`;
    const path = key.split("/").map(encodeURIComponent).join("/");
    const authorization = COS.getAuthorization({
      SecretId: config.secretId,
      SecretKey: config.secretKey,
      // SDK 2.15.4 handles HEAD but omits it from its Method declaration.
      Method: "HEAD" as COS.StaticGetAuthorizationOptions["Method"],
      Key: key,
      Headers: { host },
      Expires: 60,
    });

    const startedAt = Date.now();
    try {
      const response = await fetch(`https://${host}/${path}`, {
        method: "HEAD",
        headers: { Authorization: authorization },
        cache: "no-store",
        redirect: "error",
        signal: AbortSignal.timeout(OBJECT_REQUEST_TIMEOUT_MS),
      });

      if (response.status === 404) {
        throw new CosObjectNotFoundError(key);
      }
      if (!response.ok) {
        throw new CosObjectRequestError(response.status);
      }

      const size = Number(response.headers.get("content-length"));
      return {
        key,
        size: Number.isSafeInteger(size) && size >= 0 ? size : 0,
        mimeType: normalizeMimeType(response.headers.get("content-type")),
        etag: response.headers.get("etag"),
      };
    } catch (error) {
      console.warn("COS object HEAD failed", {
        host,
        executionRegion: process.env.VERCEL_REGION ?? null,
        elapsedMs: Date.now() - startedAt,
        code: getRequestErrorCode(error),
      });
      if (
        error instanceof CosObjectNotFoundError ||
        (error instanceof CosObjectRequestError && error.status < 500)
      ) {
        throw error;
      }
      lastError = error;
    }
  }

  throw lastError;
}

export async function deleteCosObject(config: CosServerConfig, key: string) {
  try {
    await createCosClient(config).deleteObject({
      Bucket: config.bucket,
      Region: config.region,
      Key: key,
    });
  } catch (error) {
    if (!isCosNotFoundError(error)) {
      throw error;
    }
  }
}
