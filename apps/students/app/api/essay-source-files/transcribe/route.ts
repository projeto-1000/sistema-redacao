import { NextResponse } from "next/server";

import { ESSAY_SOURCE_BUCKET } from "@/lib/essay-source-files";
import {
  transcribeEssayWithRouting,
  UnusableEssaySourceError,
} from "@/lib/ocr/openai-transcription";
import { createClient } from "@/lib/server";

export const runtime = "nodejs";

async function deleteUnsubmittedSourceFile(
  supabase: Awaited<ReturnType<typeof createClient>>,
  sourceFileId: string,
  studentId: string
) {
  const { data: sourceFile } = await supabase
    .from("essay_source_files")
    .select("id, storage_path")
    .eq("id", sourceFileId)
    .eq("student_id", studentId)
    .maybeSingle();

  if (!sourceFile) return;

  const { data: deletedSource, error: deleteError } = await supabase
    .from("essay_source_files")
    .delete()
    .eq("id", sourceFile.id)
    .eq("student_id", studentId)
    .select("storage_path")
    .maybeSingle();

  if (!deleteError && deletedSource) {
    await supabase.storage
      .from(ESSAY_SOURCE_BUCKET)
      .remove([deletedSource.storage_path, `${studentId}/staging/ocr-${sourceFile.id}.jpg`]);
  }
}

export async function POST(request: Request) {
  const body = (await request.json()) as {
    sourceFileId?: string;
    previousSourceFileId?: string | null;
  };

  if (!body.sourceFileId) {
    return NextResponse.json({ error: "Arquivo não informado." }, { status: 400 });
  }

  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
    }

    const { data: sourceFile, error: sourceFileError } = await supabase
      .from("essay_source_files")
      .select("storage_path, original_filename, mime_type")
      .eq("id", body.sourceFileId)
      .eq("student_id", user.id)
      .maybeSingle();

    if (sourceFileError || !sourceFile) {
      return NextResponse.json({ error: "Arquivo não encontrado." }, { status: 404 });
    }

    const ocrStoragePath =
      sourceFile.mime_type === "application/pdf"
        ? sourceFile.storage_path
        : `${user.id}/staging/ocr-${body.sourceFileId}.jpg`;
    let ocrContentType =
      sourceFile.mime_type === "application/pdf" ? "application/pdf" : "image/jpeg";
    let { data: signedUrl, error: signedUrlError } = await supabase.storage
      .from(ESSAY_SOURCE_BUCKET)
      .createSignedUrl(ocrStoragePath, 60 * 10);

    if ((signedUrlError || !signedUrl?.signedUrl) && ocrStoragePath !== sourceFile.storage_path) {
      const fallbackSignedUrl = await supabase.storage
        .from(ESSAY_SOURCE_BUCKET)
        .createSignedUrl(sourceFile.storage_path, 60 * 10);

      signedUrl = fallbackSignedUrl.data;
      signedUrlError = fallbackSignedUrl.error;
      ocrContentType = sourceFile.mime_type;
    }

    if (signedUrlError || !signedUrl?.signedUrl) {
      await deleteUnsubmittedSourceFile(supabase, body.sourceFileId, user.id);
      throw signedUrlError ?? new Error("Não foi possível acessar o arquivo.");
    }

    let result;

    try {
      result = await transcribeEssayWithRouting({
        fileUrl: signedUrl.signedUrl,
        filename: sourceFile.original_filename,
        contentType: ocrContentType,
      });
    } catch (error) {
      await deleteUnsubmittedSourceFile(supabase, body.sourceFileId, user.id);
      throw error;
    }

    if (!result.text) {
      await deleteUnsubmittedSourceFile(supabase, body.sourceFileId, user.id);
      return NextResponse.json(
        { error: "Não foi possível identificar texto na redação." },
        { status: 422 }
      );
    }

    if (ocrStoragePath !== sourceFile.storage_path) {
      await supabase.storage.from(ESSAY_SOURCE_BUCKET).remove([ocrStoragePath]);
    }

    if (body.previousSourceFileId && body.previousSourceFileId !== body.sourceFileId) {
      await deleteUnsubmittedSourceFile(supabase, body.previousSourceFileId, user.id);
    }

    const { error: telemetryError } = await supabase.rpc("record_essay_source_transcription", {
      p_source_file_id: body.sourceFileId,
      p_model: result.model,
      p_route: result.route,
      p_metadata: {
        attempts: result.attempts,
      },
    });

    if (telemetryError) {
      console.error("Essay transcription telemetry error:", telemetryError);
    }

    return NextResponse.json({ text: result.text });
  } catch (error) {
    console.error("Essay transcription error:", error);

    if (error instanceof UnusableEssaySourceError) {
      return NextResponse.json({ error: error.message }, { status: 422 });
    }

    return NextResponse.json(
      { error: "Não foi possível transcrever a redação. Tente novamente." },
      { status: 500 }
    );
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
