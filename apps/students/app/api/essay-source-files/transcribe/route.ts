import { NextResponse } from "next/server";

import {
  ESSAY_SOURCE_BUCKET,
  MAX_ESSAY_IMAGE_BYTES,
  MAX_ESSAY_PDF_BYTES,
} from "@/lib/essay-source-files";
import {
  transcribeEssayWithRouting,
  UnusableEssaySourceError,
} from "@/lib/ocr/openai-transcription";
import { createClient } from "@/lib/server";
import {
  detectEssaySourceContentType,
  prepareArchivedEssaySource,
} from "@/lib/server/essay-source-processing";
import {
  createEssaySourceDownloadUrl,
  deleteEssaySources,
  downloadEssaySource,
  getEssaySourceMetadata,
  uploadEssaySource,
} from "@/lib/server/essay-source-storage";

export const runtime = "nodejs";

async function deleteUnsubmittedSourceFile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sourceFileId: string,
  studentId: string
) {
  const { data: sourceFile } = await supabase
    .from("essay_source_files")
    .select("id, storage_path, storage_provider")
    .eq("id", sourceFileId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (!sourceFile) return;

  const { data: deletedSource, error: deleteError } = await supabase
    .from("essay_source_files")
    .delete()
    .eq("id", sourceFile.id)
    .eq("student_id", studentId)
    .select("storage_path, storage_provider")
    .maybeSingle();

  if (deleteError || !deletedSource) return;

  if (deletedSource.storage_provider === "r2") {
    await deleteEssaySources([deletedSource.storage_path]);
    return;
  }

  await supabase.storage
    .from(ESSAY_SOURCE_BUCKET)
    .remove([deletedSource.storage_path, `${studentId}/staging/ocr-${sourceFile.id}.jpg`]);
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    path?: string;
    topicId?: string;
    originalFilename?: string;
    previousSourceFileId?: string | null;
  };

  if (!body.path || !body.topicId || !body.originalFilename) {
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

  if (!body.path.startsWith(`staging/${user.id}/`)) {
    return NextResponse.json({ error: "Arquivo inválido." }, { status: 403 });
  }

  let finalPath: string | null = null;
  let persistedSourceFile = false;

  try {
    const { data: topic, error: topicError } = await supabase
      .from("essay_topics")
      .select("id")
      .eq("id", body.topicId)
      .eq("active", true)
      .maybeSingle();

    if (topicError || !topic) {
      return NextResponse.json({ error: "Tema não encontrado." }, { status: 404 });
    }

    const metadata = await getEssaySourceMetadata(body.path);

    if (metadata.contentLength <= 0 || metadata.contentLength > MAX_ESSAY_IMAGE_BYTES) {
      return NextResponse.json({ error: "O arquivo deve ter no máximo 10 MB." }, { status: 400 });
    }

    const rawBuffer = await downloadEssaySource(body.path);
    const detectedType = detectEssaySourceContentType(rawBuffer);

    if (!detectedType) {
      return NextResponse.json(
        { error: "O conteúdo do arquivo não corresponde a JPG, PNG ou PDF." },
        { status: 400 }
      );
    }

    const maximumSize =
      detectedType === "application/pdf" ? MAX_ESSAY_PDF_BYTES : MAX_ESSAY_IMAGE_BYTES;

    if (rawBuffer.byteLength > maximumSize) {
      return NextResponse.json({ error: "O arquivo deve ter no máximo 10 MB." }, { status: 400 });
    }

    const originalUrl = await createEssaySourceDownloadUrl(body.path);
    const result = await transcribeEssayWithRouting({
      fileUrl: originalUrl,
      filename: body.originalFilename,
      contentType: detectedType,
    });

    if (!result.text) {
      return NextResponse.json(
        { error: "Não foi possível identificar texto na redação." },
        { status: 422 }
      );
    }

    const archivedSource = await prepareArchivedEssaySource(rawBuffer, detectedType);
    const sourceFileId = crypto.randomUUID();
    finalPath = `${user.id}/${sourceFileId}.${archivedSource.extension}`;

    await uploadEssaySource(finalPath, archivedSource.buffer, archivedSource.mimeType);

    const { error: insertError } = await supabase.from("essay_source_files").insert({
      id: sourceFileId,
      student_id: user.id,
      topic_id: body.topicId,
      storage_path: finalPath,
      storage_provider: "r2",
      original_filename: body.originalFilename.slice(0, 255),
      mime_type: archivedSource.mimeType,
      original_size_bytes: rawBuffer.byteLength,
      stored_size_bytes: archivedSource.buffer.byteLength,
    });

    if (insertError) throw insertError;
    persistedSourceFile = true;

    const { error: telemetryError } = await supabase.rpc("record_essay_source_transcription", {
      p_source_file_id: sourceFileId,
      p_model: result.model,
      p_route: result.route,
      p_metadata: {
        attempts: result.attempts,
      },
    });

    if (telemetryError) {
      console.error("Essay transcription telemetry error:", telemetryError);
    }

    if (body.previousSourceFileId && body.previousSourceFileId !== sourceFileId) {
      try {
        await deleteUnsubmittedSourceFile(supabase, body.previousSourceFileId, user.id);
      } catch (cleanupError) {
        console.error("Previous essay source cleanup error:", cleanupError);
      }
    }

    return NextResponse.json({ text: result.text, sourceFileId });
  } catch (error) {
    console.error("Essay transcription error:", error);

    if (finalPath && !persistedSourceFile) {
      try {
        await deleteEssaySources([finalPath]);
      } catch (cleanupError) {
        console.error("Essay source cleanup error:", cleanupError);
      }
    }

    if (error instanceof UnusableEssaySourceError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    return NextResponse.json(
      { error: "Não foi possível transcrever a redação. Tente novamente." },
      { status: 500 }
    );
  } finally {
    try {
      await deleteEssaySources([body.path]);
    } catch (cleanupError) {
      console.error("Temporary essay source cleanup error:", cleanupError);
    }
  }
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as { sourceFileId?: string };

  if (!body.sourceFileId) {
    return NextResponse.json({ error: "Arquivo não informado." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
  }

  await deleteUnsubmittedSourceFile(supabase, body.sourceFileId, user.id);

  return NextResponse.json({ success: true });
}
