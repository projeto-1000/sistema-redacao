import { createAdminClient } from "@/lib/admin";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const supabase = createAdminClient();
  const { data, error } = await supabase.rpc("process_due_subscription_credit_allocations", {
    p_now: new Date().toISOString(),
    p_limit: 500,
  });

  if (error) {
    console.error("[SUBSCRIPTION_CREDIT_RELEASE_ERROR]", error);
    return NextResponse.json(
      { error: "Não foi possível processar as liberações mensais de créditos." },
      { status: 500 }
    );
  }

  return NextResponse.json(data, { status: 200 });
}
