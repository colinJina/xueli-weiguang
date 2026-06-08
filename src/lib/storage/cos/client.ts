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

function createCosClient(config: CosServerConfig) {
  return new COS({
    SecretId: config.secretId,
    SecretKey: config.secretKey,
  });
}

function getHeader(headers: Record<string, unknown> | undefined, name: string) {
  if (!headers) {
    return null;
  }

  const normalizedName = name.toLowerCase();

  for (const [key, value] of Object.entries(headers)) {
    if (key.toLowerCase() === normalizedName) {
      return Array.isArray(value) ? String(value[0] ?? "") : String(value);
    }
  }

  return null;
}

function normalizeMimeType(value: string | null) {
  return value?.split(";")[0]?.trim().toLowerCase() || null;
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
  try {
    const data = await createCosClient(config).headObject({
      Bucket: config.bucket,
      Region: config.region,
      Key: key,
    });

    const contentLength = getHeader(data.headers, "content-length");
    const size = Number(contentLength);

    return {
      key,
      size: Number.isSafeInteger(size) && size >= 0 ? size : 0,
      mimeType: normalizeMimeType(getHeader(data.headers, "content-type")),
      etag: data.ETag ?? getHeader(data.headers, "etag"),
    };
  } catch (error) {
    if (isCosNotFoundError(error)) {
      throw new CosObjectNotFoundError(key);
    }

    throw error;
  }
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
