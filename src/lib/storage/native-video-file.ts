import type { NativeVideoMimeType } from "@/lib/storage/types";

/** File.type is supplied by the browser and may be empty or nonstandard on mobile. */
export function getNativeVideoMimeType(
  file: Pick<File, "name" | "type">,
): NativeVideoMimeType | null {
  const mimeType = file.type.split(";")[0]?.trim().toLowerCase() ?? "";
  const extension = file.name.split(".").pop()?.toLowerCase();

  // A known unsupported extension must not be treated as a format conversion.
  if (file.name.includes(".") && extension !== "mp4" && extension !== "webm") {
    return null;
  }

  if (mimeType === "video/mp4" || mimeType === "video/webm") {
    if (extension === "mp4" && mimeType !== "video/mp4") {
      return null;
    }
    if (extension === "webm" && mimeType !== "video/webm") {
      return null;
    }
    return mimeType;
  }

  // Only fall back for missing/generic types or known alternative MP4/WebM labels.
  const isGenericType = mimeType === "" || mimeType === "application/octet-stream";
  if (
    extension === "mp4" &&
    (isGenericType || mimeType === "application/mp4" || mimeType === "video/x-mp4")
  ) {
    return "video/mp4";
  }
  if (extension === "webm" && (isGenericType || mimeType === "video/x-webm")) {
    return "video/webm";
  }

  return null;
}
