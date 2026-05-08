import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

interface HotmartWebhookV2 {
  event: string;
  data: {
    product: { id: number; name: string };
    buyer: { email: string; name: string };
    purchase: { transaction: string; status: string };
  };
}

export async function POST(req: Request) {
  try {
    const hottok = req.headers.get("x-hotmart-hottok");
    if (hottok !== process.env.HOTMART_WEBHOOK_TOKEN) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body: HotmartWebhookV2 = await req.json();

    if (body.event !== "PURCHASE_APPROVED") {
      return NextResponse.json({ message: "Evento ignorado" }, { status: 200 });
    }

    const { buyer, purchase } = body.data;

    const creditsToAssign = 4;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: plan, error: planError } = await supabase
      .from("plans")
      .select("id, credits_included")
      .eq("external_id", "plan_trial_free")
      .single();

    if (planError || !plan) {
      throw new Error("Plano 'Teste Gratuito' não encontrado no banco de dados.");
    }

    let userId: string;

    const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(
      buyer.email,
      {
        data: {
          full_name: buyer.name,
          acquisition_channel: "HOTMART_MENTORIA",
        },
        redirectTo: "http://localhost:3001/nova-senha",
      }
    );

    if (inviteError) {
      if (inviteError.message.includes("already registered") || inviteError.status === 422) {
        const { data: existingProfile } = await supabase
          .from("profiles")
          .select("id")
          .eq("email", buyer.email)
          .single();

        if (!existingProfile) throw new Error("Usuário não encontrado em profiles.");
        userId = existingProfile.id;
      } else {
        throw inviteError;
      }
    } else {
      userId = inviteData.user.id;
    }

    const { error: inviteLogError } = await supabase.from("hotmart_invites").upsert(
      {
        email: buyer.email,
        transaction_id: purchase.transaction,
      },
      { onConflict: "email" }
    );

    if (inviteLogError) {
      console.error("Aviso: Falha ao registrar log na hotmart_invites:", inviteLogError);
    }

    const { error: subError } = await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        plan_id: plan.id,
        status: "active",
        current_period_start: new Date().toISOString(),
        current_period_end: null,
      },
      { onConflict: "user_id" }
    );

    if (subError) throw subError;

    const { error: txError } = await supabase.from("credit_transactions").insert({
      user_id: userId,
      type: "mentorship_bonus",
      amount: plan.credits_included,
      description: "Liberação de Teste Gratuito (Acesso via Mentoria)",
      metadata: { transaction_id: purchase.transaction },
    });

    if (txError) throw txError;

    const { data: currentCredits } = await supabase
      .from("student_credits")
      .select("extra_credits")
      .eq("user_id", userId)
      .single();

    const { error: creditError } = await supabase.from("student_credits").upsert(
      {
        user_id: userId,
        plan_credits: plan.credits_included,
        extra_credits: currentCredits?.extra_credits || 0,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (creditError) throw creditError;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    console.error("❌ Erro no Webhook:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
