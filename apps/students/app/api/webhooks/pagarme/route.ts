import { createAdminClient } from "@/lib/admin";
import {
  getDataCrazySyncErrorCode,
  syncStudentToDataCrazy,
  type DataCrazyEvent,
} from "@/lib/integrations/datacrazy/sync-student";

import {
  getPagarmeSubscription,
  getPagarmeWebhook,
  PagarmeApiError,
  type PagarmeWebhook,
} from "@repo/payments";

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

  created_at?: string | null;
  updated_at?: string | null;

  charge?: {
    id?: string;
    status?: string;

    paid_at?: string | null;
    updated_at?: string | null;

    recurrence_cycle?: string | null;

    last_transaction?: {
      id?: string;
      status?: string;
      success?: boolean;

      created_at?: string | null;
      updated_at?: string | null;

      acquirer_return_code?: string | number | null;
      acquirer_message?: string | null;

      gateway_response?: {
        code?: string | number | null;
        message?: string | null;
      };
    };
  };

  cycle?: {
    start_at?: string;
    end_at?: string;
    billing_at?: string;
    status?: string;
    cycle?: number;
  };

  subscription?: {
    id?: string;
    code?: string;
    status?: string;
  };
}

interface PagarmeSubscriptionWebhookData {
  id?: string;
  code?: string;
  status?: string;

  created_at?: string | null;
  updated_at?: string | null;
  canceled_at?: string | null;

  customer?: {
    id?: string;
  };

  plan?: {
    id?: string;
  };
}

type PagarmeWebhookData = PagarmeInvoiceWebhookData | PagarmeSubscriptionWebhookData;

type AdminClient = ReturnType<typeof createAdminClient>;

async function syncStudentEventsToDataCrazy({
  supabaseAdmin,
  subscriptionId,
  webhookEventId,
  events,
}: {
  supabaseAdmin: AdminClient;
  subscriptionId?: string;
  webhookEventId: string;
  events: DataCrazyEvent[];
}) {
  if (!subscriptionId) {
    for (const event of events) {
      console.error("[DATACRAZY_SYNC_ERROR]", {
        webhook_event_id: webhookEventId,
        event,
        error_code: "SUBSCRIPTION_ID_MISSING",
      });
    }

    return;
  }

  let studentId: string;

  try {
    const { data: subscription, error: subscriptionError } = await supabaseAdmin
      .from("subscriptions")
      .select("user_id")
      .eq("id", subscriptionId)
      .maybeSingle();

    if (subscriptionError || !subscription) {
      throw new Error("STUDENT_LOOKUP_FAILED");
    }

    studentId = subscription.user_id;
  } catch {
    for (const event of events) {
      console.error("[DATACRAZY_SYNC_ERROR]", {
        webhook_event_id: webhookEventId,
        subscription_id: subscriptionId,
        event,
        error_code: "STUDENT_LOOKUP_FAILED",
      });
    }

    return;
  }

  for (const event of events) {
    try {
      await syncStudentToDataCrazy(studentId, event);
    } catch (error) {
      console.error("[DATACRAZY_SYNC_ERROR]", {
        webhook_event_id: webhookEventId,
        subscription_id: subscriptionId,
        event,
        error_code: getDataCrazySyncErrorCode(error),
      });
    }
  }
}

function buildStoredInvoicePayload(webhook: PagarmeWebhook<PagarmeInvoiceWebhookData>) {
  const invoice = webhook.data;

  const transaction = invoice.charge?.last_transaction;

  return {
    id: webhook.id,
    event: webhook.event,
    status: webhook.status,

    data: {
      id: invoice.id ?? null,
      amount: invoice.amount ?? null,
      status: invoice.status ?? null,

      payment_method: invoice.payment_method ?? null,

      created_at: invoice.created_at ?? null,

      updated_at: invoice.updated_at ?? null,

      charge: {
        id: invoice.charge?.id ?? null,

        status: invoice.charge?.status ?? null,

        paid_at: invoice.charge?.paid_at ?? null,

        updated_at: invoice.charge?.updated_at ?? null,

        recurrence_cycle: invoice.charge?.recurrence_cycle ?? null,

        last_transaction: {
          id: transaction?.id ?? null,

          status: transaction?.status ?? null,

          success: transaction?.success ?? null,

          created_at: transaction?.created_at ?? null,

          updated_at: transaction?.updated_at ?? null,

          acquirer_return_code: transaction?.acquirer_return_code ?? null,

          acquirer_message: transaction?.acquirer_message ?? null,

          gateway_response: {
            code: transaction?.gateway_response?.code ?? null,

            message: transaction?.gateway_response?.message ?? null,
          },
        },
      },

      cycle: {
        start_at: invoice.cycle?.start_at ?? null,

        end_at: invoice.cycle?.end_at ?? null,

        billing_at: invoice.cycle?.billing_at ?? null,

        status: invoice.cycle?.status ?? null,

        cycle: invoice.cycle?.cycle ?? null,
      },

      subscription: {
        id: invoice.subscription?.id ?? null,

        code: invoice.subscription?.code ?? null,

        status: invoice.subscription?.status ?? null,
      },
    },
  };
}

function buildStoredSubscriptionPayload(webhook: PagarmeWebhook<PagarmeSubscriptionWebhookData>) {
  const subscription = webhook.data;

  return {
    id: webhook.id,
    event: webhook.event,
    status: webhook.status,

    data: {
      id: subscription.id ?? null,

      code: subscription.code ?? null,

      status: subscription.status ?? null,

      created_at: subscription.created_at ?? null,

      updated_at: subscription.updated_at ?? null,

      canceled_at: subscription.canceled_at ?? null,

      customer: {
        id: subscription.customer?.id ?? null,
      },

      plan: {
        id: subscription.plan?.id ?? null,
      },
    },
  };
}

function buildStoredWebhookPayload(webhook: PagarmeWebhook<PagarmeWebhookData>) {
  if (webhook.event === "subscription.canceled") {
    return buildStoredSubscriptionPayload(
      webhook as PagarmeWebhook<PagarmeSubscriptionWebhookData>
    );
  }

  return buildStoredInvoicePayload(webhook as PagarmeWebhook<PagarmeInvoiceWebhookData>);
}

async function markWebhookIgnored(admin: AdminClient, webhookEventId: string) {
  const now = new Date().toISOString();

  return admin
    .from("pagarme_webhook_events")
    .update({
      status: "ignored",
      processed_at: now,
      error_message: null,
      updated_at: now,
    })
    .eq("id", webhookEventId);
}

async function markWebhookFailed(admin: AdminClient, webhookEventId: string, errorMessage: string) {
  return admin
    .from("pagarme_webhook_events")
    .update({
      status: "failed",
      error_message: errorMessage,
      updated_at: new Date().toISOString(),
    })
    .eq("id", webhookEventId);
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

  let verifiedWebhook: PagarmeWebhook<PagarmeWebhookData>;

  try {
    verifiedWebhook = await getPagarmeWebhook<PagarmeWebhookData>({
      webhookId,
    });
  } catch (error) {
    console.error("[PAGARME_WEBHOOK_VERIFICATION_ERROR]", error);

    const isAuthenticationError =
      error instanceof PagarmeApiError && (error.status === 401 || error.status === 403);

    return NextResponse.json(
      {
        error: isAuthenticationError
          ? "Não foi possível autenticar o webhook."
          : "O webhook ainda não está disponível para validação.",
      },
      {
        status: isAuthenticationError ? 401 : 503,

        headers: isAuthenticationError
          ? undefined
          : {
              "Retry-After": "2",
            },
      }
    );
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

      payload: buildStoredWebhookPayload(verifiedWebhook),
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

    if (existingWebhookEvent.status === "ignored") {
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

  const supportedEvents = new Set([
    "invoice.paid",
    "invoice.payment_failed",
    "subscription.canceled",
  ]);

  if (!supportedEvents.has(verifiedWebhook.event)) {
    const { error: ignoredEventError } = await markWebhookIgnored(supabaseAdmin, webhookEventId);

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
      reason: "unsupported_event",
      webhookEventId,
    });
  }

  /*
   * -----------------------------------------------
   * SUBSCRIPTION.CANCELED
   * -----------------------------------------------
   */
  if (verifiedWebhook.event === "subscription.canceled") {
    const subscription = verifiedWebhook.data as PagarmeSubscriptionWebhookData;

    const subscriptionExternalId = subscription.id;

    const subscriptionStatus = subscription.status?.toLowerCase();

    if (!subscriptionExternalId || subscriptionStatus !== "canceled") {
      const errorMessage = "Os dados da assinatura cancelada estão incompletos.";

      await markWebhookFailed(supabaseAdmin, webhookEventId, errorMessage);

      return NextResponse.json({ error: errorMessage }, { status: 422 });
    }

    const canceledAt =
      subscription.canceled_at ?? subscription.updated_at ?? new Date().toISOString();

    const { data: cancellationData, error: cancellationError } = await supabaseAdmin.rpc(
      "process_pagarme_subscription_cancellation",
      {
        p_webhook_event_id: webhookEventId,

        p_subscription_external_id: subscriptionExternalId,

        p_subscription_status: subscriptionStatus,

        p_canceled_at: canceledAt,
      }
    );

    if (cancellationError) {
      console.error("[PROCESS_PAGARME_CANCELLATION_RPC_ERROR]", cancellationError);

      return NextResponse.json(
        { error: "Não foi possível processar o cancelamento da assinatura." },
        { status: 500 }
      );
    }

    const cancellationResult = cancellationData as {
      success?: boolean;
      message?: string;
      duplicate?: boolean;
      ignored?: boolean;
      reason?: string;
      credits_expired?: number;
      subscription_id?: string;
      current_status?: string;
    } | null;

    if (!cancellationResult?.success) {
      console.error("[PROCESS_PAGARME_CANCELLATION_ERROR]", cancellationResult);

      return NextResponse.json(
        {
          error:
            cancellationResult?.message ??
            "Não foi possível processar o cancelamento da assinatura.",
        },
        { status: 500 }
      );
    }

    if (
      !cancellationResult.duplicate &&
      !cancellationResult.ignored &&
      cancellationResult.current_status === "canceled"
    ) {
      await syncStudentEventsToDataCrazy({
        supabaseAdmin,
        subscriptionId: cancellationResult.subscription_id,
        webhookEventId,
        events: ["subscription_updated"],
      });
    }

    return NextResponse.json({
      received: true,
      processed: true,

      duplicate: cancellationResult.duplicate ?? false,

      ignored: cancellationResult.ignored ?? false,

      reason: cancellationResult.reason ?? null,

      creditsExpired: cancellationResult.credits_expired ?? 0,

      webhookEventId,
    });
  }

  /*
   * A partir daqui, o evento é relacionado a uma
   * fatura.
   */
  const invoice = verifiedWebhook.data as PagarmeInvoiceWebhookData;

  const subscriptionExternalId = invoice.subscription?.id;

  const recurrenceCycle = invoice.charge?.recurrence_cycle;

  /*
   * A primeira cobrança é tratada pelo checkout.
   */
  if (recurrenceCycle === "first") {
    const { error: ignoreFirstInvoiceError } = await markWebhookIgnored(
      supabaseAdmin,
      webhookEventId
    );

    if (ignoreFirstInvoiceError) {
      console.error("[IGNORE_FIRST_INVOICE_WEBHOOK_ERROR]", ignoreFirstInvoiceError);

      return NextResponse.json(
        { error: "Não foi possível finalizar a primeira cobrança ignorada." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      received: true,
      ignored: true,

      reason:
        verifiedWebhook.event === "invoice.paid"
          ? "initial_subscription_invoice"
          : "initial_subscription_payment_failure",

      webhookEventId,
    });
  }

  /*
   * -----------------------------------------------
   * INVOICE.PAID
   * -----------------------------------------------
   */
  if (verifiedWebhook.event === "invoice.paid") {
    const periodStart = invoice.cycle?.start_at;

    const periodEnd = invoice.cycle?.end_at;

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

      await markWebhookFailed(supabaseAdmin, webhookEventId, errorMessage);

      return NextResponse.json({ error: errorMessage }, { status: 422 });
    }

    let nextBillingAt: string | null = null;

    try {
      const pagarmeSubscription = await getPagarmeSubscription({
        subscriptionId: subscriptionExternalId,
      });

      nextBillingAt = pagarmeSubscription.next_billing_at ?? null;
    } catch (error) {
      console.error("[GET_PAGARME_SUBSCRIPTION_AFTER_RENEWAL_ERROR]", error);

      const errorMessage = "Não foi possível consultar a próxima cobrança da assinatura.";

      await markWebhookFailed(supabaseAdmin, webhookEventId, errorMessage);

      return NextResponse.json(
        { error: errorMessage },
        {
          status: 503,
          headers: {
            "Retry-After": "2",
          },
        }
      );
    }

    if (!nextBillingAt) {
      const errorMessage = "A Pagar.me não informou a próxima data de cobrança.";

      await markWebhookFailed(supabaseAdmin, webhookEventId, errorMessage);

      return NextResponse.json(
        { error: errorMessage },
        {
          status: 503,
          headers: {
            "Retry-After": "2",
          },
        }
      );
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

        p_next_billing_at: nextBillingAt,

        p_paid_at:
          invoice.charge?.paid_at ??
          invoice.charge?.updated_at ??
          invoice.updated_at ??
          invoice.created_at ??
          new Date().toISOString(),
      }
    );

    if (renewalError) {
      console.error("[PROCESS_PAGARME_RENEWAL_RPC_ERROR]", renewalError);

      return NextResponse.json(
        { error: "Não foi possível processar a renovação." },
        { status: 500 }
      );
    }

    const renewalResult = renewalData as {
      success?: boolean;
      message?: string;
      duplicate?: boolean;
      subscription_id?: string;
      downgrade_applied?: boolean;
    } | null;

    if (!renewalResult?.success) {
      console.error("[PROCESS_PAGARME_RENEWAL_ERROR]", renewalResult);

      return NextResponse.json(
        { error: renewalResult?.message ?? "Não foi possível processar a renovação." },
        { status: 500 }
      );
    }

    if (!renewalResult.duplicate) {
      const events: DataCrazyEvent[] = ["payment_status_updated"];

      if (renewalResult.downgrade_applied) {
        events.push("subscription_updated");
      }

      await syncStudentEventsToDataCrazy({
        supabaseAdmin,
        subscriptionId: renewalResult.subscription_id,
        webhookEventId,
        events,
      });
    }

    return NextResponse.json({
      received: true,
      processed: true,
      duplicate: renewalResult.duplicate ?? false,
      webhookEventId,
    });
  }

  /*
   * -----------------------------------------------
   * INVOICE.PAYMENT_FAILED
   * -----------------------------------------------
   */
  if (!invoice.id || !invoice.amount || invoice.amount <= 0 || !subscriptionExternalId) {
    const errorMessage = "Os dados da falha de pagamento estão incompletos.";

    await markWebhookFailed(supabaseAdmin, webhookEventId, errorMessage);

    return NextResponse.json({ error: errorMessage }, { status: 422 });
  }

  const lastTransaction = invoice.charge?.last_transaction;

  const rawFailureCode =
    lastTransaction?.acquirer_return_code ?? lastTransaction?.gateway_response?.code ?? null;

  const failureCode = rawFailureCode === null ? null : String(rawFailureCode);

  const failureMessage =
    lastTransaction?.acquirer_message ?? lastTransaction?.gateway_response?.message ?? null;

  const failedAt =
    lastTransaction?.updated_at ??
    lastTransaction?.created_at ??
    invoice.charge?.updated_at ??
    invoice.updated_at ??
    invoice.created_at ??
    new Date().toISOString();

  const { data: failureData, error: failureError } = await supabaseAdmin.rpc(
    "process_pagarme_subscription_payment_failure",
    {
      p_webhook_event_id: webhookEventId,

      p_subscription_external_id: subscriptionExternalId,

      p_invoice_external_id: invoice.id,

      p_invoice_amount: invoice.amount,

      p_invoice_status: invoice.status ?? "payment_failed",

      p_payment_method: invoice.payment_method ?? null,

      p_failure_code: failureCode,

      p_failure_message: failureMessage,

      p_failed_at: failedAt,
    }
  );

  if (failureError) {
    console.error("[PROCESS_PAGARME_PAYMENT_FAILURE_RPC_ERROR]", failureError);

    return NextResponse.json(
      { error: "Não foi possível processar a falha de pagamento." },
      { status: 500 }
    );
  }

  const failureResult = failureData as {
    success?: boolean;
    message?: string;
    duplicate?: boolean;
    ignored?: boolean;
    reason?: string;
    subscription_id?: string;
  } | null;

  if (!failureResult?.success) {
    console.error("[PROCESS_PAGARME_PAYMENT_FAILURE_ERROR]", failureResult);

    return NextResponse.json(
      { error: failureResult?.message ?? "Não foi possível processar a falha de pagamento." },
      { status: 500 }
    );
  }

  if (!failureResult.duplicate && !failureResult.ignored) {
    await syncStudentEventsToDataCrazy({
      supabaseAdmin,
      subscriptionId: failureResult.subscription_id,
      webhookEventId,
      events: ["payment_status_updated"],
    });
  }

  return NextResponse.json({
    received: true,
    processed: true,

    duplicate: failureResult.duplicate ?? false,

    ignored: failureResult.ignored ?? false,

    reason: failureResult.reason ?? null,

    webhookEventId,
  });
}
