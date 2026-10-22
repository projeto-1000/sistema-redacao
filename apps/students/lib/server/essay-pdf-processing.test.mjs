import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import test from "node:test";
import { PDFDocument, PDFName, PDFRawStream, StandardFonts } from "pdf-lib";
import sharp from "sharp";

import { optimizeEssayPdf } from "./essay-pdf-processing.ts";

async function scan(format) {
  const svg = Buffer.from(`<svg width="1800" height="2500" xmlns="http://www.w3.org/2000/svg">
    <rect width="1800" height="2500" fill="white"/>
    ${Array.from({ length: 32 }, (_, i) => `<text x="100" y="${150 + i * 65}" font-size="26" fill="#253960">Linha ${i + 1}: A educacao transforma a sociedade. Acentos: á é í ó ú ã õ ç.</text>`).join("")}
    </svg>`);
  const image = sharp(svg).flatten({ background: "white" }).removeAlpha();
  if (format === "jpeg") return image.jpeg({ quality: 100, chromaSubsampling: "4:4:4" }).toBuffer();
  // Simulate the small paper/lighting variation present in a photographed scan.
  const { data, info } = await image.raw().toBuffer({ resolveWithObject: true });
  let seed = 42;
  for (let i = 0; i < data.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    data[i] = Math.max(0, data[i] - (seed >>> 29));
  }
  return sharp(data, { raw: { width: info.width, height: info.height, channels: 3 } })
    .png()
    .toBuffer();
}

async function documentWithScan(format) {
  const pdf = await PDFDocument.create();
  const imageBytes = await scan(format);
  const image = format === "jpeg" ? await pdf.embedJpg(imageBytes) : await pdf.embedPng(imageBytes);
  for (let i = 0; i < 2; i++) {
    const page = pdf.addPage([600, 840]);
    page.drawImage(image, { x: 0, y: 0, width: 600, height: 840 });
    page.drawText(`Page ${i + 1} - selectable text`, { x: 40, y: 20, size: 10 });
  }
  return Buffer.from(await pdf.save({ useObjectStreams: false }));
}

for (const format of ["jpeg", "png"]) {
  test(`reduces ${format} scans while preserving pages, dimensions and text streams`, async () => {
    const original = await documentWithScan(format);
    const optimized = await optimizeEssayPdf(original);
    assert.ok(
      optimized.length < original.length * 0.9,
      `${original.length} -> ${optimized.length}`
    );
    const before = await PDFDocument.load(original);
    const after = await PDFDocument.load(optimized);
    assert.equal(after.getPageCount(), 2);
    assert.deepEqual(
      after.getPages().map((p) => p.getSize()),
      before.getPages().map((p) => p.getSize())
    );
    const contentStreams = (pdf) =>
      pdf.context
        .enumerateIndirectObjects()
        .filter(
          ([, object]) =>
            object instanceof PDFRawStream &&
            object.dict.lookup(PDFName.of("Subtype")) !== PDFName.of("Image")
        )
        .map(([, object]) => Buffer.from(object.contents).toString("hex"));
    assert.deepEqual(contentStreams(after), contentStreams(before));
    const directory = await mkdtemp(path.join(tmpdir(), `essay-pdf-${format}-`));
    await writeFile(path.join(directory, "original.pdf"), original);
    await writeFile(path.join(directory, "optimized.pdf"), optimized);
    console.log(
      `${format}: ${original.length} -> ${optimized.length} bytes; visual fixtures: ${directory}`
    );
  });
}

test("never grows an already compact text PDF", async () => {
  const pdf = await PDFDocument.create();
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  pdf.addPage().drawText("Small text document", { font });
  const original = Buffer.from(await pdf.save());
  assert.ok((await optimizeEssayPdf(original)).length <= original.length);
});

test("preserves malformed PDFs instead of losing the source", async () => {
  const original = Buffer.from("%PDF-invalid");
  assert.deepEqual(await optimizeEssayPdf(original), original);
});

test("preserves signed documents byte for byte", async () => {
  const pdf = await PDFDocument.create();
  pdf.addPage();
  pdf.context.register(pdf.context.obj({ Type: "Sig", ByteRange: [0, 1, 2, 3] }));
  const original = Buffer.from(await pdf.save({ useObjectStreams: false }));
  assert.deepEqual(await optimizeEssayPdf(original), original);
});

test("decodes all PNG row predictors without changing the image pixels before encoding", async () => {
  const width = 256;
  const height = 256;
  const channels = 3;
  const stride = width * channels;
  const raw = Buffer.alloc(stride * height);
  let seed = 31;
  for (let i = 0; i < raw.length; i++) {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    raw[i] = seed >>> 24;
  }
  const expected = await sharp(raw, { raw: { width, height, channels } })
    .toColourspace("srgb")
    .jpeg({ quality: 92, chromaSubsampling: "4:4:4", mozjpeg: true })
    .toBuffer();
  for (const filter of [0, 1, 2, 3, 4]) {
    const rows = Buffer.alloc((stride + 1) * height);
    for (let y = 0; y < height; y++) {
      rows[y * (stride + 1)] = filter;
      for (let x = 0; x < stride; x++) {
        const index = y * stride + x;
        const left = x >= channels ? raw[index - channels] : 0;
        const above = y > 0 ? raw[index - stride] : 0;
        const upperLeft = y > 0 && x >= channels ? raw[index - stride - channels] : 0;
        const p = left + above - upperLeft;
        const distances = [left, above, upperLeft].map((value) => Math.abs(p - value));
        const paeth = [left, above, upperLeft][distances.indexOf(Math.min(...distances))];
        const prediction = [0, left, above, Math.floor((left + above) / 2), paeth][filter];
        rows[y * (stride + 1) + x + 1] = (raw[index] - prediction) & 255;
      }
    }
    const pdf = await PDFDocument.create();
    pdf.addPage();
    pdf.context.register(
      pdf.context.flateStream(rows, {
        Type: "XObject",
        Subtype: "Image",
        Width: width,
        Height: height,
        ColorSpace: "DeviceRGB",
        BitsPerComponent: 8,
        DecodeParms: { Predictor: 15, Columns: width, Colors: channels, BitsPerComponent: 8 },
      })
    );
    const original = Buffer.from(await pdf.save({ useObjectStreams: false }));
    const optimized = await optimizeEssayPdf(original);
    const after = await PDFDocument.load(optimized);
    const image = after.context
      .enumerateIndirectObjects()
      .map(([, object]) => object)
      .find(
        (object) =>
          object instanceof PDFRawStream &&
          object.dict.lookup(PDFName.of("Subtype")) === PDFName.of("Image")
      );
    assert.ok(image instanceof PDFRawStream);
    assert.deepEqual(Buffer.from(image.contents), expected, `filter ${filter}`);
  }
});
