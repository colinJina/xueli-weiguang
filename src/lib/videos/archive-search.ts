import { ExternalVideoUrlError, parseExternalVideoUrl } from "@/lib/external-video/parse-video-url";

export const ARCHIVE_SEARCH_INTERVAL_MS = 150;
export const ARCHIVE_SEARCH_MAX_TEXT_LENGTH = 120;
export const ARCHIVE_SEARCH_MAX_TERMS = 8;
export const ARCHIVE_SEARCH_MAX_URL_LENGTH = 2048;

type SearchInput = {
  query: string;
  terms: string[];
  sourceUrl: string | null;
  error: string | null;
};

// This parser is shared by the input, API and SSR. It never resolves external URLs.
export function parseArchiveSearch(value: string): SearchInput {
  const trimmed = value.trim();
  const result: SearchInput = { query: trimmed, terms: [], sourceUrl: null, error: null };
  if (!trimmed) {
    return result;
  }
  if (/^(?:https?:\/\/)?(?:www\.)?b23\.tv(?:\/|$)/i.test(trimmed)) {
    return { ...result, error: "请使用 Bilibili 完整 PV 链接或 BV 号" };
  }
  if (/^https?:\/\//i.test(trimmed) || /^BV[0-9A-Za-z]{10}$/.test(trimmed)) {
    if (trimmed.length > ARCHIVE_SEARCH_MAX_URL_LENGTH) {
      return { ...result, error: "链接不能超过 2048 字" };
    }
    try {
      return { ...result, sourceUrl: parseExternalVideoUrl(trimmed).canonicalUrl };
    } catch (error) {
      if (!(error instanceof ExternalVideoUrlError)) {
        throw error;
      }
      return { ...result, error: "请使用 Bilibili 或 YouTube 完整 PV 链接" };
    }
  }
  const query = trimmed.normalize("NFKC").replace(/\s+/gu, " ");
  const terms = [...new Set(query.toLowerCase().split(" "))];
  if (Array.from(query).length > ARCHIVE_SEARCH_MAX_TEXT_LENGTH) {
    return { ...result, query, error: "搜索文字不能超过 120 字" };
  }
  if (query.split(" ").length > ARCHIVE_SEARCH_MAX_TERMS) {
    return { ...result, query, error: "最多输入 8 个关键词" };
  }
  return { ...result, query, terms };
}
