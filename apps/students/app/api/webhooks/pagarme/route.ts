import { createAdminClient } from "@/lib/admin";
import { getPagarmeWebhook, type PagarmeWebhook } from "@repo/payments";
import { NextResponse } from "next/server";

interface IncomingPagarmeWebhook {
  id?: string;
  type?: string;
  event?: string;
  data?: unknown;
}

interface PagarmeInvoiceWebhookData {
  id?: string;
  amount?: number;
  status?: string;
  payment_method?: string;

  paid_at?: string | null;
  updated_at?: string | null;

  period?: {
    start_at?: string;
    end_at?: string;
  };

  subscription?: {
    id?: string;

    current_cycle?: {
      start_at?: string;
      end_at?: string;
    };
  };
}

export async function POST(request: Request) {
  let incomingWebhook: IncomingPagarmeWebhook;

  try {
    incomingWebhook = (await request.json()) as IncomingPagarmeWebhook;
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  const webhookId = incomingWebhook.id;

  const incomingEventType = incomingWebhook.type ?? incomingWebhook.event;

  if (!webhookId || !webhookId.startsWith("hook_") || !incomingEventType) {
    return NextResponse.json({ error: "Webhook inválido." }, { status: 400 });
  }

  let verifiedWebhook: PagarmeWebhook<PagarmeInvoiceWebhookData>;

  try {
    verifiedWebhook = await getPagarmeWebhook<PagarmeInvoiceWebhookData>({
      webhookId,
    });
  } catch (error) {
    console.error("[PAGARME_WEBHOOK_VERIFICATION_ERROR]", error);

    return NextResponse.json({ error: "Não foi possível validar o webhook." }, { status: 401 });
  }

  if (verifiedWebhook.id !== webhookId || verifiedWebhook.event !== incomingEventType) {
    return NextResponse.json(
      { error: "Os dados do webhook não correspondem ao evento validado." },
      { status: 401 }
    );
  }

  const supabaseAdmin = createAdminClient();

  let webhookEventId: string;

  const { data: insertedWebhookEvent, error: insertWebhookError } = await supabaseAdmin
    .from("pagarme_webhook_events")
    .insert({
      external_id: webhookId,
      event_type: verifiedWebhook.event,
      status: "received",

      payload: {
        id: verifiedWebhook.id,
        event: verifiedWebhook.event,
        status: verifiedWebhook.status,
        data: verifiedWebhook.data,
      },
    })
    .select("id")
    .single();

  if (insertWebhookError?.code === "23505") {
    const { data: existingWebhookEvent, error: existingWebhookError } = await supabaseAdmin
      .from("pagarme_webhook_events")
      .select(
        `
        id,
        event_type,
        status
      `
      )
      .eq("external_id", webhookId)
      .maybeSingle();

    if (existingWebhookError || !existingWebhookEvent) {
      console.error("[GET_EXISTING_PAGARME_WEBHOOK_ERROR]", existingWebhookError);

      return NextResponse.json(
        { error: "Não foi possível recuperar o webhook existente." },
        { status: 500 }
      );
    }

    if (existingWebhookEvent.event_type !== verifiedWebhook.event) {
      return NextResponse.json(
        { error: "O identificador do webhook está vinculado a outro evento." },
        { status: 409 }
      );
    }

    if (existingWebhookEvent.status === "processed" || existingWebhookEvent.status === "ignored") {
      return NextResponse.json({
        received: true,
        duplicate: true,
      });
    }

    webhookEventId = existingWebhookEvent.id;
  } else {
    if (insertWebhookError || !insertedWebhookEvent) {
      console.error("[STORE_PAGARME_WEBHOOK_ERROR]", insertWebhookError);

      return NextResponse.json({ error: "Não foi possível registrar o webhook." }, { status: 500 });
    }

    webhookEventId = insertedWebhookEvent.id;
  }

  if (verifiedWebhook.event !== "invoice.paid") {
    const { error: ignoredEventError } = await supabaseAdmin
      .from("pagarme_webhook_events")
      .update({
        status: "ignored",
        processed_at: new Date().toISOString(),
        error_message: null,
        updated_at: new Date().toISOString(),
      })
      .eq("id", webhookEventId);

    if (ignoredEventError) {
      console.error("[IGNORE_PAGARME_WEBHOOK_ERROR]", ignoredEventError);

      return NextResponse.json(
        { error: "Não foi possível finalizar o evento ignorado." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      received: true,
      ignored: true,
      webhookEventId,
    });
  }

  const invoice = verifiedWebhook.data;

  const subscriptionExternalId = invoice.subscription?.id;

  const periodStart = invoice.period?.start_at ?? invoice.subscription?.current_cycle?.start_at;

  const periodEnd = invoice.period?.end_at ?? invoice.subscription?.current_cycle?.end_at;

  if (
    !invoice.id ||
    invoice.status !== "paid" ||
    !invoice.amount ||
    invoice.amount <= 0 ||
    !subscriptionExternalId ||
    !periodStart ||
    !periodEnd
  ) {
    const errorMessage = "Os dados da fatura paga estão incompletos.";

    await supabaseAdmin
      .from("pagarme_webhook_events")
      .update({
        status: "failed",
        error_message: errorMessage,
        updated_at: new Date().toISOString(),
      })
      .eq("id", webhookEventId);

    return NextResponse.json({ error: errorMessage }, { status: 422 });
  }

  const { data: renewalData, error: renewalError } = await supabaseAdmin.rpc(
    "process_pagarme_subscription_renewal",
    {
      p_webhook_event_id: webhookEventId,

      p_subscription_external_id: subscriptionExternalId,

      p_invoice_external_id: invoice.id,

      p_invoice_amount: invoice.amount,

      p_invoice_status: invoice.status,

      p_payment_method: invoice.payment_method ?? null,

      p_period_start: periodStart,

      p_period_end: periodEnd,

      p_paid_at: invoice.paid_at ?? invoice.updated_at ?? new Date().toISOString(),
    }
  );

  if (renewalError) {
    console.error("[PROCESS_PAGARME_RENEWAL_RPC_ERROR]", renewalError);

    return NextResponse.json({ error: "Não foi possível processar a renovação." }, { status: 500 });
  }

  const renewalResult = renewalData as {
    success?: boolean;
    message?: string;
    duplicate?: boolean;
  } | null;

  if (!renewalResult?.success) {
    console.error("[PROCESS_PAGARME_RENEWAL_ERROR]", renewalResult);

    return NextResponse.json(
      { error: renewalResult?.message ?? "Não foi possível processar a renovação." },
      { status: 500 }
    );
  }

  return NextResponse.json({
    received: true,
    processed: true,
    duplicate: renewalResult.duplicate ?? false,
    webhookEventId,
  });
}
