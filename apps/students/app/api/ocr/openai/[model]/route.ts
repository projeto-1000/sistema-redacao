import { NextResponse } from "next/server";

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

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });
  }

  if (!SUPPORTED_TYPES.includes(file.type)) {
    return NextResponse.json(
      { error: "Formato não suportado. Envie JPG, PNG ou PDF." },
      { status: 400 }
    );
  }

  try {
    const result = await transcribeEssayWithOpenAI({
      file: await file.arrayBuffer(),
      filename: file.name,
      contentType: file.type,
      model: model as OpenAiOcrModel,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("OpenAI OCR error:", error);

    return NextResponse.json({ error: "Não foi possível transcrever a redação." }, { status: 500 });
  }
}
