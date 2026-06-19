"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type COS from "cos-js-sdk-v5";

import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { DialogShell } from "@/components/ui/dialog-shell";
import { FormMessage } from "@/components/ui/form-message";
import {
  ImageCropDialog,
  type CroppedImageResult,
} from "@/components/ui/image-crop-dialog";
import { TextField } from "@/components/ui/text-field";
import { ADMIN_REQUIRED_MESSAGE } from "@/lib/auth/admin";
import { cn } from "@/lib/utils";
import { translateSubmissionError } from "@/lib/submissions/translate-submission-error";
import {
  ALLOWED_COVER_MIME_TYPES,
  ALLOWED_VIDEO_MIME_TYPES,
  NATIVE_COVER_MAX_BYTES,
  NATIVE_VIDEO_MAX_BYTES,
} from "@/lib/storage/types";
import {
  NATIVE_PENDING_SUBMISSION_LIMIT,
  NATIVE_UPLOAD_SESSION_LIMIT,
  type NativeCosUploadCredentialResponse,
  type NativeSubmissionApiErrorPayload,
} from "@/lib/submissions/types";

type ArchiveSubmitDialogProps = {
  open: boolean;
  onClose: () => void;
  allowNativeUpload?: boolean;
};

type SubmitMode = "link" | "upload";
type SubmissionStatus = "idle" | "submitting" | "success" | "error";

type UploadProgressInfo = {
  loaded?: number;
  total?: number;
  percent?: number;
};

const TITLE_MAX_LENGTH = 80;
const DESCRIPTION_MAX_LENGTH = 500;

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

function UploadIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
      <path d="M8 11V3.5" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" />
      <path
        d="M5.1 6.3 8 3.4l2.9 2.9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.5"
      />
      <path
        d="M3.3 10.4v1.1A2.2 2.2 0 0 0 5.5 13.7h5a2.2 2.2 0 0 0 2.2-2.2v-1.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.5"
      />
    </svg>
  );
}

function VideoIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
      <rect height="8.5" rx="1.8" stroke="currentColor" strokeWidth="1.35" width="10" x="2" y="3.8" />
      <path
        d="m12 6.2 2-1.1v5.8l-2-1.1"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.35"
      />
    </svg>
  );
}

function ImageIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
      <rect height="10" rx="1.8" stroke="currentColor" strokeWidth="1.35" width="11" x="2.5" y="3" />
      <circle cx="6" cy="6.3" r="1" fill="currentColor" />
      <path
        d="m3.2 11 3-2.9 2.1 1.8 1.5-1.4 3 2.6"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.35"
      />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4 flex-none" fill="none" viewBox="0 0 16 16">
      <rect height="7" rx="1.7" stroke="currentColor" strokeWidth="1.35" width="9" x="3.5" y="7" />
      <path
        d="M5.5 7V5.5A2.5 2.5 0 0 1 8 3a2.5 2.5 0 0 1 2.5 2.5V7"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.35"
      />
    </svg>
  );
}

function RetryIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
      <path
        d="M12.5 5.2A5 5 0 1 0 13 9"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
      <path
        d="M12.8 2.8v2.7h-2.7"
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

function ProgressBar({ value }: { value: number }) {
  return (
    <div className="h-1.5 overflow-hidden rounded-full bg-white/[0.08]" role="presentation">
      <div
        className="h-full rounded-full bg-foreground transition-[width] duration-200"
        style={{ width: `${Math.max(0, Math.min(100, value))}%` }}
      />
    </div>
  );
}

function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${Math.max(1, Math.round(bytes / 1024))}KB`;
  }

  return `${(bytes / 1024 / 1024).toFixed(1)}MB`;
}

function getProgressPercent(info: UploadProgressInfo) {
  if (typeof info.percent === "number") {
    return Math.round(info.percent * 100);
  }

  if (typeof info.loaded === "number" && typeof info.total === "number" && info.total > 0) {
    return Math.round((info.loaded / info.total) * 100);
  }

  return 0;
}

function parseNativeError(payload: NativeSubmissionApiErrorPayload | null) {
  if (!payload) {
    return "上传失败，请稍后重试。";
  }

  switch (payload.code) {
    case "UNAUTHENTICATED":
      return "请先登录后再投稿。";
    case "ADMIN_REQUIRED":
      return ADMIN_REQUIRED_MESSAGE;
    case "FILE_TOO_LARGE":
      if (payload.field === "cover") {
        return `封面文件不能超过 ${formatFileSize(payload.max ?? NATIVE_COVER_MAX_BYTES)}。`;
      }

      return `视频文件不能超过 ${formatFileSize(payload.max ?? NATIVE_VIDEO_MAX_BYTES)}。`;
    case "UNSUPPORTED_MIME":
      return "暂不支持该文件格式。";
    case "PENDING_QUOTA_EXCEEDED":
      return `当前有 ${payload.pending ?? NATIVE_PENDING_SUBMISSION_LIMIT} 条待审稿件，审核完成后可继续投稿。`;
    case "UPLOAD_SESSION_LIMIT_EXCEEDED":
      return `当前有 ${NATIVE_UPLOAD_SESSION_LIMIT} 个未完成上传，请完成或稍后再试。`;
    case "UPLOAD_SESSION_EXPIRED":
      return "上传凭证已过期，请重新选择文件上传。";
    case "OBJECT_NOT_FOUND":
      return "上传未完成，请重新上传。";
    case "MIME_MISMATCH":
      return "上传文件格式与提交信息不一致，请重新选择文件。";
    case "DUPLICATE_REF":
      return "该视频投稿已存在。";
    case "VALIDATION_FAILED":
      return payload.message ?? "请检查投稿信息后重试。";
    case "STORAGE_UNAVAILABLE":
      return "视频存储服务暂不可用，请稍后重试。";
    default:
      return payload.message ?? "上传失败，请稍后重试。";
  }
}

function isAllowedFile(file: File, allowedMimeTypes: readonly string[]) {
  return allowedMimeTypes.includes(file.type);
}

function FileDropZone({
  accept,
  disabled,
  file,
  helper,
  icon,
  inputRef,
  label,
  onFileChange,
  previewUrl,
  progress,
}: {
  accept: string;
  disabled: boolean;
  file: File | null;
  helper: string;
  icon: React.ReactNode;
  inputRef: React.RefObject<HTMLInputElement | null>;
  label: string;
  onFileChange: (file: File | null) => void;
  previewUrl?: string | null;
  progress: number;
}) {
  function handleFiles(files: FileList | null) {
    onFileChange(files?.[0] ?? null);
  }

  return (
    <div
      className={cn(
        "rounded-lg border border-dashed border-white/14 bg-white/[0.025] p-4 transition",
        disabled ? "opacity-60" : "hover:border-white/24 hover:bg-white/[0.04]",
      )}
      onDragOver={(event) => {
        if (disabled) {
          return;
        }
        event.preventDefault();
      }}
      onDrop={(event) => {
        if (disabled) {
          return;
        }
        event.preventDefault();
        handleFiles(event.dataTransfer.files);
      }}
    >
      <input
        accept={accept}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => handleFiles(event.target.files)}
        ref={inputRef}
        type="file"
      />

      <button
        className="flex w-full items-start gap-4 text-left disabled:cursor-not-allowed"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-foreground">
          {icon}
        </span>
        <span className="min-w-0 flex-1 space-y-2">
          <span className="block text-sm font-bold text-foreground">{label}</span>
          <span className="block text-xs leading-5 text-muted">{helper}</span>
          {file ? (
            <span className="flex min-w-0 items-center gap-3 text-xs text-subtle">
              {previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  alt=""
                  className="h-10 w-[72px] shrink-0 rounded-sm border border-white/10 object-cover"
                  src={previewUrl}
                />
              ) : null}
              <span className="block min-w-0">
                <span className="block truncate text-foreground">{file.name}</span>
                <span>{formatFileSize(file.size)}</span>
              </span>
            </span>
          ) : null}
        </span>
      </button>

      {progress > 0 ? (
        <div className="mt-4 space-y-2">
          <ProgressBar value={progress} />
          <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.18em] text-subtle">
            <span>上传进度</span>
            <span>{progress}%</span>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function ArchiveSubmitDialog({
  open,
  onClose,
  allowNativeUpload = false,
}: ArchiveSubmitDialogProps) {
  const [mode, setMode] = useState<SubmitMode>("link");
  const [url, setUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreviewUrl, setCoverPreviewUrl] = useState<string | null>(null);
  const [cropSourceFile, setCropSourceFile] = useState<File | null>(null);
  const [featureOnHome, setFeatureOnHome] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [coverProgress, setCoverProgress] = useState(0);
  const [status, setStatus] = useState<SubmissionStatus>("idle");
  const [message, setMessage] = useState("");
  const videoInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setMode("link");
      setUrl("");
      setTitle("");
      setDescription("");
      setVideoFile(null);
      setCoverFile(null);
      setCropSourceFile(null);
      setFeatureOnHome(false);
      setVideoProgress(0);
      setCoverProgress(0);
      setStatus("idle");
      setMessage("");
    }
  }, [open]);

  useEffect(() => {
    if (!open || allowNativeUpload) {
      return;
    }
    setMode("link");
    setVideoFile(null);
    setCoverFile(null);
    setCropSourceFile(null);
    setFeatureOnHome(false);
    setVideoProgress(0);
    setCoverProgress(0);
    setStatus("idle");
    setMessage("");
  }, [allowNativeUpload, open]);

  useEffect(() => {
    return () => {
      if (coverPreviewUrl) {
        URL.revokeObjectURL(coverPreviewUrl);
      }
    };
  }, [coverPreviewUrl]);

  const nativeDisabledReason = useMemo(() => {
    if (!allowNativeUpload) {
      return ADMIN_REQUIRED_MESSAGE;
    }

    const trimmedTitle = title.trim();

    if (status === "submitting") {
      return "视频上传中";
    }

    if (!trimmedTitle) {
      return "标题不能为空";
    }

    if (trimmedTitle.length > TITLE_MAX_LENGTH) {
      return "标题不能超过 80 字";
    }

    if (description.trim().length > DESCRIPTION_MAX_LENGTH) {
      return "简介不能超过 500 字";
    }

    if (!videoFile) {
      return "请先选择视频文件";
    }

    if (!isAllowedFile(videoFile, ALLOWED_VIDEO_MIME_TYPES)) {
      return "视频仅支持 MP4/WebM";
    }

    if (videoFile.size > NATIVE_VIDEO_MAX_BYTES) {
      return "视频文件不能超过 50MB";
    }

    if (!coverFile) {
      return "请先裁切封面图";
    }

    if (!isAllowedFile(coverFile, ALLOWED_COVER_MIME_TYPES)) {
      return "封面仅支持 JPG/PNG/WebP";
    }

    if (coverFile.size <= 0) {
      return "封面文件不能为空";
    }

    if (coverFile.size > NATIVE_COVER_MAX_BYTES) {
      return "封面文件不能超过 5MB";
    }

    return "";
  }, [allowNativeUpload, coverFile, description, status, title, videoFile]);

  if (!open) {
    return null;
  }

  function resetMessage() {
    if (status !== "submitting") {
      setStatus("idle");
      setMessage("");
    }
  }

  function switchMode(nextMode: SubmitMode) {
    if (status === "submitting") {
      return;
    }
    if (!allowNativeUpload && nextMode === "upload") {
      return;
    }
    setMode(nextMode);
    setStatus("idle");
    setMessage("");
  }

  function clearCoverPreview() {
    if (coverPreviewUrl) {
      URL.revokeObjectURL(coverPreviewUrl);
    }
    setCoverPreviewUrl(null);
  }

  function handleCoverSourceChange(file: File | null) {
    clearCoverPreview();
    setCoverFile(null);
    setCoverProgress(0);

    if (!file) {
      setCropSourceFile(null);
      resetMessage();
      return;
    }

    if (!isAllowedFile(file, ALLOWED_COVER_MIME_TYPES)) {
      setCropSourceFile(null);
      setStatus("error");
      setMessage("封面仅支持 JPG/PNG/WebP");
      return;
    }

    setCropSourceFile(file);
    resetMessage();
  }

  function handleCoverCropConfirm(result: CroppedImageResult) {
    clearCoverPreview();
    setCoverFile(result.file);
    setCoverPreviewUrl(result.objectUrl);
    setCoverProgress(0);
    setCropSourceFile(null);
    resetMessage();
  }

  async function handleLinkSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!url.trim()) {
      setStatus("error");
      setMessage("请输入有效的 Bilibili 或 YouTube 视频链接。");
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

  async function uploadObject(input: {
    cos: COS;
    bucket: string;
    region: string;
    key: string;
    file: File;
    onProgress: (value: number) => void;
  }) {
    input.onProgress(1);

    await input.cos.putObject({
      Bucket: input.bucket,
      Region: input.region,
      Key: input.key,
      Body: input.file,
      ContentLength: input.file.size,
      ContentType: input.file.type,
      onProgress(progressData) {
        input.onProgress(getProgressPercent(progressData));
      },
    });

    input.onProgress(100);
  }

  async function requestUploadCredential(input: {
    videoMimeType: string;
    videoSize: number;
    coverMimeType: string;
    featureOnHome: boolean;
  }) {
    const response = await fetch("/api/submissions/native/cos/upload-signature", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    const payload = (await response.json().catch(() => null)) as
      | NativeCosUploadCredentialResponse
      | NativeSubmissionApiErrorPayload
      | null;

    if (!response.ok) {
      throw new Error(parseNativeError(payload as NativeSubmissionApiErrorPayload | null));
    }

    return payload as NativeCosUploadCredentialResponse;
  }

  async function completeNativeUpload(input: {
    submissionId: string;
    videoKey: string;
    coverKey: string;
    title: string;
    description: string | null;
    videoSize: number;
    videoMimeType: string;
    coverMimeType: string;
    featureOnHome: boolean;
  }) {
    const response = await fetch("/api/submissions/native/complete", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(input),
    });

    const payload = (await response.json().catch(() => null)) as
      | NativeSubmissionApiErrorPayload
      | null;

    if (!response.ok) {
      throw new Error(parseNativeError(payload));
    }
  }

  async function handleNativeSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!allowNativeUpload || nativeDisabledReason || !videoFile || !coverFile) {
      setStatus("error");
      setMessage(nativeDisabledReason || "请检查投稿信息后重试。");
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    setStatus("submitting");
    setMessage("正在申请上传凭证。");
    setVideoProgress(0);
    setCoverProgress(0);

    try {
      const credentialResponse = await requestUploadCredential({
        videoMimeType: videoFile.type,
        videoSize: videoFile.size,
        coverMimeType: coverFile.type,
        featureOnHome,
      });

      setMessage("正在上传视频和封面。");

      const { default: CosConstructor } = await import("cos-js-sdk-v5");
      const cos = new CosConstructor({
        SecretId: credentialResponse.credential.tmpSecretId,
        SecretKey: credentialResponse.credential.tmpSecretKey,
        SecurityToken: credentialResponse.credential.sessionToken,
        StartTime: credentialResponse.credential.startTime,
        ExpiredTime: credentialResponse.credential.expiredTime,
      });

      await uploadObject({
        cos,
        bucket: credentialResponse.bucket,
        region: credentialResponse.region,
        key: credentialResponse.videoKey,
        file: videoFile,
        onProgress: setVideoProgress,
      });
      await uploadObject({
        cos,
        bucket: credentialResponse.bucket,
        region: credentialResponse.region,
        key: credentialResponse.coverKey,
        file: coverFile,
        onProgress: setCoverProgress,
      });

      setMessage("正在登记投稿信息。");

      await completeNativeUpload({
        submissionId: credentialResponse.submissionId,
        videoKey: credentialResponse.videoKey,
        coverKey: credentialResponse.coverKey,
        title: trimmedTitle,
        description: trimmedDescription || null,
        videoSize: videoFile.size,
        videoMimeType: videoFile.type,
        coverMimeType: coverFile.type,
        featureOnHome,
      });

      setTitle("");
      setDescription("");
      setVideoFile(null);
      setCoverFile(null);
      clearCoverPreview();
      setFeatureOnHome(false);
      setVideoProgress(0);
      setCoverProgress(0);
      setStatus("success");
      setMessage("已收到本地视频投稿，待审核。");
    } catch (error) {
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "上传失败，请稍后重试。");
    }
  }

  const isSubmitting = status === "submitting";
  const isNativeSubmitDisabled = Boolean(nativeDisabledReason);
  const dialogDescription =
    allowNativeUpload && mode === "upload"
      ? "上传本地视频与封面。文件会直传至 COS，审核通过前不会进入公开视频库。"
      : "粘贴一条 Bilibili 或 YouTube 视频链接。我们会先记录投稿，再进入人工审核。";

  return (
    <DialogShell
      className="max-h-[calc(100vh-2rem)] overflow-y-auto"
      closeLabel="关闭投稿弹窗"
      description={dialogDescription}
      maxWidthClassName="max-w-[640px]"
      onClose={onClose}
      title="推荐你喜欢的视频"
    >
      <div className="mt-5 flex items-center gap-3 border-b border-border pb-4">
        {allowNativeUpload ? (
          <>
            <button
              aria-current={mode === "link" ? "page" : undefined}
              disabled={isSubmitting}
              onClick={() => switchMode("link")}
              type="button"
            >
              <Chip size="md" variant={mode === "link" ? "selected" : "default"}>
                <span className="inline-flex items-center gap-1.5">
                  <LinkIcon />
                  视频链接
                </span>
              </Chip>
            </button>
            <button
              aria-current={mode === "upload" ? "page" : undefined}
              disabled={isSubmitting}
              onClick={() => switchMode("upload")}
              type="button"
            >
              <Chip size="md" variant={mode === "upload" ? "selected" : "default"}>
                <span className="inline-flex items-center gap-1.5">
                  <UploadIcon />
                  上传视频
                </span>
              </Chip>
            </button>
          </>
        ) : (
          <Chip size="md" variant="selected">
            <span className="inline-flex items-center gap-1.5">
              <LinkIcon />
              视频链接
            </span>
          </Chip>
        )}
      </div>

      {!allowNativeUpload || mode === "link" ? (
        <form className="mt-6 space-y-5" onSubmit={handleLinkSubmit}>
          <div className="space-y-4 rounded-lg border border-border bg-surface px-5 py-5">
            <TextField
              autoFocus
              icon={<LinkIcon />}
              label="VIDEO URL"
              onChange={(event) => {
                setUrl(event.target.value);
                resetMessage();
              }}
              placeholder="https://www.youtube.com/watch?v=..."
              type="text"
              value={url}
            />

            <p className="text-xs leading-6 text-subtle">
              支持 Bilibili 完整链接或裸 BV 号，以及 YouTube watch、shorts、embed、youtu.be 链接。
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
      ) : (
        <form className="mt-6 space-y-5" onSubmit={handleNativeSubmit}>
          <div className="space-y-4 rounded-lg border border-border bg-surface px-5 py-5">
            <TextField
              autoFocus
              disabled={isSubmitting}
              icon={<UploadIcon />}
              label="标题"
              maxLength={TITLE_MAX_LENGTH}
              onChange={(event) => {
                setTitle(event.target.value);
                resetMessage();
              }}
              placeholder="给这条视频起一个标题"
              type="text"
              value={title}
            />
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-3">
                <label
                  className="inline-flex items-center gap-1.5 font-sans text-[11px] uppercase tracking-[0.22em] text-muted"
                  htmlFor="native-upload-description"
                >
                  <LinkIcon />
                  简介
                </label>
                <span className="text-[11px] text-subtle">
                  {description.trim().length}/{DESCRIPTION_MAX_LENGTH}
                </span>
              </div>
              <textarea
                className="min-h-24 w-full resize-none rounded-md border border-border bg-surface px-4 py-3 text-sm leading-6 text-foreground outline-none transition placeholder:text-subtle focus:border-borderStrong focus:bg-panel disabled:opacity-60"
                disabled={isSubmitting}
                id="native-upload-description"
                maxLength={DESCRIPTION_MAX_LENGTH}
                onChange={(event) => {
                  setDescription(event.target.value);
                  resetMessage();
                }}
                placeholder="写下推荐理由或视频简介"
                value={description}
              />
            </div>

            <FileDropZone
              accept="video/mp4,video/webm"
              disabled={isSubmitting}
              file={videoFile}
              helper="拖入或点击选择，MP4/WebM，最大 50MB"
              icon={<VideoIcon />}
              inputRef={videoInputRef}
              label="视频文件"
              onFileChange={(file) => {
                setVideoFile(file);
                setVideoProgress(0);
                resetMessage();
              }}
              progress={videoProgress}
            />

            <FileDropZone
              accept="image/jpeg,image/png,image/webp"
              disabled={isSubmitting}
              file={coverFile}
              helper="拖入或点击选择，JPG/PNG/WebP，随后裁切为 16:9"
              icon={<ImageIcon />}
              inputRef={coverInputRef}
              label="封面图"
              onFileChange={handleCoverSourceChange}
              previewUrl={coverPreviewUrl}
              progress={coverProgress}
            />

            <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/[0.08] bg-white/[0.025] p-4 transition hover:border-white/20 hover:bg-white/[0.04]">
              <input
                checked={featureOnHome}
                className="mt-1 h-4 w-4 accent-white"
                disabled={isSubmitting}
                onChange={(event) => {
                  setFeatureOnHome(event.target.checked);
                  resetMessage();
                }}
                type="checkbox"
              />
              <span className="space-y-1">
                <span className="block text-sm font-bold text-foreground">
                  推送为首页精选
                </span>
                <span className="block text-xs leading-5 text-muted">
                  审核通过后，这条视频的 16:9 封面会作为首页 Hero 视觉候选。
                </span>
              </span>
            </label>
          </div>

          {status === "submitting" || status === "success" || status === "error" ? (
            <StatusNotice message={message} status={status} />
          ) : null}

          <div className="flex flex-col items-stretch gap-3 sm:flex-row sm:items-center sm:justify-between">
            {isNativeSubmitDisabled ? (
              <div className="inline-flex items-center gap-2 rounded-md border border-white/10 bg-white/[0.03] px-3 py-2 text-xs text-muted">
                <LockIcon />
                <span>{nativeDisabledReason}</span>
              </div>
            ) : (
              <div className="inline-flex items-center gap-2 text-xs text-subtle">
                <SuccessIcon />
                <span>信息已就绪</span>
              </div>
            )}

            <Button disabled={isNativeSubmitDisabled} type="submit">
              <span className="inline-flex items-center gap-2">
                {isSubmitting ? (
                  <SpinnerIcon />
                ) : status === "error" ? (
                  <RetryIcon />
                ) : (
                  <UploadIcon />
                )}
                {isSubmitting ? "上传中" : status === "error" ? "重新上传" : "提交视频"}
              </span>
            </Button>
          </div>
        </form>
      )}

      {cropSourceFile ? (
        <ImageCropDialog
          file={cropSourceFile}
          onClose={() => setCropSourceFile(null)}
          onConfirm={handleCoverCropConfirm}
          open
        />
      ) : null}
    </DialogShell>
  );
}
