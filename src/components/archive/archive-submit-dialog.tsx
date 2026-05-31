"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { translateSubmissionError } from "@/lib/submissions/translate-submission-error";
import { cn } from "@/lib/utils";

type ArchiveSubmitDialogProps = {
  open: boolean;
  onClose: () => void;
};

type SubmissionStatus = "idle" | "submitting" | "success" | "error";

function CloseIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" viewBox="0 0 16 16">
      <path
        d="M4 4l8 8M12 4l-8 8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

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
    <p
      className={cn(
        "flex items-start gap-2 rounded-xl border px-4 py-3 text-sm",
        status === "error"
          ? "border-white/15 bg-white/[0.04] text-foreground"
          : "border-white/10 bg-white/[0.03] text-muted",
      )}
    >
      <span className="mt-0.5 text-foreground">{icon}</span>
      <span className="flex-1">{message}</span>
    </p>
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
    <div
      aria-modal="true"
      className="fixed inset-0 z-[90] flex items-center justify-center bg-black/82 px-5 py-8 backdrop-blur-sm"
      role="dialog"
    >
      <div aria-hidden="true" className="absolute inset-0" onClick={onClose} />

      <div className="relative z-[1] w-full max-w-[520px] rounded-2xl border border-border bg-background px-6 py-6 shadow-overlay sm:px-7">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-5">
          <div className="space-y-2">
            <p className="font-sans text-[11px] uppercase tracking-[0.28em] text-muted">
              ARCHIVE SUBMISSION
            </p>
            <div className="space-y-1">
              <h2 className="text-2xl font-black tracking-[-0.04em] text-foreground">
                推荐你喜欢的视频
              </h2>
              <p className="text-sm leading-6 text-muted">
                粘贴一条 Bilibili 视频链接。我们会先记录投稿，再进入人工审核。
              </p>
            </div>
          </div>

          <button
            aria-label="关闭投稿弹窗"
            className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border bg-surface text-muted transition hover:border-white/20 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20"
            onClick={onClose}
            type="button"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="mt-5 flex items-center gap-3 border-b border-border pb-4">
          <button
            aria-current="page"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-white bg-reverse px-4 text-sm font-semibold text-black"
            type="button"
          >
            <LinkIcon />
            输入链接
          </button>
        </div>

        <form className="mt-6 space-y-5" onSubmit={handleSubmit}>
          <div className="space-y-4 rounded-2xl border border-border bg-surface px-5 py-5">
            <label className="block space-y-2">
              <span className="inline-flex items-center gap-1.5 font-sans text-[11px] uppercase tracking-[0.22em] text-muted">
                <LinkIcon />
                BILIBILI URL
              </span>
              <input
                autoFocus
                className="h-12 w-full rounded-xl border border-border bg-background px-4 text-sm text-foreground outline-none transition placeholder:text-subtle focus:border-white/20"
                onChange={(event) => setUrl(event.target.value)}
                placeholder="https://www.bilibili.com/video/BV..."
                type="text"
                value={url}
              />
            </label>

            <p className="text-xs leading-6 text-subtle">
              支持完整视频链接、裸 BV 号，以及 `b23.tv` 短链接。
            </p>
          </div>

          {status === "submitting" || status === "success" || status === "error" ? (
            <StatusNotice message={message} status={status} />
          ) : null}

          <div className="flex justify-end">
            <Button className="rounded-xl" disabled={isSubmitting} type="submit">
              <span className="inline-flex items-center gap-2">
                {isSubmitting ? <SpinnerIcon /> : <LinkIcon />}
                {isSubmitting ? "提交中" : "提交链接"}
              </span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
