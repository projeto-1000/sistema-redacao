import { NextResponse } from "next/server";
import sharp from "sharp";

import {
  ESSAY_SOURCE_BUCKET,
  MAX_ESSAY_IMAGE_BYTES,
  MAX_ESSAY_PDF_BYTES,
} from "@/lib/essay-source-files";
import { createClient } from "@/lib/server";

export const runtime = "nodejs";

const MAX_ARCHIVE_IMAGE_EDGE = 3508;
const MAX_OCR_IMAGE_EDGE = 4096;

type ProcessRequest = {
  path?: string;
  topicId?: string;
  originalFilename?: string;
};

function detectContentType(buffer: Buffer) {
  if (buffer.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff]))) {
    return "image/jpeg" as const;
  }

  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) {
    return "image/png" as const;
  }

  if (buffer.subarray(0, 5).toString("ascii") === "%PDF-") {
    return "application/pdf" as const;
  }

  return null;
}

async function prepareStoredImage(rawBuffer: Buffer, detectedType: "image/jpeg" | "image/png") {
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

async function prepareOcrImage(rawBuffer: Buffer) {
  return sharp(rawBuffer, { limitInputPixels: 40_000_000 })
    .autoOrient()
    .resize({
      width: MAX_OCR_IMAGE_EDGE,
      height: MAX_OCR_IMAGE_EDGE,
      fit: "inside",
      withoutEnlargement: true,
    })
    .flatten({ background: "#ffffff" })
    .jpeg({
      quality: 95,
      chromaSubsampling: "4:4:4",
      mozjpeg: true,
      progressive: true,
    })
    .toBuffer();
}

export async function POST(request: Request) {
  const body = (await request.json()) as ProcessRequest;
  const { path, topicId, originalFilename } = body;

  if (!path || !topicId || !originalFilename) {
    return NextResponse.json({ error: "Dados do arquivo incompletos." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
  }

  if (!path.startsWith(`${user.id}/staging/`)) {
    return NextResponse.json({ error: "Arquivo inválido." }, { status: 403 });
  }

  try {
    const { data: topic, error: topicError } = await supabase
      .from("essay_topics")
      .select("id")
      .eq("id", topicId)
      .eq("active", true)
      .maybeSingle();

    if (topicError || !topic) {
      return NextResponse.json({ error: "Tema não encontrado." }, { status: 404 });
    }

    const { data: uploadedFile, error: downloadError } = await supabase.storage
      .from(ESSAY_SOURCE_BUCKET)
      .download(path);

    if (downloadError || !uploadedFile) {
      throw downloadError ?? new Error("Arquivo temporário não encontrado.");
    }

    const rawBuffer = Buffer.from(await uploadedFile.arrayBuffer());
    const detectedType = detectContentType(rawBuffer);

    if (!detectedType) {
      return NextResponse.json(
        { error: "O conteúdo do arquivo não corresponde a JPG, PNG ou PDF." },
        { status: 400 }
      );
    }

    const isPdf = detectedType === "application/pdf";
    const maximumSize = isPdf ? MAX_ESSAY_PDF_BYTES : MAX_ESSAY_IMAGE_BYTES;

    if (rawBuffer.byteLength > maximumSize) {
      return NextResponse.json({ error: "O arquivo deve ter no máximo 10 MB." }, { status: 400 });
    }

    const storedImage = isPdf ? null : await prepareStoredImage(rawBuffer, detectedType);
    const processedBuffer = storedImage?.buffer ?? rawBuffer;
    const storedMimeType = storedImage?.mimeType ?? "application/pdf";
    const extension = storedImage?.extension ?? "pdf";
    const ocrBuffer = isPdf ? null : await prepareOcrImage(rawBuffer);
    const sourceFileId = crypto.randomUUID();
    const finalPath = `${user.id}/${sourceFileId}.${extension}`;
    const ocrPath = isPdf ? null : `${user.id}/staging/ocr-${sourceFileId}.jpg`;

    const { error: uploadError } = await supabase.storage
      .from(ESSAY_SOURCE_BUCKET)
      .upload(finalPath, processedBuffer, {
        contentType: storedMimeType,
        upsert: false,
      });

    if (uploadError) {
      throw uploadError;
    }

    if (ocrPath && ocrBuffer) {
      const { error: ocrUploadError } = await supabase.storage
        .from(ESSAY_SOURCE_BUCKET)
        .upload(ocrPath, ocrBuffer, {
          contentType: "image/jpeg",
          upsert: false,
        });

      if (ocrUploadError) {
        await supabase.storage.from(ESSAY_SOURCE_BUCKET).remove([finalPath]);
        throw ocrUploadError;
      }
    }

    const { error: insertError } = await supabase.from("essay_source_files").insert({
      id: sourceFileId,
      student_id: user.id,
      topic_id: topicId,
      storage_path: finalPath,
      original_filename: originalFilename.slice(0, 255),
      mime_type: storedMimeType,
      original_size_bytes: rawBuffer.byteLength,
      stored_size_bytes: processedBuffer.byteLength,
    });

    if (insertError) {
      await supabase.storage
        .from(ESSAY_SOURCE_BUCKET)
        .remove(ocrPath ? [finalPath, ocrPath] : [finalPath]);
      throw insertError;
    }

    return NextResponse.json({ sourceFileId });
  } catch (error) {
    console.error("Essay source processing error:", error);

    return NextResponse.json(
      { error: "Não foi possível preparar o arquivo da redação." },
      { status: 500 }
    );
  } finally {
    await supabase.storage.from(ESSAY_SOURCE_BUCKET).remove([path]);
  }
}
