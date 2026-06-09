import { createHash, randomBytes } from "crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

import { createAdminClient } from "@/lib/supabase/admin";
import { formatCompactNumber } from "@/lib/videos/metrics";
import { isVideoId, normalizeMetricCount } from "@/lib/videos/video-interactions";
import type { VideoInteractionErrorCode, VideoViewResponse } from "@/lib/videos/types";

export const runtime = "nodejs";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type VideoRow = {
  id: string;
  storage_provider: string | null;
  published_at: string | null;
  view_count: number | string;
};

type RecordViewResult = {
  counted?: boolean;
  view_count?: number | string | null;
};

type RecordViewRpcClient = {
  rpc: (
    functionName: "record_cos_video_view",
    args: {
      target_video_id: string;
      target_viewer_hash: string;
    },
  ) => Promise<{
    data: unknown;
    error: {
      code?: string;
      details?: string;
      hint?: string;
      message: string;
    } | null;
  }>;
};

const VIEWER_COOKIE_NAME = "xlwg_viewer_id";
const VIEWER_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
const VIEWER_ID_PATTERN = /^[A-Za-z0-9_-]{32,}$/;

function interactionError(
  code: VideoInteractionErrorCode,
  message: string,
  status: number,
) {
  return NextResponse.json({ code, message }, { status });
}

function createViewerId() {
  return randomBytes(24).toString("base64url");
}

async function getViewerId() {
  const cookieStore = await cookies();
  const existingValue = cookieStore.get(VIEWER_COOKIE_NAME)?.value;

  if (existingValue && VIEWER_ID_PATTERN.test(existingValue)) {
    return existingValue;
  }

  const nextValue = createViewerId();

  cookieStore.set(VIEWER_COOKIE_NAME, nextValue, {
    httpOnly: true,
    maxAge: VIEWER_COOKIE_MAX_AGE_SECONDS,
    path: "/",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return nextValue;
}

function createViewerHash(videoId: string, viewerId: string) {
  return createHash("sha256").update(`${videoId}:${viewerId}`).digest("hex");
}

export async function POST(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  if (!isVideoId(id)) {
    return interactionError(
      "VALIDATION_FAILED",
      "视频标识无效，请刷新后再试。",
      400,
    );
  }

  const adminClient = createAdminClient();
  const { data: video, error: videoError } = await adminClient
    .from("videos")
    .select("id,storage_provider,published_at,view_count")
    .eq("id", id)
    .maybeSingle();

  if (videoError) {
    console.error("Failed to load video before recording view", videoError);
    return interactionError(
      "METRICS_UNAVAILABLE",
      "播放数据暂时无法记录，请稍后再试。",
      503,
    );
  }

  const videoRow = video as VideoRow | null;

  if (!videoRow || !videoRow.published_at) {
    return interactionError("VIDEO_NOT_FOUND", "视频不存在或尚未公开。", 404);
  }

  if (videoRow.storage_provider !== "cos") {
    return interactionError(
      "INTERACTION_UNAVAILABLE",
      "该视频暂不支持站内播放统计。",
      409,
    );
  }

  const viewerId = await getViewerId();
  const viewerHash = createViewerHash(id, viewerId);
  const { data, error } = await (adminClient as unknown as RecordViewRpcClient).rpc(
    "record_cos_video_view",
    {
      target_video_id: id,
      target_viewer_hash: viewerHash,
    },
  );

  if (error) {
    console.error("Failed to record video view", error);
    return interactionError(
      "METRICS_UNAVAILABLE",
      "播放数据暂时无法记录，请稍后再试。",
      503,
    );
  }

  const firstRow = Array.isArray(data) ? (data[0] as RecordViewResult | undefined) : null;
  const viewCount = normalizeMetricCount(firstRow?.view_count ?? videoRow.view_count);
  const response: VideoViewResponse = {
    counted: Boolean(firstRow?.counted),
    viewCount,
    viewCountLabel: formatCompactNumber(viewCount),
  };

  return NextResponse.json(response);
}
