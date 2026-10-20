import "server-only";

import sharp from "sharp";

const MAX_ARCHIVE_IMAGE_EDGE = 3508;

export type EssaySourceContentType = "image/jpeg" | "image/png" | "application/pdf";

export function detectEssaySourceContentType(buffer: Buffer): EssaySourceContentType | null {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    return "image/jpeg";
  }

  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png";
  }

  if (buffer.subarray(0, 5).toString("ascii") === "%PDF-") {
    return "application/pdf";
  }

  return null;
}

export async function prepareArchivedEssaySource(
  rawBuffer: Buffer,
  detectedType: EssaySourceContentType
) {
  if (detectedType === "application/pdf") {
    return {
      buffer: rawBuffer,
      mimeType: "application/pdf" as const,
      extension: "pdf" as const,
    };
  }

  const image = sharp(rawBuffer, { limitInputPixels: 40_000_000 });
  const metadata = await image.metadata();
  const requiresResize =
    (metadata.width ?? 0) > MAX_ARCHIVE_IMAGE_EDGE ||
    (metadata.height ?? 0) > MAX_ARCHIVE_IMAGE_EDGE;
  const requiresOrientation = metadata.orientation !== undefined && metadata.orientation !== 1;

  const normalized = image
    .clone()
    .autoOrient()
    .resize({
      width: MAX_ARCHIVE_IMAGE_EDGE,
      height: MAX_ARCHIVE_IMAGE_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .flatten({ background: "#ffffff" });

  const jpegBuffer = await normalized
    .clone()
    .jpeg({
      quality: 92,
      chromaSubsampling: "4:4:4",
      mozjpeg: true,
      progressive: true,
    })
    .toBuffer();

  if (detectedType === "image/jpeg") {
    if (!requiresResize && !requiresOrientation && rawBuffer.byteLength <= jpegBuffer.byteLength) {
      return {
        buffer: rawBuffer,
        mimeType: "image/jpeg" as const,
        extension: "jpg" as const,
      };
    }

    return {
      buffer: jpegBuffer,
      mimeType: "image/jpeg" as const,
      extension: "jpg" as const,
    };
  }

  const pngBuffer = await normalized
    .clone()
    .png({ compressionLevel: 9, adaptiveFiltering: true })
    .toBuffer();

  if (
    !requiresResize &&
    !requiresOrientation &&
    rawBuffer.byteLength <= Math.min(pngBuffer.byteLength, jpegBuffer.byteLength)
  ) {
    return {
      buffer: rawBuffer,
      mimeType: "image/png" as const,
      extension: "png" as const,
    };
  }

  if (pngBuffer.byteLength <= jpegBuffer.byteLength) {
    return {
      buffer: pngBuffer,
      mimeType: "image/png" as const,
      extension: "png" as const,
    };
  }

  return {
    buffer: jpegBuffer,
    mimeType: "image/jpeg" as const,
    extension: "jpg" as const,
  };
}
