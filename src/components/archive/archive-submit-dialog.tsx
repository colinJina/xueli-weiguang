"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { DialogShell } from "@/components/ui/dialog-shell";
import { FormMessage } from "@/components/ui/form-message";
import { TextField } from "@/components/ui/text-field";
import { translateSubmissionError } from "@/lib/submissions/translate-submission-error";

type ArchiveSubmitDialogProps = {
  open: boolean;
  onClose: () => void;
};

type SubmissionStatus = "idle" | "submitting" | "success" | "error";

function LinkIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 16 16">
      <path
        d="M7 4H4.5A2.5 2.5 0 0 0 2 6.5v3A2.5 2.5 0 0 0 4.5 12H7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
      <path
        d="M9 12h2.5A2.5 2.5 0 0 0 14 9.5v-3A2.5 2.5 0 0 0 11.5 4H9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
      <path d="M5.5 8h5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
    </svg>
  );
}

function SpinnerIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 animate-spin" fill="none" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeOpacity="0.2" strokeWidth="1.4" />
      <path
        d="M13.5 8A5.5 5.5 0 0 0 8 2.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
    </svg>
  );
}

function SuccessIcon() {
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

function WarningIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 flex-none" fill="none" viewBox="0 0 16 16">
      <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.3" />
      <path d="M8 4.5v4" stroke="currentColor" strokeLinecap="round" strokeWidth="1.4" />
      <circle cx="8" cy="11.2" r="0.7" fill="currentColor" />
    </svg>
  );
}

function StatusNotice({
  status,
  message,
}: {
  status: Extract<SubmissionStatus, "submitting" | "success" | "error">;
  message: string;
}) {
  const icon =
    status === "submitting" ? (
      <SpinnerIcon />
    ) : status === "success" ? (
      <SuccessIcon />
    ) : (
      <WarningIcon />
    );

  return (
    <FormMessage
      icon={icon}
      variant={status === "error" ? "error" : status === "submitting" ? "loading" : "success"}
    >
      {message}
    </FormMessage>
  );
}

export function ArchiveSubmitDialog({ open, onClose }: ArchiveSubmitDialogProps) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!open) {
      setUrl("");
      setStatus("idle");
      setMessage("");
    }
  }, [open]);

  if (!open) {
    return null;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!url.trim()) {
      setStatus("error");
      setMessage("请输入有效的 Bilibili 视频链接。");
      return;
    }

    setStatus("submitting");
    setMessage("正在提交链接，请稍候。");

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const payload = (await response.json().catch(() => null)) as { message?: string } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "投稿失败，请稍后重试。");
      }

      setUrl("");
      setStatus("success");
      setMessage("已收到，待审核。");
    } catch (error) {
      setStatus("error");
      setMessage(
        translateSubmissionError(error instanceof Error ? error.message : "投稿失败，请稍后重试。"),
      );
    }
  }

  const isSubmitting = status === "submitting";

  return (
    <DialogShell
      closeLabel="关闭投稿弹窗"
      description="粘贴一条 Bilibili 视频链接。我们会先记录投稿，再进入人工审核。"
      eyebrow="ARCHIVE SUBMISSION"
      onClose={onClose}
      title="推荐你喜欢的视频"
    >
      <div className="mt-5 flex items-center gap-3 border-b border-border pb-4">
        <Chip aria-current="page" size="md" variant="selected">
          <span className="inline-flex items-center gap-1.5">
            <LinkIcon />
            输入链接
          </span>
        </Chip>
      </div>

      <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
        <div className="space-y-4 rounded-lg border border-border bg-surface px-5 py-5">
          <TextField
            autoFocus
            icon={<LinkIcon />}
            label="BILIBILI URL"
            onChange={(event) => setUrl(event.target.value)}
            placeholder="https://www.bilibili.com/video/BV..."
            type="text"
            value={url}
          />

          <p className="text-xs leading-6 text-subtle">
            支持完整视频链接、裸 BV 号，以及 `b23.tv` 短链接。
          </p>
        </div>

        {status === "submitting" || status === "success" || status === "error" ? (
          <StatusNotice message={message} status={status} />
        ) : null}

        <div className="flex justify-end">
          <Button disabled={isSubmitting} type="submit">
            <span className="inline-flex items-center gap-2">
              {isSubmitting ? <SpinnerIcon /> : <LinkIcon />}
              {isSubmitting ? "提交中" : "提交链接"}
            </span>
          </Button>
        </div>
      </form>
    </DialogShell>
  );
}
