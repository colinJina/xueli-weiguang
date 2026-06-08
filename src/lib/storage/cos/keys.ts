import type {
  NativeCoverMimeType,
  NativeVideoMimeType,
} from "@/lib/storage/types";

const videoExtensions: Record<NativeVideoMimeType, string> = {
  "video/mp4": "mp4",
  "video/webm": "webm",
};

const coverExtensions: Record<NativeCoverMimeType, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export type NativeCosObjectKeys = {
  prefix: string;
  videoKey: string;
  coverKey: string;
};

export function getNativeCosObjectKeys(input: {
  userId: string;
  submissionId: string;
  videoMimeType: NativeVideoMimeType;
  coverMimeType: NativeCoverMimeType;
}): NativeCosObjectKeys {
  const prefix = `submissions/${input.userId}/${input.submissionId}`;

  return {
    prefix,
    videoKey: `${prefix}/video.${videoExtensions[input.videoMimeType]}`,
    coverKey: `${prefix}/cover.${coverExtensions[input.coverMimeType]}`,
  };
}
