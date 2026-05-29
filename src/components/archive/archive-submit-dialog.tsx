"use client";

import { Button } from "@/components/ui/button";

type ArchiveSubmitDialogProps = {
  open: boolean;
  onClose: () => void;
};

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

function LargeLinkArtwork() {
  return (
    <svg
      aria-hidden="true"
      className="h-14 w-14 text-muted"
      fill="none"
      viewBox="0 0 56 56"
    >
      <circle cx="28" cy="28" r="22" stroke="currentColor" strokeOpacity="0.18" strokeWidth="1" />
      <circle
        cx="28"
        cy="28"
        r="15"
        stroke="currentColor"
        strokeDasharray="2 4"
        strokeOpacity="0.3"
        strokeWidth="1"
      >
        <animateTransform
          attributeName="transform"
          dur="22s"
          from="0 28 28"
          repeatCount="indefinite"
          to="360 28 28"
          type="rotate"
        />
      </circle>
      <path
        d="M22 28h-3.5A3.5 3.5 0 0 1 15 24.5v-1A3.5 3.5 0 0 1 18.5 20H22"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
      <path
        d="M34 28h3.5A3.5 3.5 0 0 0 41 24.5v-1A3.5 3.5 0 0 0 37.5 20H34"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.6"
      />
      <path d="M20 28h16" stroke="currentColor" strokeLinecap="round" strokeWidth="1.6" />
      <path
        d="M22 36h-3.5A3.5 3.5 0 0 1 15 32.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeOpacity="0.45"
        strokeWidth="1.4"
      />
      <path
        d="M34 36h3.5A3.5 3.5 0 0 0 41 32.5"
        stroke="currentColor"
        strokeLinecap="round"
        strokeOpacity="0.45"
        strokeWidth="1.4"
      />
    </svg>
  );
}

export function ArchiveSubmitDialog({ open, onClose }: ArchiveSubmitDialogProps) {
  if (!open) {
    return null;
  }

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
                通过链接将作品提交到档案。我们会人工审核后纳入精选档案。
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

        <div className="mt-6 space-y-5">
          <div className="relative overflow-hidden rounded-2xl border border-border bg-surface px-5 py-8">
            <div className="flex flex-col items-center gap-3 text-center">
              <LargeLinkArtwork />
              <div className="space-y-1">
                <p className="text-sm font-semibold text-foreground">链接投稿入口即将开放</p>
                <p className="text-xs leading-6 text-subtle">
                  我们正在打磨链接解析与审核流水线，敬请稍候。
                </p>
              </div>
            </div>
            <div
              aria-hidden="true"
              className="pointer-events-none absolute inset-x-0 -bottom-1 h-px bg-gradient-to-r from-transparent via-white/15 to-transparent"
            />
          </div>

          <div className="flex justify-end">
            <Button
              aria-disabled="true"
              className="rounded-xl"
              disabled
              type="button"
              variant="secondary"
            >
              <span className="inline-flex items-center gap-2">
                <LinkIcon />
                敬请期待
              </span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
