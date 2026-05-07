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

    const startDate = new Date();
    const endDate = new Date();
    endDate.setFullYear(endDate.getFullYear() + 1);

    const { error: subError } = await supabase.from("subscriptions").upsert(
      {
        user_id: userId,
        tier: "basic",
        status: "trialing",
        current_period_start: startDate.toISOString(),
        current_period_end: endDate.toISOString(),
      },
      { onConflict: "user_id" }
    );

    if (subError) throw subError;

    const { error: creditError } = await supabase.rpc("increment_student_credits", {
      p_user_id: userId,
      p_amount: creditsToAssign,
    });

    if (creditError) throw creditError;

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Erro interno";
    console.error("❌ Erro no Webhook:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
