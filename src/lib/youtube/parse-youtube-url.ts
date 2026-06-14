export type ParsedYouTubeUrl = {
  videoId: string;
  canonicalUrl: string;
};

export class YouTubeUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "YouTubeUrlError";
  }
}

const YOUTUBE_VIDEO_ID_PATTERN = /^[0-9A-Za-z_-]{11}$/;
const YOUTUBE_HOSTS = new Set([
  "youtube.com",
  "www.youtube.com",
  "m.youtube.com",
  "music.youtube.com",
  "youtube-nocookie.com",
  "www.youtube-nocookie.com",
]);
const YOUTUBE_SHORT_HOSTS = new Set(["youtu.be", "www.youtu.be"]);
const YOUTUBE_VIDEO_PATHS = new Set(["shorts", "embed"]);
const YOUTUBE_URL_ERROR_MESSAGE = "请提供有效的 YouTube 视频链接。";

function buildCanonicalUrl(videoId: string) {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

function normalizeVideoId(candidate: string | null | undefined) {
  const trimmed = candidate?.trim() ?? "";
  return YOUTUBE_VIDEO_ID_PATTERN.test(trimmed) ? trimmed : null;
}

function extractVideoId(url: URL) {
  const hostname = url.hostname.toLowerCase();
  const segments = url.pathname.split("/").filter(Boolean);

  if (YOUTUBE_SHORT_HOSTS.has(hostname)) {
    return normalizeVideoId(segments[0]);
  }

  if (!YOUTUBE_HOSTS.has(hostname)) {
    return null;
  }

  if (url.pathname === "/watch") {
    return normalizeVideoId(url.searchParams.get("v"));
  }

  const firstSegment = segments[0]?.toLowerCase();

  if (firstSegment && YOUTUBE_VIDEO_PATHS.has(firstSegment)) {
    return normalizeVideoId(segments[1]);
  }

  return null;
}

export function parseYouTubeUrl(input: string): ParsedYouTubeUrl {
  let parsed: URL;

  try {
    parsed = new URL(input.trim());
  } catch {
    throw new YouTubeUrlError(YOUTUBE_URL_ERROR_MESSAGE);
  }

  if (!/^https?:$/.test(parsed.protocol)) {
    throw new YouTubeUrlError(YOUTUBE_URL_ERROR_MESSAGE);
  }

  const videoId = extractVideoId(parsed);

  if (!videoId) {
    throw new YouTubeUrlError(YOUTUBE_URL_ERROR_MESSAGE);
  }

  return {
    videoId,
    canonicalUrl: buildCanonicalUrl(videoId),
  };
}
