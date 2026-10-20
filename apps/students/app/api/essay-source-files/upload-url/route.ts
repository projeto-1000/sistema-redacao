import { NextResponse } from "next/server";

import {
  ESSAY_SOURCE_EXTENSIONS,
  SUPPORTED_ESSAY_SOURCE_TYPES,
} from "@/lib/essay-source-files";
import { createClient } from "@/lib/server";
import {
  createEssaySourceUploadUrl,
  deleteEssaySources,
} from "@/lib/server/essay-source-storage";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const body = (await request.json()) as { contentType?: string };

  if (!SUPPORTED_ESSAY_SOURCE_TYPES.includes(body.contentType as never)) {
    return NextResponse.json({ error: "Formato de arquivo não suportado." }, { status: 400 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
  }

  try {
    const contentType = body.contentType as keyof typeof ESSAY_SOURCE_EXTENSIONS;
    const path = `staging/${user.id}/${crypto.randomUUID()}.${ESSAY_SOURCE_EXTENSIONS[contentType]}`;
    const uploadUrl = await createEssaySourceUploadUrl(path, contentType);

    return NextResponse.json({ path, uploadUrl });
  } catch (error) {
    console.error("Essay source upload URL error:", error);

    return NextResponse.json(
      { error: "Não foi possível preparar o envio do arquivo." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  const body = (await request.json()) as { path?: string };
  const supabase = await createClient();
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return NextResponse.json({ error: "Usuário não autenticado." }, { status: 401 });
  }

  if (!body.path?.startsWith(`staging/${user.id}/`)) {
    return NextResponse.json({ error: "Arquivo inválido." }, { status: 403 });
  }

  await deleteEssaySources([body.path]);

  return NextResponse.json({ success: true });
}
