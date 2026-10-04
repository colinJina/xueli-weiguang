import type { VideoDetail } from "@/lib/videos/types";

export type VideoShareData = Pick<
  VideoDetail,
  | "id"
  | "title"
  | "storageProvider"
  | "sourceUrl"
  | "playbackUrl"
  | "coverImageUrl"
  | "description"
  | "publishedAtLabel"
  | "viewCountLabel"
  | "category"
  | "tags"
  | "tones"
>;

const SHARE_DESCRIPTION_LENGTH = 80;
const sourceNames = { bilibili: "Bilibili", youtube: "YouTube", cos: "本站上传" };

export function getVideoShareUrl(pageUrl: string, videoId: string) {
  return new URL(`/video/${encodeURIComponent(videoId)}`, new URL(pageUrl).origin).href;
}

function getPublicHttpUrl(value: string | null) {
  if (!value?.trim()) {
    return null;
  }

  try {
    const url = new URL(value.trim());
    return (url.protocol === "https:" || url.protocol === "http:") && !url.username && !url.password
      ? url.href
      : null;
  } catch {
    return null;
  }
}

export function getVideoShareSource(video: Pick<VideoShareData, "storageProvider" | "sourceUrl" | "playbackUrl">) {
  const isLocal = video.storageProvider === "cos";
  const url = getPublicHttpUrl(isLocal ? video.playbackUrl : video.sourceUrl);
  return url ? { label: isLocal ? "视频直链" : "原视频链接", url } : null;
}

export function getVideoShareSummary(video: Pick<VideoShareData, "description" | "storageProvider">) {
  const description = video.description.replace(/\s+/gu, " ").trim();
  if (!description) {
    return { label: "视频来源", text: sourceNames[video.storageProvider] };
  }

  const characters = Array.from(description);
  return {
    label: "作品简介",
    text: characters.length > SHARE_DESCRIPTION_LENGTH
      ? `${characters.slice(0, SHARE_DESCRIPTION_LENGTH).join("")}…`
      : description,
  };
}
