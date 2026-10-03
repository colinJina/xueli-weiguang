import type { ArchiveFilters } from "@/lib/videos/types";

export type FilterPatch = Partial<ArchiveFilters>;

export function buildArchiveHref(filters: ArchiveFilters, patch: FilterPatch) {
  const nextFilters = {
    categoryId:
      patch.categoryId !== undefined ? patch.categoryId : filters.categoryId,
    tagIds: patch.tagIds ?? filters.tagIds,
    toneKeys: patch.toneKeys ?? filters.toneKeys,
    colors: patch.colors ?? filters.colors,
    colorMode: patch.colorMode ?? filters.colorMode,
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

  if (nextFilters.colors.length > 0) {
    params.set(
      "colors",
      nextFilters.colors
        .map(({ hex, precision }) => `${hex.slice(1)}:${precision}`)
        .join(","),
    );
  }
  if (nextFilters.colors.length > 0 || nextFilters.colorMode === "all") {
    params.set("colorMode", nextFilters.colorMode);
  }

  const query = params.toString();
  return query ? `/archive?${query}` : "/archive";
}

export function getArchivePageHref(filters: ArchiveFilters, page: number) {
  return buildArchiveHref(filters, { page });
}

export function selectSingleToneKey(
  selectedKeys: readonly string[],
  key: string,
) {
  return selectedKeys.includes(key) ? [] : [key];
}
