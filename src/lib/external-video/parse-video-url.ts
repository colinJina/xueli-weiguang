import {
  BilibiliUrlError,
  parseBilibiliUrl,
} from "../bilibili/parse-bilibili-url";
import {
  parseYouTubeUrl,
  YouTubeUrlError,
} from "../youtube/parse-youtube-url";

export type ExternalVideoPlatform = "bilibili" | "youtube";

export type ParsedExternalVideoUrl = {
  platform: ExternalVideoPlatform;
  externalId: string;
  canonicalUrl: string;
};

export class ExternalVideoUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExternalVideoUrlError";
  }
}

export function parseExternalVideoUrl(
  input: string,
): ParsedExternalVideoUrl {
  const trimmed = input.trim();

  try {
    const { videoId, canonicalUrl } = parseYouTubeUrl(trimmed);

    return {
      platform: "youtube",
      externalId: videoId,
      canonicalUrl,
    };
  } catch (error) {
    if (!(error instanceof YouTubeUrlError)) {
      throw error;
    }
  }

  try {
    const { bvid, canonicalUrl } = parseBilibiliUrl(trimmed);

    return {
      platform: "bilibili",
      externalId: bvid,
      canonicalUrl,
    };
  } catch (error) {
    if (error instanceof BilibiliUrlError) {
      throw new ExternalVideoUrlError("当前仅支持 Bilibili 或 YouTube 视频链接。");
    }

    throw error;
  }
}
