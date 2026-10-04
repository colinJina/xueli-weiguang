"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { TextField } from "@/components/ui/text-field";
import AlertIcon from "@/components/icons/shared/alert-circle.svg";
import PlusIcon from "@/components/icons/shared/plus-16.svg";
import SpinnerIcon from "@/components/icons/shared/spinner-16.svg";
import { requestUserArchiveMutation } from "@/lib/user-archive/client-api";
import { COLLECTION_NAME_MAX_LENGTH } from "@/lib/user-archive/limits";
import type { UserArchiveCollectionSummary } from "@/lib/user-archive/types";

export function CreateCollectionForm({
  disabled = false,
  initiallyExpanded = false,
  onCreated,
  onPendingChange,
}: {
  disabled?: boolean;
  initiallyExpanded?: boolean;
  onCreated: (collection: UserArchiveCollectionSummary) => void;
  onPendingChange?: (pending: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(initiallyExpanded);
  const [name, setName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting || disabled) {
      return;
    }
    const trimmedName = name.trim();
    if (!trimmedName) {
      setError("请输入收藏夹名称。");
      return;
    }
    setSubmitting(true);
    onPendingChange?.(true);
    setError(null);
    try {
      const result = await requestUserArchiveMutation<{ id: string }>(
        "/api/user/collections",
        { method: "POST", body: JSON.stringify({ name: trimmedName }) },
        "收藏夹创建失败，请稍后重试。",
      );
      onCreated({
        id: result.id,
        name: trimmedName,
        description: "",
        itemCount: 0,
        sortOrder: 0,
        active: false,
      });
      setName("");
      setExpanded(false);
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "收藏夹创建失败，请稍后重试。",
      );
    } finally {
      setSubmitting(false);
      onPendingChange?.(false);
    }
  }

  if (!expanded) {
    return (
      <Button
        className="w-full justify-start gap-2"
        disabled={disabled}
        onClick={() => setExpanded(true)}
        size="sm"
        type="button"
        variant="ghost"
      >
        <PlusIcon aria-hidden="true" />
        新建收藏夹
      </Button>
    );
  }
  return (
    <form
      className="space-y-3 rounded-lg border border-border bg-panel p-3"
      onSubmit={handleSubmit}
    >
      <TextField
        autoFocus
        className="h-10"
        disabled={disabled || submitting}
        label="收藏夹名称"
        maxLength={COLLECTION_NAME_MAX_LENGTH}
        onChange={(event) => setName(event.target.value)}
        placeholder="例如：创作灵感"
        value={name}
      />
      {error ? (
        <FormMessage icon={<AlertIcon aria-hidden="true" />} variant="error">
          {error}
        </FormMessage>
      ) : null}
      <div className="flex gap-2">
        <Button
          className="gap-2"
          disabled={disabled || submitting}
          size="sm"
          type="submit"
        >
          {submitting ? (
            <SpinnerIcon aria-hidden="true" />
          ) : (
            <PlusIcon aria-hidden="true" />
          )}
          {submitting ? "正在创建" : "创建"}
        </Button>
        <Button
          disabled={submitting}
          onClick={() => {
            setExpanded(false);
            setError(null);
          }}
          size="sm"
          type="button"
          variant="secondary"
        >
          取消
        </Button>
      </div>
    </form>
  );
}
