import { inflateSync } from "node:zlib";

import { PDFDict, PDFDocument, PDFName, PDFNumber, PDFRawStream } from "pdf-lib";
import sharp from "sharp";

const MAX_IMAGE_PIXELS = 40_000_000;
const MAX_TOTAL_PIXELS = 80_000_000;
const MIN_IMAGE_BYTES = 32 * 1024;

function numberValue(dict: PDFDict, key: string, fallback = 0) {
  const value = dict.lookup(PDFName.of(key));
  return value instanceof PDFNumber ? value.asNumber() : fallback;
}

// PDF scan generators commonly use PNG row predictors inside Flate streams.
function decodeRows(
  data: Buffer,
  width: number,
  height: number,
  channels: number,
  predictor: number
) {
  const stride = width * channels;
  if (predictor === 1) return data.length === stride * height ? data : null;
  if (predictor < 10 || predictor > 15 || data.length !== (stride + 1) * height) return null;

  const output = Buffer.alloc(stride * height);
  for (let row = 0; row < height; row++) {
    const filter = data[row * (stride + 1)]!;
    if (filter > 4) return null;
    for (let col = 0; col < stride; col++) {
      const index = row * stride + col;
      const left = col >= channels ? output[index - channels]! : 0;
      const above = row > 0 ? output[index - stride]! : 0;
      const upperLeft = row > 0 && col >= channels ? output[index - stride - channels]! : 0;
      let prediction = 0;
      if (filter === 1) prediction = left;
      if (filter === 2) prediction = above;
      if (filter === 3) prediction = Math.floor((left + above) / 2);
      if (filter === 4) {
        const p = left + above - upperLeft;
        const a = Math.abs(p - left);
        const b = Math.abs(p - above);
        const c = Math.abs(p - upperLeft);
        prediction = a <= b && a <= c ? left : b <= c ? above : upperLeft;
      }
      output[index] = (data[row * (stride + 1) + col + 1]! + prediction) & 255;
    }
  }
  return output;
}

/** Optimize embedded scans without rasterizing pages or changing image resolution. */
export async function optimizeEssayPdf(original: Buffer): Promise<Buffer> {
  try {
    const pdf = await PDFDocument.load(original, {
      updateMetadata: false,
      throwOnInvalidObject: true,
    });
    // Rewriting invalidates digital signatures. Keep signed documents intact.
    if (
      pdf.context
        .enumerateIndirectObjects()
        .some(([, object]) => object instanceof PDFDict && object.has(PDFName.of("ByteRange")))
    )
      return original;

    let processedPixels = 0;
    for (const [ref, object] of pdf.context.enumerateIndirectObjects()) {
      if (!(object instanceof PDFRawStream)) continue;
      const dict = object.dict;
      const color = dict.lookup(PDFName.of("ColorSpace"));
      const filter = dict.lookup(PDFName.of("Filter"));
      if (
        dict.lookup(PDFName.of("Subtype")) !== PDFName.of("Image") ||
        (color !== PDFName.of("DeviceRGB") && color !== PDFName.of("DeviceGray")) ||
        (filter !== PDFName.of("DCTDecode") && filter !== PDFName.of("FlateDecode")) ||
        numberValue(dict, "BitsPerComponent") !== 8 ||
        ["Decode", "Mask", "SMask", "ImageMask", "SMaskInData"].some((key) =>
          dict.has(PDFName.of(key))
        ) ||
        object.contents.length < MIN_IMAGE_BYTES
      )
        continue;

      const width = numberValue(dict, "Width");
      const height = numberValue(dict, "Height");
      const pixels = width * height;
      if (
        width <= 0 ||
        height <= 0 ||
        pixels > MAX_IMAGE_PIXELS ||
        processedPixels + pixels > MAX_TOTAL_PIXELS
      )
        continue;
      processedPixels += pixels;

      try {
        const channels = color === PDFName.of("DeviceGray") ? 1 : 3;
        let image;
        if (filter === PDFName.of("DCTDecode")) {
          if (dict.has(PDFName.of("DecodeParms"))) continue;
          image = sharp(object.contents, { limitInputPixels: MAX_IMAGE_PIXELS });
          const metadata = await image.metadata();
          if (
            metadata.width !== width ||
            metadata.height !== height ||
            metadata.channels !== channels
          )
            continue;
        } else {
          const params = dict.lookup(PDFName.of("DecodeParms"));
          if (params !== undefined && !(params instanceof PDFDict)) continue;
          const predictor = params instanceof PDFDict ? numberValue(params, "Predictor", 1) : 1;
          if (
            params instanceof PDFDict &&
            ((numberValue(params, "Columns", 1) !== width && predictor !== 1) ||
              (numberValue(params, "Colors", 1) !== channels && predictor !== 1) ||
              numberValue(params, "BitsPerComponent", 8) !== 8)
          )
            continue;
          const decoded = inflateSync(object.contents, {
            maxOutputLength: (width * channels + 1) * height,
          });
          const raw = decodeRows(decoded, width, height, channels, predictor);
          if (!raw) continue;
          image = sharp(raw, { raw: { width, height, channels } });
        }

        const jpeg = await image
          .toColourspace(channels === 1 ? "b-w" : "srgb")
          .jpeg({ quality: 92, chromaSubsampling: "4:4:4", mozjpeg: true })
          .toBuffer();
        if (jpeg.length >= object.contents.length) continue;

        const replacement = dict.clone(pdf.context);
        replacement.set(PDFName.of("Filter"), PDFName.of("DCTDecode"));
        replacement.delete(PDFName.of("DecodeParms"));
        replacement.delete(PDFName.of("Length"));
        replacement.delete(PDFName.of("DL"));
        pdf.context.assign(ref, PDFRawStream.of(replacement, jpeg));
      } catch {
        // An unsupported image must not prevent other pages from being optimized.
        continue;
      }
    }

    const optimized = Buffer.from(
      await pdf.save({ useObjectStreams: true, updateFieldAppearances: false })
    );
    if (optimized.length >= original.length) return original;
    const verified = await PDFDocument.load(optimized, {
      updateMetadata: false,
      throwOnInvalidObject: true,
    });
    const pages = pdf.getPages();
    const verifiedPages = verified.getPages();
    if (
      pages.length !== verifiedPages.length ||
      pages.some((page, index) => {
        const other = verifiedPages[index]!;
        return page.getWidth() !== other.getWidth() || page.getHeight() !== other.getHeight();
      })
    )
      return original;
    return optimized;
  } catch {
    console.warn("Essay PDF optimization unavailable; preserving the original file.");
    return original;
  }
}
