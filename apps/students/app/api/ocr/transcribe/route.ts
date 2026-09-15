import { NextResponse } from "next/server";

import { transcribeEssay } from "@/lib/ocr/azure-document-intelligence";

export async function POST(request: Request) {
  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ error: "Arquivo não enviado." }, { status: 400 });
  }

  const supportedTypes = ["image/jpeg", "image/png", "application/pdf"];

  if (!supportedTypes.includes(file.type)) {
    return NextResponse.json({ error: "Formato não suportado." }, { status: 400 });
  }

  try {
    const buffer = await file.arrayBuffer();

    const result = await transcribeEssay(buffer, file.type);

    return NextResponse.json(result);
  } catch (error) {
    console.error("OCR transcription error:", error);

    return NextResponse.json({ error: "Não foi possível transcrever a redação." }, { status: 500 });
  }
}
