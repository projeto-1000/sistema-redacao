import { createAdminClient } from "@/lib/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("process_scheduled_subscription_cancellations", {
    p_reference_at: new Date().toISOString(),
  });

  if (error) {
    console.error("[FINALIZE_SCHEDULED_SUBSCRIPTION_CANCELLATIONS_ERROR]", error);
    return NextResponse.json(
      { error: "Não foi possível finalizar os cancelamentos agendados." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      success: true,
      finalizedCount: data ?? 0,
    },
    { status: 200 }
  );
}
