import { deliverRegistrationEvents } from "@/lib/integrations/meta/delivery";
import { NextResponse } from "next/server";

export const maxDuration = 60;

export async function GET(request: Request) {
  const secret = process.env.CRON_SECRET;
  if (!secret || request.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  try {
    const result = await deliverRegistrationEvents();
    return NextResponse.json(result, {
      status: result.status === "configuration_required" ? 503 : result.failed ? 207 : 200,
    });
  } catch {
    console.error("[META_REGISTRATION_ERROR]", { code: "QUEUE_PROCESSING_FAILED" });
    return NextResponse.json({ error: "Não foi possível processar os eventos." }, { status: 500 });
  }
}
