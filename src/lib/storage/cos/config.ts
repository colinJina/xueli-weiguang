import "server-only";

import {
  NATIVE_COVER_MAX_BYTES,
  NATIVE_VIDEO_MAX_BYTES,
} from "@/lib/storage/types";

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
  maxCoverBytes: number;
};

function requireEnv(name: string) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new CosConfigError(`Missing ${name}`);
  }

  return value;
}

function getPositiveIntegerEnv(input: {
  name: string;
  defaultValue: number;
}) {
  const rawValue = process.env[input.name]?.trim();

  if (!rawValue) {
    return input.defaultValue;
  }

  const value = Number(rawValue);

  if (!Number.isSafeInteger(value) || value <= 0) {
    throw new CosConfigError(`${input.name} must be a positive integer`);
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
    maxBytes: getPositiveIntegerEnv({
      name: "COS_UPLOAD_MAX_BYTES",
      defaultValue: NATIVE_VIDEO_MAX_BYTES,
    }),
    maxCoverBytes: getPositiveIntegerEnv({
      name: "COS_COVER_MAX_BYTES",
      defaultValue: NATIVE_COVER_MAX_BYTES,
    }),
  };
}
