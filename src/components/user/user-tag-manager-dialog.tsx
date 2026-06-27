"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { DialogShell } from "@/components/ui/dialog-shell";
import { FormMessage } from "@/components/ui/form-message";
import { IconButton } from "@/components/ui/icon-button";
import { TextField } from "@/components/ui/text-field";
import AlertIcon from "@/components/icons/shared/alert-circle.svg";
import CheckIcon from "@/components/icons/shared/check-circle.svg";
import EditIcon from "@/components/icons/shared/edit-16.svg";
import PlusIcon from "@/components/icons/shared/plus-16.svg";
import SpinnerIcon from "@/components/icons/shared/spinner-16.svg";
import TrashIcon from "@/components/icons/shared/trash-16.svg";
import { requestUserArchiveMutation } from "@/lib/user-archive/client-api";
import { TAG_NAME_MAX_LENGTH } from "@/lib/user-archive/limits";
import type { UserArchiveTagSummary } from "@/lib/user-archive/types";

type MutationResult = {
  id: string;
};

type UserTagManagerDialogProps = {
  onChanged: () => void;
  onClose: () => void;
  open: boolean;
  tags: UserArchiveTagSummary[];
};

type NoticeState = {
  variant: "error" | "success" | "loading";
  message: string;
};

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

export function UserTagManagerDialog({
  onChanged,
  onClose,
  open,
  tags,
}: UserTagManagerDialogProps) {
  const [localTags, setLocalTags] = useState(tags);
  const [newTagName, setNewTagName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [notice, setNotice] = useState<NoticeState | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!open) {
      return;
    }

    setLocalTags(tags);
    setNewTagName("");
    setEditingId(null);
    setEditingName("");
    setNotice(null);
  }, [open, tags]);

  if (!open) {
    return null;
  }

  function setError(message: string) {
    setNotice({ variant: "error", message });
  }

  async function handleCreate(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newTagName.trim();

    if (!name) {
      setError("请输入标签名称。");
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
      setNewTagName("");
      setNotice({ variant: "success", message: "标签已创建。" });
      onChanged();
    } catch (error) {
      setError(error instanceof Error ? error.message : "标签创建失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRename(tagId: string) {
    const name = editingName.trim();

    if (!name) {
      setError("请输入标签名称。");
      return;
    }

    setIsSubmitting(true);
    setNotice({ variant: "loading", message: "正在更新标签。" });

    try {
      await requestUserArchiveMutation<MutationResult>(
        `/api/user/tags/${tagId}`,
        {
          method: "PATCH",
          body: JSON.stringify({ name }),
        },
        "标签更新失败，请稍后重试。",
      );

      setLocalTags((current) =>
        current.map((tag) => (tag.id === tagId ? { ...tag, name } : tag)),
      );
      setEditingId(null);
      setEditingName("");
      setNotice({ variant: "success", message: "标签已更新。" });
      onChanged();
    } catch (error) {
      setError(error instanceof Error ? error.message : "标签更新失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleDelete(tagId: string) {
    setIsSubmitting(true);
    setNotice({ variant: "loading", message: "正在删除标签并解除绑定。" });

    try {
      await requestUserArchiveMutation<MutationResult>(
        `/api/user/tags/${tagId}`,
        {
          method: "DELETE",
        },
        "标签删除失败，请稍后重试。",
      );

      setLocalTags((current) => current.filter((tag) => tag.id !== tagId));
      setNotice({ variant: "success", message: "标签已删除，并从相关收藏记录解绑。" });
      onChanged();
    } catch (error) {
      setError(error instanceof Error ? error.message : "标签删除失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <DialogShell
      className="max-h-[calc(100vh-2rem)] overflow-y-auto"
      closeLabel="关闭标签管理"
      description="标签只属于当前登录用户。删除标签会从所有收藏记录中解绑，不会删除视频或收藏夹。"
      maxWidthClassName="max-w-[640px]"
      onClose={onClose}
      title="管理私有标签"
    >
      <form className="mt-6 flex gap-3" onSubmit={handleCreate}>
        <TextField
          disabled={isSubmitting}
          label="新建标签"
          maxLength={TAG_NAME_MAX_LENGTH}
          onChange={(event) => setNewTagName(event.target.value)}
          placeholder="输入标签名"
          value={newTagName}
          wrapperClassName="flex-1"
        />
        <Button className="mt-[30px] shrink-0 gap-2" disabled={isSubmitting} type="submit">
          <PlusIcon />
          新建
        </Button>
      </form>

      <div className="mt-6 divide-y divide-border overflow-hidden rounded-lg border border-border bg-surface">
        {localTags.map((tag) => {
          const editing = editingId === tag.id;

          return (
            <div className="flex items-center gap-3 p-3" key={tag.id}>
              {editing ? (
                <input
                  className="h-10 min-w-0 flex-1 rounded-md border border-border bg-panel px-3 text-sm text-foreground outline-none focus:border-borderStrong"
                  disabled={isSubmitting}
                  maxLength={TAG_NAME_MAX_LENGTH}
                  onChange={(event) => setEditingName(event.target.value)}
                  value={editingName}
                />
              ) : (
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">{tag.name}</p>
                  <p className="mt-1 text-xs text-subtle">{tag.itemCount} 条使用</p>
                </div>
              )}

              {editing ? (
                <Button
                  disabled={isSubmitting}
                  onClick={() => handleRename(tag.id)}
                  size="sm"
                  type="button"
                  variant="secondary"
                >
                  保存
                </Button>
              ) : (
                <IconButton
                  aria-label={`重命名 ${tag.name}`}
                  disabled={isSubmitting}
                  onClick={() => {
                    setEditingId(tag.id);
                    setEditingName(tag.name);
                    setNotice(null);
                  }}
                  size="sm"
                  variant="surface"
                >
                  <EditIcon />
                </IconButton>
              )}

              <IconButton
                aria-label={`删除 ${tag.name}`}
                disabled={isSubmitting}
                onClick={() => handleDelete(tag.id)}
                size="sm"
                variant="surface"
              >
                <TrashIcon />
              </IconButton>
            </div>
          );
        })}

        {localTags.length === 0 ? (
          <p className="p-5 text-sm leading-6 text-muted">还没有私有标签。</p>
        ) : null}
      </div>

      {notice ? (
        <div className="mt-5">
          <Notice notice={notice} />
        </div>
      ) : null}
    </DialogShell>
  );
}

