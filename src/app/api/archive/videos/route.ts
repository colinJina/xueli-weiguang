import {
  parseArchiveFilters,
  validateArchiveSearchParams,
} from "@/lib/videos/archive-filters";
import { getArchiveVideos } from "@/lib/videos/get-videos";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "no-store" };

export async function GET(request: Request) {
  const params = new URL(request.url).searchParams;
  if (!validateArchiveSearchParams(params)) {
    return Response.json(
      {
        code: "VALIDATION_FAILED",
        message: "筛选条件格式有误，请调整后重试。",
      },
      { status: 400, headers },
    );
  }
  const raw = Object.fromEntries(params);
  try {
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
        message: "暂时无法更新作品，请重试。",
        filters: parseArchiveFilters(raw),
      },
      { status: 503, headers },
    );
  }
}
