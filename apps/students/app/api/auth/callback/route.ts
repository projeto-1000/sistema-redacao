// apps/admin/app/api/auth/callback/route.ts
import { createClient } from "@/lib/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);

  // O 'code' é o token de segurança gerado pelo Supabase
  const code = searchParams.get("code");

  // O 'next' é a página para onde o usuário deve ir após o sucesso.
  // Na nossa Action anterior, nós passamos ?next=/atualizar-senha
  const next = searchParams.get("next") ?? "/";
  console.log({ next, code });
  if (code) {
    const supabase = await createClient();

    // Troca o código por uma sessão ativa no servidor
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      // Deu tudo certo! Redireciona o usuário com a sessão já validada
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Se o link expirou, foi adulterado ou o código é inválido, manda pro login com erro
  return NextResponse.redirect(`${origin}/login?error=invalid_link`);
}
