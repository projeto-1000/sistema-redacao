import { createClient } from "@/lib/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { origin, searchParams } = new URL(request.url);
  const tokenHash = searchParams.get("token_hash");

  if (tokenHash) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type: "recovery" });

    if (!error && data.user?.user_metadata?.teacher_invitation_pending === true) {
      return NextResponse.redirect(`${origin}/cadastro/senha`);
    }

    if (!error) await supabase.auth.signOut();
  }

  return NextResponse.redirect(`${origin}/login?error=invalid_link`);
}
