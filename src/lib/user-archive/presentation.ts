import type { UserArchiveItem } from "@/lib/user-archive/types";

/** Keep the existing order and all original membership rows outside the display list. */
export function uniqueVideos(items: readonly UserArchiveItem[]) {
  const seen = new Set<string>();
  return items.filter((item) => {
    if (seen.has(item.videoId)) {
      return false;
    }
    seen.add(item.videoId);
    return true;
  });
}

export function filterArchiveItems(
  items: readonly UserArchiveItem[],
  keyword: string,
  tagIds: readonly string[],
) {
  const query = keyword.trim().toLocaleLowerCase();
  return uniqueVideos(
    items.filter(
      (item) =>
        (!query || item.title.toLocaleLowerCase().includes(query)) &&
        tagIds.every((tagId) => item.tags.some((tag) => tag.id === tagId)),
    ),
  );
}
