import { reconcileDuePagarmeSubscriptions } from "@/services/subscription-reconciliation";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  const authorization = request.headers.get("authorization");

  if (!cronSecret || authorization !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  try {
    const result = await reconcileDuePagarmeSubscriptions({ limit: 25 });
    const hasFailures = result.results.some(
      (item) => item.status === "failed" || item.status === "intervention_required"
    );

    return NextResponse.json(result, { status: hasFailures ? 207 : 200 });
  } catch (error) {
    console.error("[PAGARME_SUBSCRIPTION_RECONCILIATION_ERROR]", error);

    return NextResponse.json(
      { error: "Não foi possível reconciliar as assinaturas." },
      { status: 500 }
    );
  }
}
