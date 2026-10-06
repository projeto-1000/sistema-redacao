import { NextResponse } from "next/server";

import { createClient } from "@/lib/server";
import {
  OPENAI_OCR_MODELS,
  transcribeEssayWithOpenAI,
  type OpenAiOcrModel,
} from "@/lib/ocr/openai-transcription";

const SUPPORTED_TYPES = ["image/jpeg", "image/png", "application/pdf"];

export async function POST(
  request: Request,
  context: {
    params: Promise<{
      model: string;
    }>;
  }
) {
  const { model } = await context.params;

  if (!(model in OPENAI_OCR_MODELS)) {
    return NextResponse.json({ error: "Modelo não suportado." }, { status: 400 });
  }

  const body = await request.json();

  const { path, filename, contentType } = body;

  if (!path || !filename || !contentType) {
    return NextResponse.json({ error: "Dados do arquivo incompletos." }, { status: 400 });
  }

  if (!SUPPORTED_TYPES.includes(contentType)) {
    return NextResponse.json(
      {
        error: "Formato não suportado. Envie JPG, PNG ou PDF.",
      },
      { status: 400 }
    );
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

    if (!path.startsWith(`${user.id}/`)) {
      return NextResponse.json({ error: "Arquivo inválido." }, { status: 403 });
    }

    const { data, error: signedUrlError } = await supabase.storage
      .from("ocr-poc-temp")
      .createSignedUrl(path, 60 * 10);

    if (signedUrlError || !data?.signedUrl) {
      throw signedUrlError ?? new Error("Não foi possível gerar a URL.");
    }

    const result = await transcribeEssayWithOpenAI({
      fileUrl: data.signedUrl,
      filename,
      contentType,
      model: model as OpenAiOcrModel,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("OpenAI OCR error:", error);

    return NextResponse.json(
      {
        error: "Não foi possível transcrever a redação.",
      },
      { status: 500 }
    );
  }
}
