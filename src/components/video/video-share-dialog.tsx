"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";

import { Button } from "@/components/ui/button";
import { DialogShell } from "@/components/ui/dialog-shell";
import { FormMessage } from "@/components/ui/form-message";
import { InlineLoadingMark } from "@/components/ui/inline-loading-mark";
import { useVideoShareAssets } from "@/components/video/use-video-share-assets";
import { VideoShareCard } from "@/components/video/video-share-card";
import { VideoShareLinkRow } from "@/components/video/video-share-link-row";
import AlertIcon from "@/components/icons/shared/alert-circle.svg";
import ShareIcon from "@/components/icons/video/share.svg";
import {
  getVideoShareSource,
  getVideoShareUrl,
  type VideoShareData,
} from "@/lib/videos/share";
import { downloadShareImage, exportShareCard } from "@/lib/videos/share-image";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";

const tabs = [
  { id: "link", label: "链接分享" },
  { id: "image", label: "图片分享" },
] as const;
type ShareTab = (typeof tabs)[number]["id"];

export function VideoShareDialog({
  video,
  onClose,
}: {
  video: VideoShareData;
  onClose: () => void;
}) {
  const cardRef = useRef<HTMLElement>(null);
  const mountedRef = useRef(true);
  const imageUrlRef = useRef<string | null>(null);
  const [shareUrl] = useState(() =>
    getVideoShareUrl(window.location.href, video.id),
  );
  const [activeTab, setActiveTab] = useState<ShareTab>("link");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<{
    url: string;
    width: number;
    height: number;
  } | null>(null);
  const { qrCode, cover, retryQrCode } = useVideoShareAssets(
    shareUrl,
    video.coverImageUrl,
  );
  const source = getVideoShareSource(video);
  const isReady = qrCode.status === "ready" && cover.status !== "loading";
  const canSystemShare = typeof navigator.share === "function";

  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (imageUrlRef.current) {
        URL.revokeObjectURL(imageUrlRef.current);
      }
    };
  }, []);

  async function systemShare() {
    setError(null);
    try {
      await navigator.share({ title: video.title, url: shareUrl });
    } catch (shareError) {
      if (shareError instanceof Error && shareError.name === "AbortError") {
        return;
      }
      setError("系统分享暂时不可用，请复制链接后分享。");
    }
  }

  async function downloadImage() {
    setError(null);
    if (generatedImage) {
      downloadShareImage(generatedImage.url, video.id);
      return;
    }
    if (!cardRef.current || !isReady || isGenerating) {
      return;
    }
    setIsGenerating(true);
    try {
      const result = await exportShareCard(cardRef.current);
      if (!mountedRef.current) {
        return;
      }
      const url = URL.createObjectURL(result.blob);
      imageUrlRef.current = url;
      setGeneratedImage({ url, width: result.width, height: result.height });
      downloadShareImage(url, video.id);
    } catch {
      if (mountedRef.current) {
        setError("分享图生成失败，请稍后重试；也可以先复制链接分享。");
      }
    } finally {
      if (mountedRef.current) {
        setIsGenerating(false);
      }
    }
  }

  function changeTab(tab: ShareTab) {
    if (!isGenerating) {
      setActiveTab(tab);
      setError(null);
    }
  }

  return (
    <DialogShell
      className="flex max-h-[90dvh] flex-col overflow-hidden"
      closeLabel="关闭分享弹窗"
      description="分享作品链接，或保存一张影像卡片。"
      maxWidthClassName="max-w-[560px]"
      onClose={onClose}
      title="分享视频"
    >
      <Tabs
        className="flex min-h-0 flex-col"
        value={activeTab}
        onValueChange={(next) => {
          if (next === "link" || next === "image") {
            changeTab(next);
          }
        }}
      >
        <TabsList
          aria-label="分享方式"
          className="shrink-0 gap-0 border-b border-border"
        >
          {tabs.map((tab) => (
            <TabsTrigger
              disabled={isGenerating}
              key={tab.id}
              value={tab.id}
              variant="line"
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="min-h-0 overflow-y-auto overscroll-contain pt-5">
          {qrCode.status === "unavailable" ? (
            <div className="mb-4 space-y-2" role="status">
              <FormMessage
                icon={<AlertIcon aria-hidden="true" className="h-4 w-4" />}
                variant="error"
              >
                二维码生成失败，仍可复制链接分享。
              </FormMessage>
              <Button
                onClick={retryQrCode}
                size="sm"
                type="button"
                variant="secondary"
              >
                重试二维码
              </Button>
            </div>
          ) : null}
          <TabsContent className="space-y-4" value={activeTab}>
            {activeTab === "link" ? (
              <>
                <div className="flex min-h-[220px] items-center justify-center">
                  {qrCode.status === "ready" ? (
                    <Image
                      alt="扫码打开作品详情"
                      className="h-[220px] w-[220px] rounded-lg"
                      height={220}
                      loading="eager"
                      src={qrCode.url}
                      unoptimized
                      width={220}
                    />
                  ) : qrCode.status === "loading" ? (
                    <InlineLoadingMark
                      className="h-8 w-8"
                      label="正在生成二维码"
                    />
                  ) : (
                    <ShareIcon
                      aria-hidden="true"
                      className="h-10 w-10 text-subtle"
                    />
                  )}
                </div>
                <VideoShareLinkRow label="站内作品链接" url={shareUrl} />
                {source ? (
                  <VideoShareLinkRow label={source.label} url={source.url} />
                ) : null}
                {canSystemShare ? (
                  <Button
                    className="w-full gap-2"
                    onClick={systemShare}
                    type="button"
                    variant="secondary"
                  >
                    <ShareIcon aria-hidden="true" className="h-4 w-4" />
                    系统分享
                  </Button>
                ) : null}
              </>
            ) : (
              <>
                {generatedImage ? (
                  <Image
                    alt={`${video.title} 分享图，可长按保存`}
                    className="mx-auto h-auto w-full max-w-[400px] rounded-xl"
                    height={generatedImage.height}
                    loading="eager"
                    src={generatedImage.url}
                    unoptimized
                    width={generatedImage.width}
                  />
                ) : isReady && qrCode.status === "ready" ? (
                  <VideoShareCard
                    coverUrl={cover.url ?? null}
                    qrCodeUrl={qrCode.url}
                    ref={cardRef}
                    video={video}
                  />
                ) : (
                  <div
                    className="flex min-h-[280px] flex-col items-center justify-center gap-4 rounded-xl border border-border bg-panel text-sm text-muted"
                    role="status"
                  >
                    {qrCode.status === "unavailable" ? (
                      <AlertIcon aria-hidden="true" className="h-8 w-8" />
                    ) : (
                      <InlineLoadingMark className="h-8 w-8" />
                    )}
                    <span>
                      {qrCode.status === "unavailable"
                        ? "请重试二维码后生成分享图"
                        : cover.status === "loading"
                          ? "正在准备封面…"
                          : "正在生成二维码…"}
                    </span>
                  </div>
                )}
                {cover.status === "unavailable" && video.coverImageUrl ? (
                  <p className="text-xs leading-5 text-subtle">
                    封面暂时无法加载，将使用简洁封面生成分享图。
                  </p>
                ) : null}
                <Button
                  aria-busy={isGenerating}
                  className="w-full gap-2"
                  disabled={!isReady || isGenerating}
                  onClick={downloadImage}
                  type="button"
                >
                  {qrCode.status === "unavailable" ? (
                    <AlertIcon aria-hidden="true" className="h-4 w-4" />
                  ) : !isReady || isGenerating ? (
                    <InlineLoadingMark />
                  ) : (
                    <ShareIcon aria-hidden="true" className="h-4 w-4" />
                  )}
                  {qrCode.status === "unavailable"
                    ? "请先重试二维码"
                    : isGenerating
                      ? "正在生成分享图…"
                      : !isReady
                        ? "正在准备分享图…"
                        : "下载分享图"}
                </Button>
                {generatedImage ? (
                  <p
                    className="text-center text-xs leading-5 text-subtle"
                    role="status"
                  >
                    分享图已生成，也可长按上方图片保存。
                  </p>
                ) : null}
              </>
            )}
          </TabsContent>
          {error ? (
            <div className="mt-4" role="alert">
              <FormMessage
                icon={<AlertIcon aria-hidden="true" className="h-4 w-4" />}
                variant="error"
              >
                {error}
              </FormMessage>
            </div>
          ) : null}
        </div>
      </Tabs>
    </DialogShell>
  );
}
