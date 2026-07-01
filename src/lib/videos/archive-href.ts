import type { ArchiveFilters } from "@/lib/videos/types";

type FilterPatch = Partial<{
  categoryId: string | null;
  tagIds: string[];
  toneKeys: string[];
  page: number;
}>;

export function buildArchiveHref(filters: ArchiveFilters, patch: FilterPatch) {
  const nextFilters = {
    categoryId: patch.categoryId !== undefined ? patch.categoryId : filters.categoryId,
    tagIds: patch.tagIds ?? filters.tagIds,
    toneKeys: patch.toneKeys ?? filters.toneKeys,
    page: patch.page ?? 1,
  };
  const params = new URLSearchParams();

  if (nextFilters.categoryId) {
    params.set("category", nextFilters.categoryId);
  }

  if (nextFilters.tagIds.length > 0) {
    params.set("tags", nextFilters.tagIds.join(","));
  }

  if (nextFilters.toneKeys.length > 0) {
    params.set("tones", nextFilters.toneKeys.join(","));
  }

  if (nextFilters.page > 1) {
    params.set("page", String(nextFilters.page));
  }

  const query = params.toString();
  return query ? `/archive?${query}` : "/archive";
}

export function getArchivePageHref(filters: ArchiveFilters, page: number) {
  return buildArchiveHref(filters, { page });
}

export function selectSingleToneKey(selectedKeys: readonly string[], key: string) {
  return selectedKeys.includes(key) ? [] : [key];
}
