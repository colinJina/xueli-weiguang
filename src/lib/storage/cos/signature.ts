import * as STS from "qcloud-cos-sts";

import type {
  CosUploadCredential,
  NativeCoverMimeType,
  NativeVideoMimeType,
} from "@/lib/storage/types";

import type { CosServerConfig } from "./config";

const UPLOAD_CREDENTIAL_DURATION_SECONDS = 30 * 60;
const PUT_OBJECT_ACTION = "name/cos:PutObject";

type PutObjectPolicy = {
  version: "2.0";
  statement: Array<{
    action: typeof PUT_OBJECT_ACTION;
    effect: "allow";
    principal: { qcs: "*" };
    resource: string[];
    condition: {
      numeric_less_than_equal: {
        "cos:content-length": number;
      };
      string_equal: {
        "cos:content-type": NativeVideoMimeType | NativeCoverMimeType;
      };
    };
  }>;
};

function getBucketResourceParts(bucket: string) {
  const appIdStart = bucket.lastIndexOf("-");

  if (appIdStart <= 0 || appIdStart === bucket.length - 1) {
    throw new Error("COS_BUCKET must include an app id suffix.");
  }

  return {
    appId: bucket.slice(appIdStart + 1),
  };
}

function getObjectResource(config: CosServerConfig, key: string) {
  const { appId } = getBucketResourceParts(config.bucket);

  return `qcs::cos:${config.region}:uid/${appId}:${config.bucket}/${key}`;
}

function assertKeyInPrefix(input: { key: string; allowPrefix: string }) {
  if (!input.key.startsWith(`${input.allowPrefix}/`)) {
    throw new Error("COS upload key must stay inside allowPrefix.");
  }
}

function createPutObjectPolicy(input: {
  config: CosServerConfig;
  allowPrefix: string;
  videoKey: string;
  coverKey: string;
  maxBytes: number;
  videoMimeType: NativeVideoMimeType;
  coverMimeType: NativeCoverMimeType;
}): PutObjectPolicy {
  assertKeyInPrefix({ key: input.videoKey, allowPrefix: input.allowPrefix });
  assertKeyInPrefix({ key: input.coverKey, allowPrefix: input.allowPrefix });

  return {
    version: "2.0",
    statement: [
      {
        action: PUT_OBJECT_ACTION,
        effect: "allow",
        principal: { qcs: "*" },
        resource: [getObjectResource(input.config, input.videoKey)],
        condition: {
          numeric_less_than_equal: {
            "cos:content-length": input.maxBytes,
          },
          string_equal: {
            "cos:content-type": input.videoMimeType,
          },
        },
      },
      {
        action: PUT_OBJECT_ACTION,
        effect: "allow",
        principal: { qcs: "*" },
        resource: [getObjectResource(input.config, input.coverKey)],
        condition: {
          numeric_less_than_equal: {
            "cos:content-length": input.maxBytes,
          },
          string_equal: {
            "cos:content-type": input.coverMimeType,
          },
        },
      },
    ],
  };
}

export async function createCosUploadCredential(input: {
  config: CosServerConfig;
  allowPrefix: string;
  videoKey: string;
  coverKey: string;
  maxBytes: number;
  videoMimeType: NativeVideoMimeType;
  coverMimeType: NativeCoverMimeType;
}): Promise<CosUploadCredential> {
  const policy = createPutObjectPolicy(input);

  const data = await STS.getCredential({
    secretId: input.config.secretId,
    secretKey: input.config.secretKey,
    policy,
    durationSeconds: UPLOAD_CREDENTIAL_DURATION_SECONDS,
  });

  return {
    tmpSecretId: data.credentials.tmpSecretId,
    tmpSecretKey: data.credentials.tmpSecretKey,
    sessionToken: data.credentials.sessionToken,
    startTime: data.startTime,
    expiredTime: data.expiredTime,
  };
}
