import { dryRunDuePagarmeSubscriptions } from "@/services/subscription-reconciliation/dry-run";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  if (
    process.env.VERCEL_ENV === "production" ||
    process.env.RECONCILIATION_DRY_RUN_ENABLED !== "true"
  ) {
    return NextResponse.json({ error: "Não encontrado." }, { status: 404 });
  }

  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    return NextResponse.json(await dryRunDuePagarmeSubscriptions({ limit: 25 }));
  } catch (error) {
    console.error("[PAGARME_SUBSCRIPTION_RECONCILIATION_DRY_RUN_ERROR]", error);

    return NextResponse.json(
      { error: "Não foi possível simular a reconciliação." },
      { status: 500 }
    );
  }
}
