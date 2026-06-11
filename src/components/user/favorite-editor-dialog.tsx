"use client";

import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import { chipVariants } from "@/components/ui/chip";
import { DialogShell } from "@/components/ui/dialog-shell";
import { FormMessage } from "@/components/ui/form-message";
import { TextField } from "@/components/ui/text-field";
import { VideoSourceIcon } from "@/components/ui/video-source-icon";
import { requestUserArchiveMutation } from "@/lib/user-archive/client-api";
import type {
  UserArchiveCollectionSummary,
  UserArchiveTagSummary,
  UserArchiveVideoMembership,
} from "@/lib/user-archive/types";
import type { VideoStorageProvider } from "@/lib/videos/types";
import { cn } from "@/lib/utils";

type MutationResult = {
  id: string;
};

export type FavoriteEditorVideo = {
  id: string;
  title: string;
  coverUrl: string | null;
  sourceLabel: string;
  storageProvider: VideoStorageProvider;
};

type FavoriteEditorDialogProps = {
  collections: UserArchiveCollectionSummary[];
  initialCollectionId?: string | null;
  memberships: UserArchiveVideoMembership[];
  onChanged: () => void;
  onClose: () => void;
  open: boolean;
  tags: UserArchiveTagSummary[];
  video: FavoriteEditorVideo;
};

type NoticeState = {
  variant: "error" | "success" | "loading";
  message: string;
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

function CheckIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 flex-none" fill="none" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="m5.5 8 1.8 1.8L10.8 6.4"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.4" />
      <path d="M13.5 8A5.5 5.5 0 0 0 8 2.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}

function PlusIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
      <path d="M8 3.2v9.6M3.2 8h9.6" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
      <path d="M3.5 5h9" stroke="currentColor" strokeLinecap="round" strokeWidth="1.35" />
      <path d="M6.5 5V3.6h3V5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.35" />
      <path
        d="M5 6.8v5A1.6 1.6 0 0 0 6.6 13.4h2.8A1.6 1.6 0 0 0 11 11.8v-5"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.35"
      />
    </svg>
  );
}

function SaveIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
      <path
        d="M3.4 8.2 6.6 11.4 12.8 4.8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function Notice({ notice }: { notice: NoticeState }) {
  const icon =
    notice.variant === "loading" ? (
      <SpinnerIcon />
    ) : notice.variant === "success" ? (
      <CheckIcon />
    ) : (
      <AlertIcon />
    );

  return (
    <FormMessage icon={icon} variant={notice.variant}>
      {notice.message}
    </FormMessage>
  );
}

export function FavoriteEditorDialog({
  collections,
  initialCollectionId,
  memberships,
  onChanged,
  onClose,
  open,
  tags,
  video,
}: FavoriteEditorDialogProps) {
  const [localCollections, setLocalCollections] = useState(collections);
  const [localTags, setLocalTags] = useState(tags);
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null);
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [newCollectionName, setNewCollectionName] = useState("");
  const [newTagName, setNewTagName] = useState("");
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setLocalCollections(collections);
    setLocalTags(tags);
    setSelectedCollectionId(
      initialCollectionId ?? memberships[0]?.collectionId ?? collections[0]?.id ?? null,
    );
    setNotice(null);
    setNewCollectionName("");
    setNewTagName("");
  }, [collections, initialCollectionId, memberships, open, tags]);

  const selectedMembership = useMemo(
    () => memberships.find((membership) => membership.collectionId === selectedCollectionId) ?? null,
    [memberships, selectedCollectionId],
  );
  const selectedCollection = useMemo(
    () => localCollections.find((collection) => collection.id === selectedCollectionId) ?? null,
    [localCollections, selectedCollectionId],
  );

  useEffect(() => {
    if (!open) {
      return;
    }

    setNote(selectedMembership?.note ?? "");
    setSelectedTagIds(selectedMembership?.tagIds ?? []);
  }, [open, selectedMembership]);

  if (!open) {
    return null;
  }

  function setError(message: string) {
    setNotice({ variant: "error", message });
  }

  function toggleTag(tagId: string) {
    setNotice(null);
    setSelectedTagIds((current) => {
      if (current.includes(tagId)) {
        return current.filter((id) => id !== tagId);
      }

      if (current.length >= 10) {
        setError("单条收藏最多只能绑定 10 个标签。");
        return current;
      }

      return [...current, tagId];
    });
  }

  async function handleCreateCollection(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newCollectionName.trim();

    if (!name) {
      setError("请输入收藏夹名称。");
      return;
    }

    setIsSubmitting(true);
    setNotice({ variant: "loading", message: "正在创建收藏夹。" });

    try {
      const result = await requestUserArchiveMutation<MutationResult>(
        "/api/user/collections",
        {
          method: "POST",
          body: JSON.stringify({ name }),
        },
        "收藏夹创建失败，请稍后重试。",
      );

      setLocalCollections((current) => [
        ...current,
        {
          id: result.id,
          name,
          description: "",
          itemCount: 0,
          sortOrder: 0,
          active: false,
        },
      ]);
      setSelectedCollectionId(result.id);
      setNewCollectionName("");
      setNotice({ variant: "success", message: "收藏夹已创建。" });
      onChanged();
    } catch (error) {
      setError(error instanceof Error ? error.message : "收藏夹创建失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCreateTag(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newTagName.trim();

    if (!name) {
      setError("请输入标签名称。");
      return;
    }

    if (selectedTagIds.length >= 10) {
      setError("单条收藏最多只能绑定 10 个标签。");
      return;
    }

    setIsSubmitting(true);
    setNotice({ variant: "loading", message: "正在创建标签。" });

    try {
      const result = await requestUserArchiveMutation<MutationResult>(
        "/api/user/tags",
        {
          method: "POST",
          body: JSON.stringify({ name }),
        },
        "标签创建失败，请稍后重试。",
      );

      setLocalTags((current) => [
        ...current,
        {
          id: result.id,
          name,
          itemCount: 0,
          sortOrder: 0,
          active: false,
        },
      ]);
      setSelectedTagIds((current) => [...current, result.id]);
      setNewTagName("");
      setNotice({ variant: "success", message: "标签已创建并加入当前收藏。" });
      onChanged();
    } catch (error) {
      setError(error instanceof Error ? error.message : "标签创建失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleSave() {
    if (!selectedCollectionId) {
      setError("请先选择或创建一个收藏夹。");
      return;
    }

    setIsSubmitting(true);
    setNotice({ variant: "loading", message: "正在保存收藏记录。" });

    try {
      if (selectedMembership) {
        await requestUserArchiveMutation<MutationResult>(
          `/api/user/collection-items/${selectedMembership.collectionItemId}`,
          {
            method: "PATCH",
            body: JSON.stringify({ note }),
          },
          "收藏记录保存失败，请稍后重试。",
        );
        await requestUserArchiveMutation<MutationResult>(
          `/api/user/collection-items/${selectedMembership.collectionItemId}/tags`,
          {
            method: "PUT",
            body: JSON.stringify({ tagIds: selectedTagIds }),
          },
          "标签保存失败，请稍后重试。",
        );
      } else {
        await requestUserArchiveMutation<MutationResult>(
          `/api/user/collections/${selectedCollectionId}/items`,
          {
            method: "POST",
            body: JSON.stringify({
              videoId: video.id,
              note,
              tagIds: selectedTagIds,
            }),
          },
          "收藏保存失败，请稍后重试。",
        );
      }

      setNotice({ variant: "success", message: "收藏记录已保存。" });
      onChanged();
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "收藏记录保存失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete() {
    if (!selectedMembership) {
      return;
    }

    setIsSubmitting(true);
    setNotice({ variant: "loading", message: "正在移出收藏夹。" });

    try {
      await requestUserArchiveMutation<MutationResult>(
        `/api/user/collection-items/${selectedMembership.collectionItemId}`,
        {
          method: "DELETE",
        },
        "取消收藏失败，请稍后重试。",
      );
      setNotice({ variant: "success", message: "已移出当前收藏夹。" });
      onChanged();
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "取消收藏失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DialogShell
      className="max-h-[calc(100vh-2rem)] overflow-y-auto"
      closeLabel="关闭收藏编辑"
      description="选择收藏夹，并维护这条收藏记录的私有标签。"
      maxWidthClassName="max-w-[840px]"
      onClose={onClose}
      title={selectedMembership ? "编辑收藏记录" : "收藏到档案"}
    >
      <div className="mt-6 grid gap-5 lg:grid-cols-[250px,1fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-lg border border-border bg-surface">
            <div className="flex items-start gap-3 border-b border-border p-3">
              <div className="h-14 w-20 shrink-0 overflow-hidden rounded-md bg-panel">
                {video.coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img alt="" className="h-full w-full object-cover" src={video.coverUrl} />
                ) : null}
              </div>
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-bold leading-5 text-foreground">
                  {video.title}
                </p>
                <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-subtle">
                  <VideoSourceIcon className="h-3.5 w-3.5" platform={video.storageProvider} />
                  {video.sourceLabel}
                </p>
              </div>
            </div>

            <div className="max-h-[260px] space-y-1 overflow-y-auto p-2">
              {localCollections.map((collection) => {
                const saved = memberships.some(
                  (membership) => membership.collectionId === collection.id,
                );
                const active = selectedCollectionId === collection.id;

                return (
                  <button
                    aria-pressed={active}
                    className={cn(
                      "flex w-full items-center justify-between gap-3 rounded-md px-3 py-2.5 text-left transition",
                      active
                        ? "bg-white/[0.08] text-foreground"
                        : "text-muted hover:bg-white/[0.04] hover:text-foreground",
                    )}
                    key={collection.id}
                    onClick={() => setSelectedCollectionId(collection.id)}
                    type="button"
                  >
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold">{collection.name}</span>
                      <span className="mt-1 block text-xs text-subtle">{collection.itemCount} 条收藏</span>
                    </span>
                    {saved ? (
                      <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-foreground">
                        已收藏
                      </span>
                    ) : null}
                  </button>
                );
              })}

              {localCollections.length === 0 ? (
                <p className="px-3 py-4 text-sm leading-6 text-muted">
                  还没有收藏夹。先创建一个收藏夹，再保存视频。
                </p>
              ) : null}
            </div>
          </div>

          <form className="flex gap-2" onSubmit={handleCreateCollection}>
            <TextField
              className="h-10"
              disabled={isSubmitting}
              label="新建收藏夹"
              onChange={(event) => setNewCollectionName(event.target.value)}
              placeholder="例如：动态图形"
              value={newCollectionName}
              wrapperClassName="flex-1 space-y-1.5"
            />
            <Button className="mt-[26px] shrink-0 gap-2" disabled={isSubmitting} size="sm" type="submit">
              <PlusIcon />
              新建
            </Button>
          </form>
        </div>

        <div className="space-y-5">
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-foreground">
                  {selectedCollection?.name ?? "选择收藏夹"}
                </p>
                <p className="mt-1 text-xs text-subtle">
                  {selectedMembership ? "这条视频已在当前收藏夹中。" : "保存后会成为当前收藏夹的一条收藏记录。"}
                </p>
              </div>
              <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-subtle">
                {selectedTagIds.length}/10 标签
              </span>
            </div>

            <label className="mt-4 block space-y-2">
              <span className="font-sans text-[11px] uppercase tracking-[0.22em] text-muted">
                备注
              </span>
              <textarea
                className="min-h-20 w-full resize-none rounded-md border border-border bg-panel px-4 py-3 text-sm leading-6 text-foreground outline-none transition placeholder:text-subtle focus:border-borderStrong"
                disabled={isSubmitting}
                maxLength={500}
                onChange={(event) => setNote(event.target.value)}
                placeholder="给这条收藏写一个私人备注"
                value={note}
              />
            </label>
          </div>

          <div className="space-y-3 rounded-lg border border-border bg-surface p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-bold text-foreground">私有标签</p>
                <p className="mt-1 text-xs text-subtle">
                  标签归属于你，绑定在这条收藏记录上。
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              {localTags.map((tag) => {
                const selected = selectedTagIds.includes(tag.id);

                return (
                  <button
                    className={chipVariants({
                      size: "sm",
                      variant: selected ? "selected" : "default",
                    })}
                    disabled={isSubmitting}
                    key={tag.id}
                    onClick={() => toggleTag(tag.id)}
                    type="button"
                  >
                    {tag.name}
                  </button>
                );
              })}

              {localTags.length === 0 ? (
                <p className="text-sm leading-6 text-muted">还没有私有标签，可以在下方新建。</p>
              ) : null}
            </div>

            <form className="flex gap-2" onSubmit={handleCreateTag}>
              <TextField
                className="h-10"
                disabled={isSubmitting}
                label="新建标签"
                maxLength={40}
                onChange={(event) => setNewTagName(event.target.value)}
                placeholder="输入标签名"
                value={newTagName}
                wrapperClassName="flex-1 space-y-1.5"
              />
              <Button className="mt-[26px] shrink-0 gap-2" disabled={isSubmitting} size="sm" type="submit">
                <PlusIcon />
                添加
              </Button>
            </form>
          </div>

          {notice ? <Notice notice={notice} /> : null}

          <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between">
            <Button
              className="gap-2"
              disabled={!selectedMembership || isSubmitting}
              onClick={handleDelete}
              type="button"
              variant="pill"
            >
              <TrashIcon />
              移出当前收藏夹
            </Button>

            <Button
              className="gap-2"
              disabled={!selectedCollectionId || isSubmitting}
              onClick={handleSave}
              type="button"
            >
              {isSubmitting ? <SpinnerIcon /> : <SaveIcon />}
              {selectedMembership ? "保存修改" : "加入收藏"}
            </Button>
          </div>
        </div>
      </div>
    </DialogShell>
  );
}
