import { ArchiveRealtimeView } from "@/components/archive/archive-realtime-view";
import { parseArchiveFilters } from "@/lib/videos/archive-filters";
import { getVideoDictionaries } from "@/lib/videos/get-video-dictionaries";
import { getArchiveVideoFeed } from "@/lib/videos/get-video-feed";
import type {
  ArchiveDictionaries,
  ArchiveVideoFeed,
} from "@/lib/videos/types";

export const dynamic = "force-dynamic";

type ArchivePageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function ArchivePage({ searchParams }: ArchivePageProps) {
  const raw = await searchParams;
  let dictionaries: ArchiveDictionaries = { categories: [], tags: [] };
  let initialPage: ArchiveVideoFeed = {
    items: [],
    nextCursor: null,
    hasMore: false,
    filters: { ...parseArchiveFilters(raw), page: 1 },
  };
  let initialError = false;
  try {
    dictionaries = await getVideoDictionaries();
    initialPage = await getArchiveVideoFeed(raw, null, dictionaries);
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
