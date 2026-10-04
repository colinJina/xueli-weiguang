"use client";

import { useEffect, useState } from "react";

import { createShareQrCode, loadShareCover } from "@/lib/videos/share-image";

type ShareAsset =
  | { status: "loading"; url?: never }
  | { status: "ready"; url: string }
  | { status: "unavailable"; url?: never };

export function useVideoShareAssets(shareUrl: string, coverUrl: string | null) {
  const [qrCode, setQrCode] = useState<ShareAsset>({ status: "loading" });
  const [cover, setCover] = useState<ShareAsset>({ status: coverUrl ? "loading" : "unavailable" });
  const [qrAttempt, setQrAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setQrCode({ status: "loading" });
    void createShareQrCode(shareUrl).then(
      (url) => { if (!cancelled) { setQrCode({ status: "ready", url }); } },
      () => { if (!cancelled) { setQrCode({ status: "unavailable" }); } },
    );
    return () => { cancelled = true; };
  }, [shareUrl, qrAttempt]);

  useEffect(() => {
    if (!coverUrl) {
      setCover({ status: "unavailable" });
      return;
    }
    let cancelled = false;
    const controller = new AbortController();
    const timeout = window.setTimeout(() => controller.abort(), 15000);
    setCover({ status: "loading" });
    void loadShareCover(coverUrl, controller.signal).then(
      (url) => { if (!cancelled) { setCover({ status: "ready", url }); } },
      () => { if (!cancelled) { setCover({ status: "unavailable" }); } },
    ).finally(() => window.clearTimeout(timeout));
    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [coverUrl]);

  return { qrCode, cover, retryQrCode: () => setQrAttempt((attempt) => attempt + 1) };
}
