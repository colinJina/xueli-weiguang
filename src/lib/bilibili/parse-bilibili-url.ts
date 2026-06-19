const BVID_PATTERN = /^BV[0-9A-Za-z]{10}$/;

export class BilibiliUrlError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "BilibiliUrlError";
  }
}

function normalizeBvid(candidate: string): string | null {
  const trimmed = candidate.trim();
  return BVID_PATTERN.test(trimmed) ? trimmed : null;
}

function buildCanonicalUrl(bvid: string): string {
  return `https://www.bilibili.com/video/${bvid}`;
}

function extractBvidFromUrl(url: URL): string | null {
  const pathname = url.pathname.replace(/\/+$/, "");
  const segments = pathname.split("/").filter(Boolean);
  const videoIndex = segments.findIndex((segment) => segment.toLowerCase() === "video");

  if (videoIndex >= 0) {
    return normalizeBvid(segments[videoIndex + 1] ?? "");
  }

  return normalizeBvid(segments[segments.length - 1] ?? "");
}

export function parseBilibiliUrl(
  input: string,
): { bvid: string; canonicalUrl: string } {
  const trimmed = input.trim();
  const directBvid = normalizeBvid(trimmed);

  if (directBvid) {
    return {
      bvid: directBvid,
      canonicalUrl: buildCanonicalUrl(directBvid),
    };
  }

  let parsed: URL;

  try {
    parsed = new URL(trimmed);
  } catch {
    throw new BilibiliUrlError("请提供有效的 Bilibili 视频链接。");
  }

  if (!/^https?:$/.test(parsed.protocol)) {
    throw new BilibiliUrlError("请提供有效的 Bilibili 视频链接。");
  }

  const hostname = parsed.hostname.toLowerCase();

  if (hostname === "bilibili.com" || hostname === "www.bilibili.com") {
    const bvid = extractBvidFromUrl(parsed);

    if (!bvid) {
      throw new BilibiliUrlError("链接中未找到有效的 BV 号。");
    }

    return {
      bvid,
      canonicalUrl: buildCanonicalUrl(bvid),
    };
  }

  throw new BilibiliUrlError("当前仅支持 Bilibili 视频链接。");
}
