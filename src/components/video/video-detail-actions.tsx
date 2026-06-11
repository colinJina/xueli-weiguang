"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthDialog } from "@/components/auth/auth-dialog";
import {
  FavoriteEditorDialog,
  type FavoriteEditorVideo,
} from "@/components/user/favorite-editor-dialog";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { IconButton } from "@/components/ui/icon-button";
import {
  VideoBookmarkIcon,
  VideoHeartIcon,
  VideoShareIcon,
} from "@/components/video/video-detail-icons";
import { useAuth } from "@/lib/auth/use-auth";
import type { UserArchiveVideoFavoriteState } from "@/lib/user-archive/types";
import { formatCompactNumber } from "@/lib/videos/metrics";
import type {
  VideoInteractionErrorResponse,
  VideoLikeResponse,
  VideoStorageProvider,
} from "@/lib/videos/types";
import { cn } from "@/lib/utils";

type VideoDetailActionsProps = {
  likeCount: number;
  likeCountLabel: string;
  favoriteState: UserArchiveVideoFavoriteState | null;
  favoriteVideo: FavoriteEditorVideo;
  onLikeCountChange: (nextCount: number, nextLabel: string) => void;
  storageProvider: VideoStorageProvider;
  videoId: string;
};

function AlertIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 flex-none" fill="none" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.5v4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      <circle cx="8" cy="11.2" r="0.7" fill="currentColor" />
    </svg>
  );
}

function LoadingIcon() {
  return (
    <svg aria-hidden="true" className="h-[1.05rem] w-[1.05rem] animate-spin" fill="none" viewBox="0 0 20 20">
      <circle className="opacity-25" cx="10" cy="10" r="7" stroke="currentColor" strokeWidth="1.5" />
      <path
        className="opacity-80"
        d="M17 10a7 7 0 0 0-7-7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

async function readLikeResponse(response: Response) {
  const payload = (await response.json().catch(() => null)) as
    | VideoLikeResponse
    | VideoInteractionErrorResponse
    | null;

  if (!response.ok || !payload || "code" in payload) {
    const message =
      payload && "message" in payload
        ? payload.message
        : "点赞状态暂时无法更新，请稍后再试。";
    throw new Error(message);
  }

  return payload;
}

export function VideoDetailActions({
  likeCount,
  likeCountLabel,
  favoriteState,
  favoriteVideo,
  onLikeCountChange,
  storageProvider,
  videoId,
}: VideoDetailActionsProps) {
  const router = useRouter();
  const {
    isReady,
    isAuthenticated,
    dialogMode,
    openLogin,
    closeDialog,
    switchMode,
  } = useAuth();
  const [liked, setLiked] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [favoriteDialogOpen, setFavoriteDialogOpen] = useState(false);
  const [continueToFavorite, setContinueToFavorite] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const canUseLocalLikes = storageProvider === "cos";
  const collectionState: UserArchiveVideoFavoriteState =
    favoriteState ?? { collections: [], tags: [], memberships: [] };

  const refreshLikeState = useCallback(async () => {
    if (!canUseLocalLikes) {
      setLiked(false);
      return;
    }

    const response = await fetch(`/api/videos/${videoId}/like`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    const payload = await readLikeResponse(response);

    setLiked(payload.liked);
    onLikeCountChange(payload.likeCount, payload.likeCountLabel);
  }, [canUseLocalLikes, onLikeCountChange, videoId]);

  useEffect(() => {
    if (!isReady || !canUseLocalLikes) {
      return;
    }

    void refreshLikeState().catch((error: unknown) => {
      console.error("Failed to refresh like state", error);
    });
  }, [canUseLocalLikes, isReady, refreshLikeState]);

  async function handleLikeClick() {
    setErrorMessage(null);

    if (!canUseLocalLikes) {
      return;
    }

    if (!isReady) {
      return;
    }

    if (!isAuthenticated) {
      openLogin();
      return;
    }

    const previousLiked = liked;
    const previousCount = likeCount;
    const nextLiked = !liked;
    const optimisticCount = nextLiked ? likeCount + 1 : Math.max(0, likeCount - 1);
    const optimisticLabel = formatCompactNumber(optimisticCount);

    setIsPending(true);
    setLiked(nextLiked);
    onLikeCountChange(optimisticCount, optimisticLabel);

    try {
      const response = await fetch(`/api/videos/${videoId}/like`, {
        method: nextLiked ? "PUT" : "DELETE",
        headers: {
          Accept: "application/json",
        },
      });
      const payload = await readLikeResponse(response);

      setLiked(payload.liked);
      onLikeCountChange(payload.likeCount, payload.likeCountLabel);
    } catch (error) {
      setLiked(previousLiked);
      onLikeCountChange(previousCount, formatCompactNumber(previousCount));
      setErrorMessage(error instanceof Error ? error.message : "点赞状态暂时无法更新，请稍后再试。");
    } finally {
      setIsPending(false);
    }
  }

  function handleFavoriteClick() {
    setErrorMessage(null);

    if (!isReady) {
      return;
    }

    if (!isAuthenticated) {
      setContinueToFavorite(true);
      openLogin();
      return;
    }

    setFavoriteDialogOpen(true);
  }

  const likeButton = canUseLocalLikes ? (
    <Button
      aria-pressed={liked}
      className="gap-2 font-medium"
      disabled={!isReady || isPending}
      onClick={handleLikeClick}
      size="md"
      type="button"
      variant={liked ? "pillActive" : "pill"}
    >
      {isPending ? (
        <LoadingIcon />
      ) : (
        <VideoHeartIcon className={cn("h-[1.05rem] w-[1.05rem]", liked && "[&_path]:fill-current")} />
      )}
      <span>{likeCountLabel}</span>
    </Button>
  ) : (
    <Button
      aria-disabled="true"
      className="gap-2 font-medium"
      size="md"
      title="外站视频保留原始点赞数据"
      type="button"
      variant="pill"
    >
      <VideoHeartIcon className="h-[1.05rem] w-[1.05rem]" />
      <span>{likeCountLabel}</span>
    </Button>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 lg:justify-end">
        {likeButton}

        <Button className="gap-2 font-medium" onClick={handleFavoriteClick} size="md" type="button" variant="pill">
          <VideoBookmarkIcon className="h-[1.05rem] w-[1.05rem]" />
          <span>收藏与标签</span>
        </Button>

        <IconButton aria-label="分享" type="button">
          <VideoShareIcon className="h-[1.05rem] w-[1.05rem]" />
        </IconButton>
      </div>

      {errorMessage ? (
        <FormMessage className="lg:max-w-[20rem]" icon={<AlertIcon />} variant="error">
          {errorMessage}
        </FormMessage>
      ) : null}

      {dialogMode ? (
        <AuthDialog
          mode={dialogMode}
          onClose={() => {
            setContinueToFavorite(false);
            closeDialog();
          }}
          onSuccess={() => {
            closeDialog();
            router.refresh();
            if (continueToFavorite) {
              setContinueToFavorite(false);
              setFavoriteDialogOpen(true);
            }
            void refreshLikeState().catch((error: unknown) => {
              console.error("Failed to refresh like state after login", error);
            });
          }}
          onSwitchMode={switchMode}
          open
        />
      ) : null}

      <FavoriteEditorDialog
        collections={collectionState.collections}
        initialCollectionId={collectionState.memberships[0]?.collectionId ?? null}
        memberships={collectionState.memberships}
        onChanged={() => {
          router.refresh();
        }}
        onClose={() => setFavoriteDialogOpen(false)}
        open={favoriteDialogOpen}
        tags={collectionState.tags}
        video={favoriteVideo}
      />
    </div>
  );
}
