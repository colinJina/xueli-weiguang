import {
  parseArchiveFilters,
  validateArchiveSearchParams,
} from "@/lib/videos/archive-filters";
import { getArchiveVideos } from "@/lib/videos/get-videos";
import { parseArchiveCursor } from "@/lib/videos/archive-cursor";
import { getArchiveVideoFeed } from "@/lib/videos/get-video-feed";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  const stream = params.get("stream");
  const cursorValue = params.get("cursor");
  const cursor = parseArchiveCursor(cursorValue);
  if (!validateArchiveSearchParams(params) || params.getAll("stream").length > 1 || params.getAll("cursor").length > 1 || (stream !== null && stream !== "1") || (cursorValue !== null && (stream !== "1" || !cursor))) {
    return Response.json(
      {
        code: "VALIDATION_FAILED",
        message: "筛选条件格式有误，请调整后重试",
      },
      { status: 400, headers },
    );
  }
  const raw = Object.fromEntries(params);
  try {
    if (stream === "1") {
      const feed = await getArchiveVideoFeed(raw, cursor, undefined, request.signal);
      return Response.json(feed, { headers });
    }
    const { items, totalCount, pageCount, filters } = await getArchiveVideos(
      raw,
      undefined,
      request.signal,
    );
    return Response.json(
      { items, totalCount, pageCount, filters },
      { headers },
    );
  } catch (error) {
    if (!request.signal.aborted) {
      console.error("Archive query failed", error);
    }
    return Response.json(
      {
        code: "ARCHIVE_UNAVAILABLE",
        message: "暂时无法更新 PV，请重试",
        filters: parseArchiveFilters(raw),
      },
      { status: 503, headers },
    );
  }
}
