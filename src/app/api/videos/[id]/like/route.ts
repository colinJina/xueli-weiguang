import { NextResponse } from "next/server";

import { createClient } from "@/lib/supabase/server";
import { formatCompactNumber } from "@/lib/videos/metrics";
import { isVideoId, normalizeMetricCount } from "@/lib/videos/video-interactions";
import type { VideoInteractionErrorCode, VideoLikeResponse } from "@/lib/videos/types";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

type VideoRow = {
  id: string;
  storage_provider: string | null;
  published_at: string | null;
  like_count: number | string;
};

function interactionError(
  code: VideoInteractionErrorCode,
  message: string,
  status: number,
) {
  return NextResponse.json({ code, message }, { status });
}

function createLikeResponse(
  liked: boolean,
  likeCount: number | string | null | undefined,
): VideoLikeResponse {
  const normalizedLikeCount = normalizeMetricCount(likeCount);

  return {
    liked,
    likeCount: normalizedLikeCount,
    likeCountLabel: formatCompactNumber(normalizedLikeCount),
  };
}

async function loadPublishedVideo(id: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("videos")
    .select("id,storage_provider,published_at,like_count")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return {
    supabase,
    video: data as VideoRow | null,
  };
}

export async function GET(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  if (!isVideoId(id)) {
    return interactionError(
      "VALIDATION_FAILED",
      "视频标识无效，请刷新后再试。",
      400,
    );
  }

  try {
    const { supabase, video } = await loadPublishedVideo(id);

    if (!video || !video.published_at) {
      return interactionError("VIDEO_NOT_FOUND", "视频不存在或尚未公开。", 404);
    }

    if (video.storage_provider !== "cos") {
      return interactionError(
        "INTERACTION_UNAVAILABLE",
        "该视频暂不支持站内点赞。",
        409,
      );
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(createLikeResponse(false, video.like_count));
    }

    const { data: like, error } = await supabase
      .from("video_likes")
      .select("video_id")
      .eq("video_id", id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (error) {
      console.error("Failed to load video like state", error);
      return interactionError(
        "METRICS_UNAVAILABLE",
        "点赞状态暂时无法读取，请稍后再试。",
        503,
      );
    }

    return NextResponse.json(createLikeResponse(Boolean(like), video.like_count));
  } catch (error) {
    console.error("Failed to prepare video like state", error);
    return interactionError(
      "METRICS_UNAVAILABLE",
      "点赞状态暂时无法读取，请稍后再试。",
      503,
    );
  }
}

export async function PUT(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  if (!isVideoId(id)) {
    return interactionError(
      "VALIDATION_FAILED",
      "视频标识无效，请刷新后再试。",
      400,
    );
  }

  try {
    const { supabase, video } = await loadPublishedVideo(id);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return interactionError("UNAUTHENTICATED", "请先登录后再点赞。", 401);
    }

    if (!video || !video.published_at) {
      return interactionError("VIDEO_NOT_FOUND", "视频不存在或尚未公开。", 404);
    }

    if (video.storage_provider !== "cos") {
      return interactionError(
        "INTERACTION_UNAVAILABLE",
        "该视频暂不支持站内点赞。",
        409,
      );
    }

    const { error } = await supabase.from("video_likes").insert({
      user_id: user.id,
      video_id: id,
    });

    if (error && error.code !== "23505") {
      console.error("Failed to like video", error);
      return interactionError(
        "METRICS_UNAVAILABLE",
        "点赞暂时无法保存，请稍后再试。",
        503,
      );
    }

    const { data: nextVideo, error: nextVideoError } = await supabase
      .from("videos")
      .select("like_count")
      .eq("id", id)
      .maybeSingle();

    if (nextVideoError) {
      console.error("Failed to reload like count", nextVideoError);
      return interactionError(
        "METRICS_UNAVAILABLE",
        "点赞已提交，但计数暂时无法刷新。",
        503,
      );
    }

    return NextResponse.json(
      createLikeResponse(true, (nextVideo as Pick<VideoRow, "like_count"> | null)?.like_count),
    );
  } catch (error) {
    console.error("Failed to like video", error);
    return interactionError(
      "METRICS_UNAVAILABLE",
      "点赞暂时无法保存，请稍后再试。",
      503,
    );
  }
}

export async function DELETE(_request: Request, { params }: RouteContext) {
  const { id } = await params;

  if (!isVideoId(id)) {
    return interactionError(
      "VALIDATION_FAILED",
      "视频标识无效，请刷新后再试。",
      400,
    );
  }

  try {
    const { supabase, video } = await loadPublishedVideo(id);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return interactionError("UNAUTHENTICATED", "请先登录后再取消点赞。", 401);
    }

    if (!video || !video.published_at) {
      return interactionError("VIDEO_NOT_FOUND", "视频不存在或尚未公开。", 404);
    }

    if (video.storage_provider !== "cos") {
      return interactionError(
        "INTERACTION_UNAVAILABLE",
        "该视频暂不支持站内点赞。",
        409,
      );
    }

    const { error } = await supabase
      .from("video_likes")
      .delete()
      .eq("video_id", id)
      .eq("user_id", user.id);

    if (error) {
      console.error("Failed to unlike video", error);
      return interactionError(
        "METRICS_UNAVAILABLE",
        "取消点赞暂时无法保存，请稍后再试。",
        503,
      );
    }

    const { data: nextVideo, error: nextVideoError } = await supabase
      .from("videos")
      .select("like_count")
      .eq("id", id)
      .maybeSingle();

    if (nextVideoError) {
      console.error("Failed to reload like count", nextVideoError);
      return interactionError(
        "METRICS_UNAVAILABLE",
        "点赞状态已更新，但计数暂时无法刷新。",
        503,
      );
    }

    return NextResponse.json(
      createLikeResponse(false, (nextVideo as Pick<VideoRow, "like_count"> | null)?.like_count),
    );
  } catch (error) {
    console.error("Failed to unlike video", error);
    return interactionError(
      "METRICS_UNAVAILABLE",
      "取消点赞暂时无法保存，请稍后再试。",
      503,
    );
  }
}
