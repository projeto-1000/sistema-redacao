import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createPagarmeCustomer } from "@repo/payments";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("🔥 [WEBHOOK RECEBIDO]:", body.record.email);
    const { id, full_name: name, email, document } = body.record;

    if (!id || !email || !name) {
      console.error("❌ Dados incompletos no webhook");
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const pagarmeCustomer = await createPagarmeCustomer({
      id,
      name,
      email,
      document: document || "",
    });
    console.log("✅ Cliente criado na Pagar.me:", pagarmeCustomer.id);

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY!
    );

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({ pagarme_customer_id: pagarmeCustomer.id })
      .eq("id", id);

    if (updateError) {
      console.error("❌ Erro ao atualizar Supabase:", updateError);
      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }
    console.log("✅ Supabase atualizado com sucesso!");
    return NextResponse.json({ success: true, customerId: pagarmeCustomer.id });
  } catch (error) {
    console.error("🚨 Erro fatal no Webhook:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
