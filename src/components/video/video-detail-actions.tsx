"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { AuthDialog } from "@/components/auth/auth-dialog";
import {
  FavoriteEditorDialog,
  type FavoriteEditorVideo,
} from "@/components/user/favorite-editor-dialog";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { IconButton } from "@/components/ui/icon-button";
import { usePageTopMessage } from "@/components/ui/page-top-message-provider";
import { LikeBurstIcon } from "@/components/video/like-burst-icon";
import StatusAlertIcon from "@/components/icons/shared/alert-circle.svg";
import CheckIcon from "@/components/icons/shared/check-circle.svg";
import VideoBookmarkIcon from "@/components/icons/video/bookmark.svg";
import VideoHeartIcon from "@/components/icons/video/heart.svg";
import VideoShareIcon from "@/components/icons/video/share.svg";
import { useAuth } from "@/lib/auth/use-auth";
import type { UserArchiveVideoFavoriteState } from "@/lib/user-archive/types";
import { formatCompactNumber } from "@/lib/videos/metrics";
import type {
  VideoInteractionErrorResponse,
  VideoLikeResponse,
  VideoStorageProvider,
} from "@/lib/videos/types";

type VideoDetailActionsProps = {
  likeCount: number;
  likeCountLabel: string;
  favoriteState: UserArchiveVideoFavoriteState | null;
  favoriteVideo: FavoriteEditorVideo;
  onLikeCountChange: (nextCount: number, nextLabel: string) => void;
  storageProvider: VideoStorageProvider;
  videoId: string;
};

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
  const { showMessage } = usePageTopMessage();
  const {
    isReady,
    isAuthenticated,
    dialogMode,
    openLogin,
    closeDialog,
    switchMode,
  } = useAuth();
  const interactionVersionRef = useRef(0);
  const [liked, setLiked] = useState(false);
  const [isPending, setIsPending] = useState(false);
  const [likeBurstKey, setLikeBurstKey] = useState(0);
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

    const requestedAtVersion = interactionVersionRef.current;
    const response = await fetch(`/api/videos/${videoId}/like`, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });
    const payload = await readLikeResponse(response);

    if (requestedAtVersion !== interactionVersionRef.current) {
      return;
    }

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

    if (!isReady || isPending) {
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

    interactionVersionRef.current += 1;
    setIsPending(true);
    setLiked(nextLiked);
    onLikeCountChange(optimisticCount, optimisticLabel);

    if (nextLiked) {
      setLikeBurstKey((currentKey) => currentKey + 1);
    }

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

  async function handleShareClick() {
    setErrorMessage(null);
    const url = window.location.href;

    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: favoriteVideo.title, url });
        return;
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") {
          return;
        }
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      showMessage({ icon: <CheckIcon aria-hidden="true" />, text: "视频链接已复制" });
    } catch {
      setErrorMessage("分享暂时不可用，请复制浏览器地址后重试。");
    }
  }

  const likeButton = canUseLocalLikes ? (
    <Button
      aria-busy={isPending}
      aria-pressed={liked}
      className="gap-2 font-medium disabled:opacity-100"
      disabled={!isReady || isPending}
      onClick={handleLikeClick}
      size="md"
      type="button"
      variant={liked ? "pillActive" : "pill"}
    >
      <LikeBurstIcon burstKey={likeBurstKey} liked={liked} />
      <span>{likeCountLabel}</span>
    </Button>
  ) : (
    <Button
      className="gap-2 font-medium"
      disabled
      size="md"
      title="外站视频保留原始点赞数据"
      type="button"
      variant="pill"
    >
      <VideoHeartIcon aria-hidden="true" className="h-[1.05rem] w-[1.05rem]" />
      <span>{likeCountLabel}</span>
    </Button>
  );

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-3 lg:justify-end">
        {likeButton}

        <Button className="gap-2 font-medium" onClick={handleFavoriteClick} size="md" type="button" variant="pill">
          <VideoBookmarkIcon aria-hidden="true" className="h-[1.05rem] w-[1.05rem]" />
          <span>收藏与标签</span>
        </Button>

        <IconButton aria-label="分享" onClick={handleShareClick} type="button">
          <VideoShareIcon aria-hidden="true" className="h-[1.05rem] w-[1.05rem]" />
        </IconButton>
      </div>

      {errorMessage ? (
        <FormMessage className="lg:max-w-[20rem]" icon={<StatusAlertIcon aria-hidden="true" className="h-4 w-4 flex-none" />} variant="error">
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
