"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { DialogShell } from "@/components/ui/dialog-shell";
import { FormMessage } from "@/components/ui/form-message";
import { usePageTopMessage } from "@/components/ui/page-top-message-provider";
import { CreateCollectionForm } from "@/components/user/create-collection-form";
import type { FavoriteEditorVideo } from "@/components/user/favorite-editor-dialog";
import AlertIcon from "@/components/icons/shared/alert-circle.svg";
import CheckIcon from "@/components/icons/shared/check-circle.svg";
import SpinnerIcon from "@/components/icons/shared/spinner-16.svg";
import FolderIcon from "@/components/icons/user/folder.svg";
import { requestUserArchiveMutation } from "@/lib/user-archive/client-api";
import type {
  UserArchiveFavoriteSelectionResult,
  UserArchiveVideoFavoriteState,
} from "@/lib/user-archive/types";

type Props = {
  open: boolean;
  video: FavoriteEditorVideo;
  onClose: () => void;
  onSaved: (result: UserArchiveFavoriteSelectionResult) => void;
  onLoaded?: (state: UserArchiveVideoFavoriteState) => void;
  onCollectionCreated?: () => void;
};

export function FavoriteSelectionDialog(props: Props) {
  return props.open ? (
    <FavoriteSelectionContent key={props.video.id} {...props} />
  ) : null;
}

function FavoriteSelectionContent({
  video,
  onClose,
  onSaved,
  onLoaded,
  onCollectionCreated,
}: Props) {
  const { showMessage } = usePageTopMessage();
  const [state, setState] = useState<UserArchiveVideoFavoriteState | null>(
    null,
  );
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [creating, setCreating] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const callbacks = useRef({ onClose, onLoaded });
  const submittingRef = useRef(false);
  useEffect(() => {
    callbacks.current = { onClose, onLoaded };
  }, [onClose, onLoaded]);
  const close = useCallback(() => {
    if (!submittingRef.current) {
      callbacks.current.onClose();
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    setError(null);
    void requestUserArchiveMutation<UserArchiveVideoFavoriteState>(
      `/api/user/favorites/${video.id}`,
      { method: "GET", cache: "no-store", signal: controller.signal },
      "收藏夹暂时无法加载，请重试。",
    )
      .then((result) => {
        if (controller.signal.aborted) {
          return;
        }
        setState(result);
        setSelectedIds(
          result.memberships.map((membership) => membership.collectionId),
        );
        callbacks.current.onLoaded?.(result);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted) {
          setError(
            cause instanceof Error
              ? cause.message
              : "收藏夹暂时无法加载，请重试。",
          );
        }
      });
    return () => controller.abort();
  }, [video.id, attempt]);

  const savedIds =
    state?.memberships.map((membership) => membership.collectionId) ?? [];
  const removed =
    state?.memberships.filter(
      (membership) => !selectedIds.includes(membership.collectionId),
    ) ?? [];
  const isAvailable = video.isAvailable !== false;
  const canComplete =
    state !== null && (selectedIds.length > 0 || savedIds.length > 0);

  async function save() {
    if (!canComplete || submittingRef.current) {
      return;
    }
    if (
      selectedIds.length === savedIds.length &&
      selectedIds.every((id) => savedIds.includes(id))
    ) {
      close();
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setError(null);
    try {
      const result =
        await requestUserArchiveMutation<UserArchiveFavoriteSelectionResult>(
          `/api/user/favorites/${video.id}`,
          {
            method: "PUT",
            body: JSON.stringify({ collectionIds: selectedIds }),
          },
          "收藏保存失败，请稍后重试。",
        );
      showMessage({
        icon: <CheckIcon aria-hidden="true" />,
        text: result.isFavorited ? "收藏已更新" : "已取消收藏",
      });
      onSaved(result);
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "收藏保存失败，请稍后重试。",
      );
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <DialogShell
      className="max-h-[calc(100dvh-3rem)] overflow-y-auto"
      closeLabel="关闭收藏夹选择"
      description="勾选收藏夹，点击完成保存。"
      manageFocus
      onClose={close}
      title="收藏到"
    >
      <p className="mt-4 line-clamp-2 text-sm text-muted">{video.title}</p>
      {!state ? (
        error ? (
          <Button
            className="mt-4 gap-2"
            onClick={() => setAttempt((value) => value + 1)}
            type="button"
            variant="secondary"
          >
            <FolderIcon aria-hidden="true" />
            重新加载
          </Button>
        ) : (
          <FormMessage
            className="mt-4"
            icon={<SpinnerIcon aria-hidden="true" />}
            variant="loading"
          >
            正在加载收藏夹
          </FormMessage>
        )
      ) : (
        <>
          <div className="my-4 max-h-[40dvh] space-y-1 overflow-y-auto">
            {state.collections.map((collection) => {
              const checked = selectedIds.includes(collection.id);
              const disabled =
                submitting ||
                creating ||
                (!isAvailable && !savedIds.includes(collection.id));
              return (
                <label
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-3 text-sm transition hover:bg-surface has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
                  key={collection.id}
                >
                  <input
                    checked={checked}
                    className="h-4 w-4 shrink-0 accent-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
                    disabled={disabled}
                    onChange={() => {
                      setError(null);
                      setSelectedIds((current) =>
                        checked
                          ? current.filter((id) => id !== collection.id)
                          : [...current, collection.id],
                      );
                    }}
                    type="checkbox"
                  />
                  <FolderIcon
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 text-subtle"
                  />
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {collection.name}
                  </span>
                  <span className="text-xs text-subtle">
                    {collection.itemCount}
                  </span>
                </label>
              );
            })}
            {state.collections.length === 0 ? (
              <div className="flex items-center gap-3 px-3 py-4 text-sm text-muted">
                <FolderIcon aria-hidden="true" className="h-6 w-6 shrink-0" />
                新建一个收藏夹，收好喜欢的视频。
              </div>
            ) : null}
          </div>
          {isAvailable ? (
            <CreateCollectionForm
              disabled={submitting}
              initiallyExpanded={state.collections.length === 0}
              onPendingChange={(pending) => {
                submittingRef.current = pending;
                setCreating(pending);
              }}
              onCreated={(collection) => {
                setState((current) =>
                  current
                    ? {
                        ...current,
                        collections: [...current.collections, collection],
                      }
                    : current,
                );
                setSelectedIds((current) => [...current, collection.id]);
                onCollectionCreated?.();
              }}
            />
          ) : (
            <FormMessage icon={<AlertIcon aria-hidden="true" />} variant="info">
              视频已下架，可以移出已有收藏夹。
            </FormMessage>
          )}
          {removed.length > 0 ? (
            <p className="mt-3 text-xs leading-5 text-subtle">
              {selectedIds.length === 0
                ? "完成后将取消收藏。"
                : `完成后将移出 ${removed.length} 个收藏夹。`}
              {removed.some((item) => item.note || item.tagIds.length > 0)
                ? "移出记录的备注和标签绑定也会删除。"
                : ""}
            </p>
          ) : null}
        </>
      )}
      {error ? (
        <FormMessage
          className="mt-4"
          icon={<AlertIcon aria-hidden="true" />}
          variant="error"
        >
          {error}
        </FormMessage>
      ) : null}
      <div className="mt-5 flex justify-end border-t border-border pt-4">
        <Button
          aria-busy={submitting || creating}
          className="gap-2"
          disabled={!canComplete || submitting || creating}
          onClick={() => void save()}
          type="button"
        >
          {submitting || creating ? (
            <SpinnerIcon aria-hidden="true" />
          ) : (
            <CheckIcon aria-hidden="true" />
          )}
          {submitting ? "正在保存" : "完成"}
        </Button>
      </div>
    </DialogShell>
  );
}
