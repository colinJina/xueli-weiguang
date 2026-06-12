"use client";

import { useEffect, useRef, useState } from "react";
import ReactCrop, {
  centerCrop,
  convertToPixelCrop,
  makeAspectCrop,
  type Crop,
  type PixelCrop,
} from "react-image-crop";

import { Button } from "@/components/ui/button";
import { DialogShell } from "@/components/ui/dialog-shell";
import { FormMessage } from "@/components/ui/form-message";
import { cn } from "@/lib/utils";

const COVER_ASPECT = 16 / 9;
const OUTPUT_WIDTH = 1920;
const OUTPUT_HEIGHT = 1080;
const OUTPUT_MIME_TYPE = "image/jpeg";
const OUTPUT_QUALITY = 0.88;

export type CroppedImageResult = {
  file: File;
  objectUrl: string;
};

type ImageCropDialogProps = {
  file: File;
  onClose: () => void;
  onConfirm: (result: CroppedImageResult) => void;
  open: boolean;
};

function CropIcon() {
  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" viewBox="0 0 16 16">
      <path
        d="M5 2.5v8.5a1 1 0 0 0 1 1h8"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.4"
      />
      <path
        d="M2 5h8a1 1 0 0 1 1 1v8"
        stroke="currentColor"
        strokeLinecap="round"
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

function getCenteredAspectCrop(width: number, height: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: "%",
        width: 92,
      },
      COVER_ASPECT,
      width,
      height,
    ),
    width,
    height,
  );
}

function getCroppedFileName(fileName: string) {
  const name = fileName.replace(/\.[^.]+$/, "").trim() || "cover";
  return `${name}-16x9.jpg`;
}

async function createCroppedImageFile(input: {
  crop: PixelCrop;
  fileName: string;
  image: HTMLImageElement;
}) {
  const canvas = document.createElement("canvas");
  const scaleX = input.image.naturalWidth / input.image.width;
  const scaleY = input.image.naturalHeight / input.image.height;
  const cropX = input.crop.x * scaleX;
  const cropY = input.crop.y * scaleY;
  const cropWidth = input.crop.width * scaleX;
  const cropHeight = input.crop.height * scaleY;
  const context = canvas.getContext("2d");

  canvas.width = OUTPUT_WIDTH;
  canvas.height = OUTPUT_HEIGHT;

  if (!context) {
    throw new Error("浏览器暂不支持图片裁切。");
  }

  context.fillStyle = "#000";
  context.fillRect(0, 0, OUTPUT_WIDTH, OUTPUT_HEIGHT);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = "high";
  context.drawImage(
    input.image,
    cropX,
    cropY,
    cropWidth,
    cropHeight,
    0,
    0,
    OUTPUT_WIDTH,
    OUTPUT_HEIGHT,
  );

  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (nextBlob) => {
        if (nextBlob) {
          resolve(nextBlob);
          return;
        }

        reject(new Error("无法生成裁切后的封面。"));
      },
      OUTPUT_MIME_TYPE,
      OUTPUT_QUALITY,
    );
  });

  return new File([blob], getCroppedFileName(input.fileName), {
    type: OUTPUT_MIME_TYPE,
    lastModified: Date.now(),
  });
}

export function ImageCropDialog({ file, onClose, onConfirm, open }: ImageCropDialogProps) {
  const imageRef = useRef<HTMLImageElement | null>(null);
  const sourceUrlRef = useRef<string | null>(null);
  const [sourceUrl, setSourceUrl] = useState("");
  const [crop, setCrop] = useState<Crop>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop | null>(null);
  const [isCropping, setIsCropping] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    sourceUrlRef.current = objectUrl;
    setSourceUrl(objectUrl);
    setCrop(undefined);
    setCompletedCrop(null);
    setError("");

    return () => {
      URL.revokeObjectURL(objectUrl);
      sourceUrlRef.current = null;
    };
  }, [file, open]);

  if (!open) {
    return null;
  }

  async function confirmCrop() {
    const image = imageRef.current;

    if (!image || !completedCrop?.width || !completedCrop.height) {
      setError("请先调整并确认裁切区域。");
      return;
    }

    setIsCropping(true);
    setError("");

    try {
      const croppedFile = await createCroppedImageFile({
        crop: completedCrop,
        fileName: file.name,
        image,
      });
      const objectUrl = URL.createObjectURL(croppedFile);

      onConfirm({
        file: croppedFile,
        objectUrl,
      });
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "封面裁切失败，请重试。");
    } finally {
      setIsCropping(false);
    }
  }

  return (
    <DialogShell
      className="max-h-[calc(100vh-2rem)] overflow-y-auto"
      closeLabel="关闭封面裁切弹窗"
      description="拖动或缩放裁切框，输出封面会统一保存为 16:9。"
      maxWidthClassName="max-w-[860px]"
      onClose={isCropping ? () => undefined : onClose}
      title="裁切封面"
      titleAside={
        <span className="rounded-full border border-white/10 bg-white/[0.03] px-3 py-1 font-sans text-[11px] uppercase tracking-[0.18em] text-subtle">
          16:9
        </span>
      }
    >
      <div className="mt-6 space-y-5">
        <div className="overflow-hidden rounded-lg border border-border bg-black">
          <div className="flex max-h-[62vh] min-h-[240px] items-center justify-center p-3">
            {sourceUrl ? (
              <ReactCrop
                aspect={COVER_ASPECT}
                className={cn("max-h-[60vh] max-w-full")}
                crop={crop}
                keepSelection
                onChange={(_, percentCrop) => {
                  setCrop(percentCrop);
                  setError("");
                }}
                onComplete={(pixelCrop) => setCompletedCrop(pixelCrop)}
                ruleOfThirds
                style={
                  {
                    "--rc-border-color": "rgba(255, 255, 255, 0.78)",
                    "--rc-drag-handle-bg-colour": "rgba(0, 0, 0, 0.58)",
                    "--rc-focus-color": "#ffffff",
                  } as React.CSSProperties
                }
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt=""
                  className="max-h-[58vh] max-w-full"
                  onLoad={(event) => {
                    const { naturalHeight, naturalWidth } = event.currentTarget;
                    const nextCrop = getCenteredAspectCrop(naturalWidth, naturalHeight);

                    imageRef.current = event.currentTarget;
                    setCrop(nextCrop);
                    setCompletedCrop(convertToPixelCrop(nextCrop, naturalWidth, naturalHeight));
                  }}
                  src={sourceUrl}
                />
              </ReactCrop>
            ) : null}
          </div>
        </div>

        <div className="grid gap-3 text-xs leading-5 text-muted sm:grid-cols-3">
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
            输出尺寸 1920 x 1080
          </div>
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
            格式 JPG
          </div>
          <div className="rounded-lg border border-white/[0.08] bg-white/[0.03] px-3 py-2">
            适用于封面与首页精选
          </div>
        </div>

        {error ? (
          <FormMessage icon={<WarningIcon />} variant="error">
            {error}
          </FormMessage>
        ) : null}

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button disabled={isCropping} onClick={onClose} type="button" variant="secondary">
            重新选择
          </Button>
          <Button disabled={isCropping} onClick={confirmCrop} type="button">
            <span className="inline-flex items-center gap-2">
              <CropIcon />
              {isCropping ? "正在裁切" : "保存裁切"}
            </span>
          </Button>
        </div>
      </div>
    </DialogShell>
  );
}
