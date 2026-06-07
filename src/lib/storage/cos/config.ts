import { NATIVE_VIDEO_MAX_BYTES } from "@/lib/storage/types";

export class CosConfigError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CosConfigError";
  }
}

export type CosServerConfig = {
  region: string;
  bucket: string;
  secretId: string;
  secretKey: string;
  cdnDomain: string | null;
  maxBytes: number;
};

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new CosConfigError(`Missing ${name}`);
  }

  return value;
}

function getUploadMaxBytes() {
  const rawValue = process.env.COS_UPLOAD_MAX_BYTES?.trim();

  if (!rawValue) {
    return NATIVE_VIDEO_MAX_BYTES;
  }

  const value = Number(rawValue);

  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new CosConfigError("COS_UPLOAD_MAX_BYTES must be a positive integer");
  }

  return value;
}

export function getCosServerConfig(): CosServerConfig {
  return {
    region: requireEnv("COS_REGION"),
    bucket: requireEnv("COS_BUCKET"),
    secretId: requireEnv("COS_SECRET_ID"),
    secretKey: requireEnv("COS_SECRET_KEY"),
    cdnDomain: process.env.COS_CDN_DOMAIN?.trim() || null,
    maxBytes: getUploadMaxBytes(),
  };
}
