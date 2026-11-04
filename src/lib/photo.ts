import { MAX_PHOTO_BYTES } from "@/lib/catalog";

export type PhotoPayload = {
  bytes: Buffer;
  contentType: string;
  ext: string;
};

export function sniffImage(bytes: Buffer): { contentType: string; ext: string } | null {
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return { contentType: "image/jpeg", ext: "jpg" };
  }
  const png = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  if (bytes.length >= 8 && bytes.subarray(0, 8).equals(png)) {
    return { contentType: "image/png", ext: "png" };
  }
  if (
    bytes.length >= 12 &&
    bytes.subarray(0, 4).toString("ascii") === "RIFF" &&
    bytes.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { contentType: "image/webp", ext: "webp" };
  }
  return null;
}

export async function readPhotoFile(
  file: File,
): Promise<{ ok: true; photo: PhotoPayload } | { ok: false; error: string } | null> {
  if (file.size === 0) return null;
  if (file.size > MAX_PHOTO_BYTES) {
    return {
      ok: false,
      error: "That photo is too big. Try another, or send the log without it.",
    };
  }
  const bytes = Buffer.from(await file.arrayBuffer());
  const sniffed = sniffImage(bytes);
  if (!sniffed) {
    return {
      ok: false,
      error:
        "Use a JPEG, PNG, or WebP photo. On iPhone, set Camera → Formats → Most Compatible if a photo will not attach.",
    };
  }
  return { ok: true, photo: { bytes, contentType: sniffed.contentType, ext: sniffed.ext } };
}
