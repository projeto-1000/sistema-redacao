import { createClient } from "@/lib/server";
import { type EmailOtpType } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = url.searchParams.get("type") as EmailOtpType | null;
  const next = url.searchParams.get("next");

  if (token_hash && type) {
    const supabase = await createClient();

    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash,
    });

    if (!error) {
      const url = next ? next : "/nova-senha";
      return NextResponse.redirect(new URL(url, request.url));
    } else {
      console.error("3. ❌ ERRO no verifyOtp:", error.message);
    }
  } else {
    console.error("2. ❌ Faltam parâmetros na URL!");
  }

  const errorUrl = new URL("/login?erro=link-invalido", request.url);
  return NextResponse.redirect(errorUrl);
}
