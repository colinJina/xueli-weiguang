"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { FilterButton } from "@/components/ui/filter-button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DialogShell } from "@/components/ui/dialog-shell";
import { FormMessage } from "@/components/ui/form-message";
import { TextField } from "@/components/ui/text-field";
import { usePageTopMessage } from "@/components/ui/page-top-message-provider";
import AlertIcon from "@/components/icons/shared/alert-circle.svg";
import CheckIcon from "@/components/icons/shared/check-circle.svg";
import PlusIcon from "@/components/icons/shared/plus-16.svg";
import SpinnerIcon from "@/components/icons/shared/spinner-16.svg";
import { requestUserArchiveMutation } from "@/lib/user-archive/client-api";
import {
  COLLECTION_ITEM_NOTE_MAX_LENGTH,
  TAG_NAME_MAX_LENGTH,
  TAGS_PER_ITEM_LIMIT,
} from "@/lib/user-archive/limits";
import type {
  UserArchiveTagSummary,
  UserArchiveVideoMembership,
} from "@/lib/user-archive/types";
import type { VideoStorageProvider } from "@/lib/videos/types";

export type FavoriteEditorVideo = {
  id: string;
  title: string;
  coverUrl: string | null;
  sourceLabel: string;
  storageProvider: VideoStorageProvider | null;
  isAvailable?: boolean;
};

type Props = {
  initialCollectionId?: string | null;
  memberships: UserArchiveVideoMembership[];
  onChanged: () => void;
  onClose: () => void;
  open: boolean;
  tags: UserArchiveTagSummary[];
  video: FavoriteEditorVideo;
};

/** Secondary editor: annotations belong to a single existing folder membership. */
export function FavoriteEditorDialog(props: Props) {
  return props.open ? (
    <CollectionItemDetails
      key={props.video.id + (props.initialCollectionId ?? "")}
      {...props}
    />
  ) : null;
}

function CollectionItemDetails({
  initialCollectionId,
  memberships,
  onChanged,
  onClose,
  tags,
  video,
}: Props) {
  const { showMessage } = usePageTopMessage();
  const [collectionId, setCollectionId] = useState(
    initialCollectionId ?? memberships[0]?.collectionId ?? "",
  );
  const membership = memberships.find(
    (item) => item.collectionId === collectionId,
  );
  const [note, setNote] = useState(membership?.note ?? "");
  const [tagIds, setTagIds] = useState(membership?.tagIds ?? []);
  const [localTags, setLocalTags] = useState(tags);
  const [newTagName, setNewTagName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const readOnly = video.isAvailable === false;
  const busyRef = useRef(false);
  const closeRef = useRef(onClose);
  useEffect(() => {
    closeRef.current = onClose;
  }, [onClose]);
  const close = useCallback(() => {
    if (!busyRef.current) {
      closeRef.current();
    }
  }, []);

  useEffect(() => {
    setNote(membership?.note ?? "");
    setTagIds(membership?.tagIds ?? []);
    setError(null);
  }, [membership]);

  function toggleTag(id: string) {
    setError(null);
    if (!tagIds.includes(id) && tagIds.length >= TAGS_PER_ITEM_LIMIT) {
      setError("单条收藏最多只能绑定 10 个标签。");
      return;
    }
    setTagIds((current) =>
      current.includes(id)
        ? current.filter((value) => value !== id)
        : [...current, id],
    );
  }

  async function createTag(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || readOnly) {
      return;
    }
    const name = newTagName.trim();
    if (!name) {
      setError("请输入标签名称。");
      return;
    }
    if (tagIds.length >= TAGS_PER_ITEM_LIMIT) {
      setError("单条收藏最多只能绑定 10 个标签。");
      return;
    }
    setSubmitting(true);
    busyRef.current = true;
    setError(null);
    try {
      const result = await requestUserArchiveMutation<{ id: string }>(
        "/api/user/tags",
        { method: "POST", body: JSON.stringify({ name }) },
        "标签创建失败，请重试。",
      );
      setLocalTags((current) => [
        ...current,
        { id: result.id, name, itemCount: 0, sortOrder: 0, active: false },
      ]);
      setTagIds((current) => [...current, result.id]);
      setNewTagName("");
      onChanged();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "标签创建失败，请重试。",
      );
    } finally {
      busyRef.current = false;
      setSubmitting(false);
    }
  }

  async function save() {
    if (!membership || submitting || readOnly) {
      return;
    }
    setSubmitting(true);
    busyRef.current = true;
    setError(null);
    try {
      await requestUserArchiveMutation<{ id: string }>(
        "/api/user/collection-items/" + membership.collectionItemId,
        { method: "PATCH", body: JSON.stringify({ note, tagIds }) },
        "备注和标签保存失败，请重试。",
      );
      showMessage({
        icon: <CheckIcon aria-hidden="true" />,
        text: "备注和标签已保存",
      });
      onChanged();
      onClose();
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "备注和标签保存失败，请重试。",
      );
    } finally {
      busyRef.current = false;
      setSubmitting(false);
    }
  }

  return (
    <DialogShell
      className="max-h-[calc(100dvh-3rem)] overflow-y-auto"
      closeLabel="关闭备注与标签"
      description="备注和标签仅对你可见，分别保存在各收藏夹中。"
      onClose={close}
      title={readOnly ? "查看备注与标签" : "备注与标签"}
    >
      <div className="mt-5 space-y-5">
        <p className="line-clamp-2 text-sm text-muted">{video.title}</p>
        {memberships.length > 1 ? (
          <div className="space-y-2">
            <Label className="text-sm text-muted" htmlFor="favorite-collection">
              所属收藏夹
            </Label>
            <Select
              disabled={submitting}
              onValueChange={setCollectionId}
              value={collectionId}
            >
              <SelectTrigger id="favorite-collection">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {memberships.map((item) => (
                  <SelectItem key={item.collectionId} value={item.collectionId}>
                    {item.collectionName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <p className="text-xs text-subtle">{membership?.collectionName}</p>
        )}
        <Label className="block space-y-2">
          <span className="text-sm text-muted">备注</span>
          <Textarea
            className="min-h-24 w-full resize-y rounded-md border border-border bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-borderStrong"
            disabled={submitting || readOnly}
            maxLength={COLLECTION_ITEM_NOTE_MAX_LENGTH}
            onChange={(event) => setNote(event.target.value)}
            placeholder="记录想法或收藏理由"
            value={note}
          />
        </Label>
        <div className="space-y-3">
          <p className="text-sm text-muted">
            私有标签{" "}
            <span className="text-xs text-subtle">
              {tagIds.length}/{TAGS_PER_ITEM_LIMIT}
            </span>
          </p>
          <div className="flex flex-wrap gap-2">
            {localTags.map((tag) => (
              <FilterButton
                active={tagIds.includes(tag.id)}
                disabled={submitting || readOnly}
                key={tag.id}
                onClick={() => toggleTag(tag.id)}
                type="button"
              >
                {tag.name}
              </FilterButton>
            ))}
            {localTags.length === 0 ? (
              <p className="text-sm text-subtle">暂无标签</p>
            ) : null}
          </div>
          {!readOnly ? (
            <form className="flex items-end gap-2" onSubmit={createTag}>
              <TextField
                className="h-10"
                disabled={submitting}
                label="新建标签"
                maxLength={TAG_NAME_MAX_LENGTH}
                onChange={(event) => setNewTagName(event.target.value)}
                placeholder="例如：构图"
                value={newTagName}
                wrapperClassName="min-w-0 flex-1"
              />
              <Button
                className="gap-2"
                disabled={submitting}
                size="sm"
                type="submit"
              >
                <PlusIcon aria-hidden="true" />
                添加
              </Button>
            </form>
          ) : (
            <FormMessage icon={<AlertIcon aria-hidden="true" />} variant="info">
              视频已下架，已有备注和标签仍可查看。
            </FormMessage>
          )}
        </div>
        {error ? (
          <FormMessage icon={<AlertIcon aria-hidden="true" />} variant="error">
            {error}
          </FormMessage>
        ) : null}
        {!readOnly ? (
          <div className="flex justify-end border-t border-border pt-4">
            <Button
              className="gap-2"
              disabled={submitting || !membership}
              onClick={() => void save()}
              type="button"
            >
              {submitting ? (
                <SpinnerIcon aria-hidden="true" />
              ) : (
                <CheckIcon aria-hidden="true" />
              )}
              {submitting ? "正在保存" : "保存"}
            </Button>
          </div>
        ) : null}
      </div>
    </DialogShell>
  );
}
