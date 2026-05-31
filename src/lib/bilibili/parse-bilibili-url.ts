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

async function resolveShortLink(inputUrl: URL): Promise<URL> {
  const methods: Array<"HEAD" | "GET"> = ["HEAD", "GET"];
  let lastError: unknown;

  for (const method of methods) {
    try {
      const response = await fetch(inputUrl, {
        method,
        redirect: "follow",
        headers: {
          Accept: "text/html,application/xhtml+xml",
          "User-Agent": "Mozilla/5.0 (compatible; XueliWeiguang/1.0)",
        },
      });

      return new URL(response.url);
    } catch (error) {
      lastError = error;
    }
  }

  throw new BilibiliUrlError(
    lastError instanceof Error ? lastError.message : "无法解析短链接，请稍后再试。",
  );
}

export async function parseBilibiliUrl(
  input: string,
): Promise<{ bvid: string; canonicalUrl: string }> {
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

  if (hostname === "b23.tv" || hostname === "www.b23.tv") {
    const resolved = await resolveShortLink(parsed);
    const resolvedBvid = extractBvidFromUrl(resolved);

    if (!resolvedBvid) {
      throw new BilibiliUrlError("短链接未解析到有效的视频地址。");
    }

    return {
      bvid: resolvedBvid,
      canonicalUrl: buildCanonicalUrl(resolvedBvid),
    };
  }

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
