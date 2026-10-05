"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { requestUserArchiveMutation } from "@/lib/user-archive/client-api";
import type { UserArchiveVideoFavoriteState } from "@/lib/user-archive/types";

type FavoriteStatus = {
  videoId: string;
  userId: string;
  isFavorited: boolean | null;
  error: string | null;
};

export function useVideoFavoriteStatus(
  videoId: string,
  userId: string | undefined,
  isAuthReady: boolean,
) {
  const [status, setStatus] = useState<FavoriteStatus | null>(null);
  const requestVersionRef = useRef(0);

  useEffect(() => {
    const version = ++requestVersionRef.current;
    if (!isAuthReady || !userId) {
      setStatus(null);
      return;
    }

    const controller = new AbortController();
    setStatus({ videoId, userId, isFavorited: null, error: null });
    void requestUserArchiveMutation<UserArchiveVideoFavoriteState>(
      `/api/user/favorites/${videoId}`,
      { method: "GET", cache: "no-store", signal: controller.signal },
      "收藏状态暂时无法加载，点击收藏重试",
    )
      .then((result) => {
        if (controller.signal.aborted || version !== requestVersionRef.current) {
          return;
        }
        setStatus({ videoId, userId, isFavorited: result.memberships.length > 0, error: null });
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || version !== requestVersionRef.current) {
          return;
        }
        setStatus({
          videoId,
          userId,
          isFavorited: null,
          error: error instanceof Error ? error.message : "收藏状态暂时无法加载，点击收藏重试",
        });
      });

    return () => controller.abort();
  }, [isAuthReady, userId, videoId]);

  const updateFavoriteStatus = useCallback((isFavorited: boolean) => {
    if (!userId) {
      return;
    }
    // A dialog read or save is newer than a pending background request.
    requestVersionRef.current += 1;
    setStatus({ videoId, userId, isFavorited, error: null });
  }, [userId, videoId]);

  const currentStatus = status?.userId === userId && status?.videoId === videoId ? status : null;
  const hasKnownStatus = typeof currentStatus?.isFavorited === "boolean";
  return {
    isFavorited: userId ? currentStatus?.isFavorited ?? null : false,
    isLoading: !isAuthReady || Boolean(userId && !currentStatus?.error && !hasKnownStatus),
    error: currentStatus?.error ?? null,
    updateFavoriteStatus,
  };
}
