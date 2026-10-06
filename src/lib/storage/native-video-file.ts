import type { NativeVideoMimeType } from "@/lib/storage/types";

/** File.type is supplied by the browser and may be empty or nonstandard on mobile. */
export function getNativeVideoMimeType(
  file: Pick<File, "name" | "type">,
  header?: ArrayBuffer,
): NativeVideoMimeType | null {
  const mimeType = file.type.split(";")[0]?.trim().toLowerCase() ?? "";
  const extension = file.name.split(".").pop()?.toLowerCase();

  // A known unsupported extension must not be treated as a format conversion.
  if (file.name.includes(".") && !["mp4", "webm", "mov"].includes(extension ?? "")) {
    return null;
  }

  // iOS and desktop may label identical bytes differently. Prefer the container
  // brand for MP4/MOV, including QuickTime files named .MP4 after an export.
  if (header && header.byteLength >= 16) {
    const bytes = new Uint8Array(header);
    const tag = (offset: number) => String.fromCharCode(...bytes.subarray(offset, offset + 4));
    const boxSize = new DataView(header).getUint32(0);
    if (tag(4) === "ftyp" && boxSize >= 16 && boxSize <= header.byteLength) {
      const brand = tag(8);
      if (brand === "qt  ") {
        return "video/quicktime";
      }
      if (["isom", "iso2", "iso3", "iso4", "iso5", "iso6", "mp41", "mp42", "avc1", "M4V "].includes(brand)) {
        return "video/mp4";
      }
      return null;
    }
  }

  if (mimeType === "video/quicktime" || mimeType === "video/x-quicktime") {
    return extension === "webm" ? null : "video/quicktime";
  }

  if (extension === "mov" && ["", "application/octet-stream", "video/mp4"].includes(mimeType)) {
    return "video/quicktime";
  }

  if (extension === "mov") {
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

/** Read only the header, not the full (up to 50 MB) video into memory. */
export function inspectNativeVideoFile(file: File): Promise<NativeVideoMimeType | null> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result instanceof ArrayBuffer) {
        resolve(getNativeVideoMimeType(file, reader.result));
      } else {
        reject(new Error("Could not read video header"));
      }
    };
    reader.onerror = () => reject(reader.error ?? new Error("Could not read video header"));
    reader.onabort = () => reject(new Error("Video header read aborted"));
    reader.readAsArrayBuffer(file.slice(0, 4096));
  });
}
