"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type COS from "cos-js-sdk-v5";

import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Chip } from "@/components/ui/chip";
import { DialogShell } from "@/components/ui/dialog-shell";
import { FormMessage } from "@/components/ui/form-message";
import ImageIcon from "@/components/icons/archive/image-file.svg";
import LinkIcon from "@/components/icons/archive/link.svg";
import LockIcon from "@/components/icons/archive/lock.svg";
import RetryIcon from "@/components/icons/shared/retry.svg";
import UploadIcon from "@/components/icons/shared/upload.svg";
import VideoIcon from "@/components/icons/archive/video-file.svg";
import SpinnerIcon from "@/components/icons/shared/spinner-16.svg";
import SuccessIcon from "@/components/icons/shared/check-circle.svg";
import WarningIcon from "@/components/icons/shared/alert-circle.svg";
import {
  ImageCropDialog,
  type CroppedImageResult,
} from "@/components/ui/image-crop-dialog";
import { TextField } from "@/components/ui/text-field";
import { ADMIN_REQUIRED_MESSAGE } from "@/lib/auth/admin";
import { cn } from "@/lib/utils";
import { translateSubmissionError } from "@/lib/submissions/translate-submission-error";
import { getNativeVideoMimeType } from "@/lib/storage/native-video-file";
import {
  ALLOWED_COVER_MIME_TYPES,
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
      variant={
        status === "error"
          ? "error"
          : status === "submitting"
            ? "loading"
            : "success"
      }
    >
      {message}
    </FormMessage>
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

  if (
    typeof info.loaded === "number" &&
    typeof info.total === "number" &&
    info.total > 0
  ) {
    return Math.round((info.loaded / info.total) * 100);
  }

  return 0;
}

function parseNativeError(payload: NativeSubmissionApiErrorPayload | null) {
  if (!payload) {
    return "上传失败，请稍后重试";
  }

  switch (payload.code) {
    case "UNAUTHENTICATED":
      return "请先登录后再投稿";
    case "ADMIN_REQUIRED":
      return ADMIN_REQUIRED_MESSAGE;
    case "FILE_TOO_LARGE":
      if (payload.field === "cover") {
        return `封面文件不能超过 ${formatFileSize(payload.max ?? NATIVE_COVER_MAX_BYTES)}`;
      }

      return `PV 文件不能超过 ${formatFileSize(payload.max ?? NATIVE_VIDEO_MAX_BYTES)}`;
    case "UNSUPPORTED_MIME":
      return "暂不支持该文件格式";
    case "PENDING_QUOTA_EXCEEDED":
      return `当前有 ${payload.pending ?? NATIVE_PENDING_SUBMISSION_LIMIT} 条待审核的投稿，审核完成后可继续投稿`;
    case "UPLOAD_SESSION_LIMIT_EXCEEDED":
      return `当前有 ${NATIVE_UPLOAD_SESSION_LIMIT} 个未完成上传，请完成或稍后再试`;
    case "UPLOAD_SESSION_EXPIRED":
      return "上传已过期，请重新选择文件";
    case "OBJECT_NOT_FOUND":
      return "上传未完成，请重新上传";
    case "MIME_MISMATCH":
      return "上传文件格式与提交信息不一致，请重新选择文件";
    case "DUPLICATE_REF":
      return "该 PV 投稿已存在";
    case "VALIDATION_FAILED":
      return payload.message ?? "请检查投稿信息后重试";
    case "STORAGE_UNAVAILABLE":
      return "暂时无法上传，请稍后重试";
    default:
      return "上传失败，请稍后重试";
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
        "rounded-lg border border-dashed border-white/[0.14] bg-white/[0.025] p-4 transition",
        disabled ? "opacity-60" : "hover:border-white/[0.24] hover:bg-white/[0.04]",
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
      <Input
        aria-label={label}
        accept={accept}
        className="sr-only"
        disabled={disabled}
        onChange={(event) => handleFiles(event.target.files)}
        ref={inputRef}
        type="file"
      />

      <Button
        size="sm"
        variant="unstyled"
        className="flex w-full items-start justify-start gap-4 p-0 text-left disabled:cursor-not-allowed"
        disabled={disabled}
        onClick={() => inputRef.current?.click()}
        type="button"
      >
        <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-border bg-surface text-foreground">
          {icon}
        </span>
        <span className="min-w-0 flex-1 space-y-2">
          <span className="block text-sm font-bold text-foreground">
            {label}
          </span>
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
                <span className="block truncate text-foreground">
                  {file.name}
                </span>
                <span>{formatFileSize(file.size)}</span>
              </span>
            </span>
          ) : null}
        </span>
      </Button>

      {progress > 0 ? (
        <div className="mt-4 space-y-2">
          <Progress aria-label={`${label}上传进度`} value={progress} />
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

  const videoMimeType = videoFile ? getNativeVideoMimeType(videoFile) : null;

  const nativeDisabledReason = useMemo(() => {
    if (!allowNativeUpload) {
      return ADMIN_REQUIRED_MESSAGE;
    }

    const trimmedTitle = title.trim();

    if (status === "submitting") {
      return "PV 上传中";
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
      return "请先选择 PV 文件";
    }

    if (!videoMimeType) {
      return "PV 仅支持 MP4/WebM，请先转换格式后再上传";
    }

    if (videoFile.size <= 0) {
      return "PV 文件不能为空";
    }

    if (videoFile.size > NATIVE_VIDEO_MAX_BYTES) {
      return "PV 文件不能超过 50MB";
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
  }, [allowNativeUpload, coverFile, description, status, title, videoFile, videoMimeType]);

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
      setMessage("请输入有效的 Bilibili 或 YouTube PV 链接");
      return;
    }

    setStatus("submitting");
    setMessage("正在提交链接，请稍候");

    try {
      const response = await fetch("/api/submissions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url: url.trim() }),
      });

      const payload = (await response.json().catch(() => null)) as {
        message?: string;
      } | null;

      if (!response.ok) {
        throw new Error(payload?.message ?? "投稿失败，请稍后重试");
      }

      setUrl("");
      setStatus("success");
      setMessage("投稿已收到，等待审核");
    } catch (error) {
      setStatus("error");
      setMessage(
        translateSubmissionError(
          error instanceof Error ? error.message : "投稿失败，请稍后重试",
        ),
      );
    }
  }

  async function uploadObject(input: {
    cos: COS;
    bucket: string;
    region: string;
    key: string;
    file: File;
    contentType: string;
    onProgress: (value: number) => void;
  }) {
    input.onProgress(1);

    await input.cos.putObject({
      Bucket: input.bucket,
      Region: input.region,
      Key: input.key,
      Body: input.file,
      ContentLength: input.file.size,
      ContentType: input.contentType,
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
    const response = await fetch(
      "/api/submissions/native/cos/upload-signature",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      },
    );

    const payload = (await response.json().catch(() => null)) as
      | NativeCosUploadCredentialResponse
      | NativeSubmissionApiErrorPayload
      | null;

    if (!response.ok) {
      throw new Error(
        parseNativeError(payload as NativeSubmissionApiErrorPayload | null),
      );
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

    const payload = (await response
      .json()
      .catch(() => null)) as NativeSubmissionApiErrorPayload | null;

    if (!response.ok) {
      throw new Error(parseNativeError(payload));
    }
  }

  async function handleNativeSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (
      !allowNativeUpload ||
      nativeDisabledReason ||
      !videoFile ||
      !videoMimeType ||
      !coverFile
    ) {
      setStatus("error");
      setMessage(nativeDisabledReason || "请检查投稿信息后重试");
      return;
    }

    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    setStatus("submitting");
    setMessage("正在准备上传");
    setVideoProgress(0);
    setCoverProgress(0);

    try {
      const credentialResponse = await requestUploadCredential({
        videoMimeType,
        videoSize: videoFile.size,
        coverMimeType: coverFile.type,
        featureOnHome,
      });

      setMessage("正在上传 PV 和封面");

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
        contentType: videoMimeType,
        onProgress: setVideoProgress,
      });
      await uploadObject({
        cos,
        bucket: credentialResponse.bucket,
        region: credentialResponse.region,
        key: credentialResponse.coverKey,
        file: coverFile,
        contentType: coverFile.type,
        onProgress: setCoverProgress,
      });

      setMessage("正在提交投稿");

      await completeNativeUpload({
        submissionId: credentialResponse.submissionId,
        videoKey: credentialResponse.videoKey,
        coverKey: credentialResponse.coverKey,
        title: trimmedTitle,
        description: trimmedDescription || null,
        videoSize: videoFile.size,
        videoMimeType,
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
      setMessage("投稿已收到，等待审核");
    } catch (error) {
      setStatus("error");
      setMessage(
        translateSubmissionError(
          error instanceof Error ? error.message : null,
          "上传失败，请稍后重试",
        ),
      );
    }
  }

  const isSubmitting = status === "submitting";
  const isNativeSubmitDisabled = Boolean(nativeDisabledReason);
  const dialogDescription =
    allowNativeUpload && mode === "upload"
      ? "上传 PV 文件和封面，审核通过后收录"
      : "提交 Bilibili 或 YouTube 链接，审核通过后收录";

  return (
    <DialogShell
      className="max-h-[calc(100vh-2rem)] overflow-y-auto"
      closeLabel="关闭投稿弹窗"
      description={dialogDescription}
      maxWidthClassName="max-w-[640px]"
      onClose={onClose}
      title="投稿 PV"
    >
      <Tabs
        value={!allowNativeUpload ? "link" : mode}
        onValueChange={(next) => {
          if (next === "link" || next === "upload") {
            switchMode(next);
          }
        }}
      >
        {allowNativeUpload ? (
          <TabsList
            aria-label="投稿方式"
            className="mt-5 justify-start border-b border-border pb-4"
          >
            <TabsTrigger disabled={isSubmitting} value="link">
              <LinkIcon />
              链接投稿
            </TabsTrigger>
            <TabsTrigger disabled={isSubmitting} value="upload">
              <UploadIcon />
              本地上传
            </TabsTrigger>
          </TabsList>
        ) : (
          <div className="mt-5 border-b border-border pb-4">
            <Chip size="md" variant="selected">
              <LinkIcon />
              链接投稿
            </Chip>
          </div>
        )}
        <TabsContent value={!allowNativeUpload ? "link" : mode}>
          {!allowNativeUpload || mode === "link" ? (
            <form className="mt-6 space-y-5" onSubmit={handleLinkSubmit}>
              <div className="space-y-4 rounded-lg border border-border bg-surface px-5 py-5">
                <TextField
                  icon={<LinkIcon />}
                  label="PV 链接"
                  onChange={(event) => {
                    setUrl(event.target.value);
                    resetMessage();
                  }}
                  placeholder="https://www.youtube.com/watch?v=..."
                  type="text"
                  value={url}
                />

                <p className="text-xs leading-6 text-subtle">
                  支持 Bilibili 链接或 BV 号，以及 YouTube 链接
                </p>
              </div>

              {status === "submitting" ||
              status === "success" ||
              status === "error" ? (
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
                  disabled={isSubmitting}
                  icon={<UploadIcon />}
                  label="标题"
                  maxLength={TITLE_MAX_LENGTH}
                  onChange={(event) => {
                    setTitle(event.target.value);
                    resetMessage();
                  }}
                  placeholder="输入 PV 标题"
                  type="text"
                  value={title}
                />
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-3">
                    <Label
                      className="inline-flex items-center gap-1.5 font-sans text-[11px] uppercase tracking-[0.22em] text-muted"
                      htmlFor="native-upload-description"
                    >
                      <LinkIcon />
                      简介
                    </Label>
                    <span className="text-[11px] text-subtle">
                      {description.trim().length}/{DESCRIPTION_MAX_LENGTH}
                    </span>
                  </div>
                  <Textarea
                    className="min-h-24 w-full resize-none rounded-md border border-border bg-surface px-4 py-3 text-sm leading-6 text-foreground outline-none transition placeholder:text-subtle focus:border-borderStrong focus:bg-panel disabled:opacity-60"
                    disabled={isSubmitting}
                    id="native-upload-description"
                    maxLength={DESCRIPTION_MAX_LENGTH}
                    onChange={(event) => {
                      setDescription(event.target.value);
                      resetMessage();
                    }}
                    placeholder="填写 PV 简介或推荐理由"
                    value={description}
                  />
                </div>

                <FileDropZone
                  accept=".mp4,.webm,video/mp4,video/webm"
                  disabled={isSubmitting}
                  file={videoFile}
                  helper="拖入或点击选择，MP4/WebM，最大 50MB"
                  icon={<VideoIcon />}
                  inputRef={videoInputRef}
                  label="PV 文件"
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

                <Label className="flex cursor-pointer items-start gap-3 rounded-lg border border-white/[0.08] bg-white/[0.025] p-4 transition hover:border-white/20 hover:bg-white/[0.04]">
                  <Checkbox
                    checked={featureOnHome}
                    className="mt-1"
                    disabled={isSubmitting}
                    onCheckedChange={(checked) => {
                      setFeatureOnHome(checked === true);
                      resetMessage();
                    }}
                  />
                  <span className="space-y-1">
                    <span className="block text-sm font-bold text-foreground">
                      申请首页展示
                    </span>
                    <span className="block text-xs leading-5 text-muted">
                      审核通过后可用于首页展示
                    </span>
                  </span>
                </Label>
              </div>

              {status === "submitting" ||
              status === "success" ||
              status === "error" ? (
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
                    {isSubmitting
                      ? "上传中"
                      : status === "error"
                        ? "重新上传"
                        : "提交 PV"}
                  </span>
                </Button>
              </div>
            </form>
          )}
        </TabsContent>
      </Tabs>

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
