import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { createPagarmeCustomer } from "@repo/payments";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    const {
      id,
      full_name: name,
      email,
      document,
      phone_country_code: phoneCountryCode,
      phone,
    } = body.record;

    if (!id || !email || !name || !document || !phoneCountryCode || !phone) {
      console.error("❌ Dados incompletos vindos do front-end", {
        hasId: Boolean(id),
        hasEmail: Boolean(email),
        hasName: Boolean(name),
        hasDocument: Boolean(document),
        hasPhoneCountryCode: Boolean(phoneCountryCode),
        hasPhone: Boolean(phone),
      });

      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    const pagarmeCustomer = await createPagarmeCustomer({
      id,
      name,
      email,
      document,
      phoneCountryCode,
      phone,
    });

    const supabaseAdmin = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SECRET_KEY!
    );

    const { error: updateError } = await supabaseAdmin
      .from("profiles")
      .update({
        pagarme_customer_id: pagarmeCustomer.id,
        phone_country_code: phoneCountryCode,
        phone,
      })
      .eq("id", id);

    if (updateError) {
      console.error("❌ Erro ao atualizar ID no Supabase:", updateError);

      return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      customerId: pagarmeCustomer.id,
    });
  } catch (error) {
    console.error("🚨 Erro fatal na Rota de Pagamentos:", error);

    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
