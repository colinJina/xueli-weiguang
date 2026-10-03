import { ArchiveRealtimeView } from "@/components/archive/archive-realtime-view";
import { parseArchiveFilters } from "@/lib/videos/archive-filters";
import { getVideoDictionaries } from "@/lib/videos/get-video-dictionaries";
import { getArchiveVideos } from "@/lib/videos/get-videos";
import type {
  ArchiveDictionaries,
  ArchiveVideosPage,
} from "@/lib/videos/types";

export const dynamic = "force-dynamic";

type ArchivePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ArchivePage({ searchParams }: ArchivePageProps) {
  const raw = await searchParams;
  let dictionaries: ArchiveDictionaries = { categories: [], tags: [] };
  let initialPage: ArchiveVideosPage = {
    items: [],
    totalCount: 0,
    pageCount: 1,
    filters: parseArchiveFilters(raw),
  };
  let initialError = false;
  try {
    dictionaries = await getVideoDictionaries();
    const result = await getArchiveVideos(raw, dictionaries);
    initialPage = {
      items: result.items,
      totalCount: result.totalCount,
      pageCount: result.pageCount,
      filters: result.filters,
    };
  } catch (error) {
    console.error("Archive initial query failed", error);
    initialError = true;
  }
  return (
    <ArchiveRealtimeView
      dictionaries={dictionaries}
      initialError={initialError}
      initialPage={initialPage}
    />
  );
}
