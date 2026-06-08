import "server-only";

function normalizeAbsoluteUrl(value: string) {
  try {
    const url = new URL(value);

    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return null;
    }

    if (url.protocol === "http:") {
      url.protocol = "https:";
    }

    return url.toString();
  } catch {
    return null;
  }
}

function normalizeCosBaseUrl() {
  const cdnDomain = process.env.COS_CDN_DOMAIN?.trim();

  if (cdnDomain) {
    const normalizedDomain =
      cdnDomain.startsWith("http://") || cdnDomain.startsWith("https://")
        ? cdnDomain
        : `https://${cdnDomain}`;

    return normalizeAbsoluteUrl(normalizedDomain)?.replace(/\/+$/, "") ?? null;
  }

  const bucket = process.env.COS_BUCKET?.trim();
  const region = process.env.COS_REGION?.trim();

  if (!bucket || !region) {
    return null;
  }

  return `https://${bucket}.cos.${region}.myqcloud.com`;
}

function encodeObjectKey(key: string) {
  return key
    .replace(/^\/+/, "")
    .split("/")
    .map((segment) => encodeURIComponent(segment))
    .join("/");
}

export function resolveCosPublicUrl(value: string | null | undefined) {
  const rawValue = value?.trim();

  if (!rawValue) {
    return null;
  }

  if (rawValue.startsWith("http://") || rawValue.startsWith("https://")) {
    return normalizeAbsoluteUrl(rawValue);
  }

  const baseUrl = normalizeCosBaseUrl();

  if (!baseUrl) {
    return null;
  }

  return `${baseUrl}/${encodeObjectKey(rawValue)}`;
}
