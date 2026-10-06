import { getImageProps } from "next/image";

const SHARE_IMAGE_WIDTH = 1200;
const COVER_HEIGHT = 675;

export async function createShareQrCode(url: string) {
  const QRCode = await import("qrcode");
  return QRCode.toDataURL(url, {
    width: 480,
    margin: 4,
    errorCorrectionLevel: "M",
    color: { dark: "#000000", light: "#ffffff" },
  });
}

function loadImage(source: string, signal: AbortSignal) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    function cleanUp() {
      image.onload = null;
      image.onerror = null;
      signal.removeEventListener("abort", onAbort);
    }
    function onAbort() {
      cleanUp();
      image.src = "";
      reject(new Error("图片加载已取消"));
    }
    if (signal.aborted) {
      onAbort();
      return;
    }
    image.onload = () => {
      cleanUp();
      resolve(image);
    };
    image.onerror = () => {
      cleanUp();
      reject(new Error("封面暂时无法加载"));
    };
    signal.addEventListener("abort", onAbort, { once: true });
    image.src = source;
  });
}

export async function loadShareCover(coverUrl: string, signal: AbortSignal) {
  const { props } = getImageProps({ src: coverUrl, alt: "", width: 600, height: 338 });
  // Use Next's existing same-origin image endpoint, then embed pixels in the card.
  const response = await fetch(props.src, { signal });
  if (!response.ok || !response.headers.get("content-type")?.startsWith("image/")) {
    throw new Error("封面暂时无法加载");
  }
  const blob = await response.blob();
  const objectUrl = URL.createObjectURL(blob);
  try {
    const image = await loadImage(objectUrl, signal);
    const canvas = document.createElement("canvas");
    canvas.width = SHARE_IMAGE_WIDTH;
    canvas.height = COVER_HEIGHT;
    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("浏览器暂不支持图片生成");
    }
    // Letterbox the original image rather than stretching or cropping its content.
    const scale = Math.min(SHARE_IMAGE_WIDTH / image.naturalWidth, COVER_HEIGHT / image.naturalHeight);
    const width = image.naturalWidth * scale;
    const height = image.naturalHeight * scale;
    context.fillStyle = "#000000";
    context.fillRect(0, 0, SHARE_IMAGE_WIDTH, COVER_HEIGHT);
    context.drawImage(image, (SHARE_IMAGE_WIDTH - width) / 2, (COVER_HEIGHT - height) / 2, width, height);
    return canvas.toDataURL("image/png");
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function exportShareCard(element: HTMLElement) {
  const [{ default: html2canvas }] = await Promise.all([
    import("html2canvas"),
    document.fonts.ready,
    Promise.all(Array.from(element.querySelectorAll("img"), (image) => image.decode())),
  ]);
  const width = element.getBoundingClientRect().width;
  if (width <= 0) {
    throw new Error("分享图暂时无法生成，请重新打开后再试");
  }
  const renderedCanvas = await html2canvas(element, {
    scale: SHARE_IMAGE_WIDTH / width,
    backgroundColor: "#111214",
    useCORS: true,
    allowTaint: false,
    logging: false,
    imageTimeout: 15000,
  });
  // html2canvas rounds fractional layout sizes down; guarantee the export width.
  const canvas = document.createElement("canvas");
  canvas.width = SHARE_IMAGE_WIDTH;
  canvas.height = Math.round(renderedCanvas.height * SHARE_IMAGE_WIDTH / renderedCanvas.width);
  const context = canvas.getContext("2d");
  if (!context) { throw new Error("浏览器暂不支持图片生成"); }
  context.drawImage(renderedCanvas, 0, 0, canvas.width, canvas.height);
  const blob = await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob((result) => {
      if (result) {
        resolve(result);
      } else {
        reject(new Error("分享图暂时无法生成，请稍后重试"));
      }
    }, "image/png");
  });
  return { blob, width: canvas.width, height: canvas.height };
}

export function downloadShareImage(url: string, videoId: string) {
  const link = document.createElement("a");
  link.href = url;
  link.download = `雪笠微光-${videoId}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
}
