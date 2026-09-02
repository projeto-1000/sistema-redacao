import { createAdminClient } from "@/lib/admin";
import {
  getPagarmeSubscription,
  listPagarmeSubscriptionInvoices,
  type PagarmeInvoice,
  type PagarmeSubscription,
} from "@repo/payments";
import {
  decideSubscriptionReconciliation,
  getPagarmeInvoicePeriod,
  type LocalSubscriptionReconciliationState,
} from "./policy";
import {
  buildReconciliationAttemptMetadata,
  selectDueReconciliationCandidates,
  shouldReopenProcessedReconciliationEvent,
} from "./queue";

type AdminClient = ReturnType<typeof createAdminClient>;

export type SubscriptionReconciliationResult =
  | { status: "synchronized"; subscriptionId: string }
  | { status: "renewed"; subscriptionId: string; invoiceIds: string[] }
  | { status: "payment_failure_applied"; subscriptionId: string; invoiceId: string }
  | { status: "cancellation_applied"; subscriptionId: string }
  | { status: "intervention_required"; subscriptionId: string; reason: string }
  | { status: "failed"; subscriptionId: string; reason: string };

function buildInvoiceEventPayload({
  event,
  invoice,
  subscriptionId,
}: {
  event: "invoice.paid" | "invoice.payment_failed";
  invoice: PagarmeInvoice;
  subscriptionId: string;
}) {
  const period = getPagarmeInvoicePeriod(invoice);
  const transaction = invoice.charge?.last_transaction;

  return {
    id: `reconciliation:${event}:${invoice.id}`,
    event,
    status: "reconciliation",
    data: {
      id: invoice.id,
      amount: invoice.amount,
      status: invoice.status,
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
        start_at: period?.start_at ?? null,
        end_at: period?.end_at ?? null,
      },
      subscription: {
        id: subscriptionId,
        status: invoice.subscription?.status ?? null,
      },
    },
  };
}

function buildCancellationEventPayload(subscription: PagarmeSubscription) {
  return {
    id: `reconciliation:subscription.canceled:${subscription.id}`,
    event: "subscription.canceled",
    status: "reconciliation",
    data: {
      id: subscription.id,
      status: subscription.status,
      created_at: subscription.created_at ?? null,
      updated_at: subscription.updated_at ?? null,
      canceled_at: subscription.canceled_at ?? null,
      customer: { id: subscription.customer?.id ?? null },
    },
  };
}

async function upsertReconciliationEvent({
  supabaseAdmin,
  externalId,
  eventType,
  payload,
  stateNeedsApplication,
}: {
  supabaseAdmin: AdminClient;
  externalId: string;
  eventType: string;
  payload: Record<string, unknown>;
  stateNeedsApplication: boolean;
}) {
  const { data: insertedEvent, error: insertError } = await supabaseAdmin
    .from("pagarme_webhook_events")
    .insert({
      external_id: externalId,
      event_type: eventType,
      source: "reconciliation",
      status: "received",
      payload,
    })
    .select("id")
    .single();

  if (!insertError && insertedEvent) {
    return { id: insertedEvent.id, state: "ready" as const };
  }

  if (insertError?.code !== "23505") {
    throw new Error("Não foi possível registrar a operação de reconciliação.");
  }

  const { data: existingEvent, error: existingEventError } = await supabaseAdmin
    .from("pagarme_webhook_events")
    .select("id, event_type, source, status")
    .eq("external_id", externalId)
    .maybeSingle();

  if (existingEventError || !existingEvent) {
    throw new Error("Não foi possível recuperar a operação de reconciliação.");
  }

  if (existingEvent.event_type !== eventType || existingEvent.source !== "reconciliation") {
    throw new Error("O identificador da reconciliação está vinculado a outro evento.");
  }

  if (
    existingEvent.status === "processed" &&
    !shouldReopenProcessedReconciliationEvent({
      status: existingEvent.status,
      stateNeedsApplication,
    })
  ) {
    return { id: existingEvent.id, state: "processed" as const };
  }

  if (existingEvent.status === "processing") {
    return { id: existingEvent.id, state: "processing" as const };
  }

  const { error: resetError } = await supabaseAdmin
    .from("pagarme_webhook_events")
    .update({
      status: "received",
      processed_at: null,
      error_message: null,
      payload,
      updated_at: new Date().toISOString(),
    })
    .eq("id", existingEvent.id);

  if (resetError) {
    throw new Error("Não foi possível preparar a operação de reconciliação.");
  }

  return { id: existingEvent.id, state: "ready" as const };
}

function getFailureDetails(invoice: PagarmeInvoice) {
  const transaction = invoice.charge?.last_transaction;
  const rawCode =
    transaction?.acquirer_return_code ?? transaction?.gateway_response?.code ?? null;

  return {
    code: rawCode === null ? null : String(rawCode),
    message:
      transaction?.acquirer_message ?? transaction?.gateway_response?.message ?? null,
    failedAt:
      transaction?.updated_at ??
      transaction?.created_at ??
      invoice.charge?.updated_at ??
      invoice.updated_at ??
      invoice.created_at ??
      new Date().toISOString(),
  };
}

async function applyPaymentFailure({
  supabaseAdmin,
  localSubscriptionId,
  remoteSubscriptionId,
  invoice,
}: {
  supabaseAdmin: AdminClient;
  localSubscriptionId: string;
  remoteSubscriptionId: string;
  invoice: PagarmeInvoice;
}): Promise<SubscriptionReconciliationResult> {
  const payload = buildInvoiceEventPayload({
    event: "invoice.payment_failed",
    invoice,
    subscriptionId: remoteSubscriptionId,
  });
  const event = await upsertReconciliationEvent({
    supabaseAdmin,
    externalId: payload.id,
    eventType: payload.event,
    payload,
    stateNeedsApplication: true,
  });

  if (event.state === "processing") {
    return {
      status: "intervention_required",
      subscriptionId: localSubscriptionId,
      reason: `reconciliation_event_processing:${invoice.id}`,
    };
  }

  if (event.state === "processed") {
    return {
      status: "payment_failure_applied",
      subscriptionId: localSubscriptionId,
      invoiceId: invoice.id,
    };
  }

  const failure = getFailureDetails(invoice);
  const { data, error } = await supabaseAdmin.rpc(
    "process_pagarme_subscription_payment_failure",
    {
      p_webhook_event_id: event.id,
      p_subscription_external_id: remoteSubscriptionId,
      p_invoice_external_id: invoice.id,
      p_invoice_amount: invoice.amount,
      p_invoice_status: invoice.status,
      p_payment_method: invoice.payment_method ?? null,
      p_failure_code: failure.code,
      p_failure_message: failure.message,
      p_failed_at: failure.failedAt,
    }
  );

  if (error || !(data as { success?: boolean } | null)?.success) {
    throw new Error("A reconciliação da falha de pagamento falhou.");
  }

  return {
    status: "payment_failure_applied",
    subscriptionId: localSubscriptionId,
    invoiceId: invoice.id,
  };
}

export async function reconcilePagarmeSubscription(
  localSubscription: LocalSubscriptionReconciliationState
): Promise<SubscriptionReconciliationResult> {
  const supabaseAdmin = createAdminClient();

  try {
    const [remoteSubscription, invoiceHistory] = await Promise.all([
      getPagarmeSubscription({ subscriptionId: localSubscription.external_id }),
      listPagarmeSubscriptionInvoices({
        subscriptionId: localSubscription.external_id,
        pageSize: 20,
        maxPages: 3,
      }),
    ]);

    const decision = decideSubscriptionReconciliation({
      localSubscription,
      remoteSubscription,
      invoices: invoiceHistory.invoices,
      historyComplete: invoiceHistory.historyComplete,
    });

    if (decision.kind === "synchronized") {
      return { status: "synchronized", subscriptionId: localSubscription.id };
    }

    if (decision.kind === "intervention_required") {
      return {
        status: "intervention_required",
        subscriptionId: localSubscription.id,
        reason: decision.reason,
      };
    }

    if (decision.kind === "cancel") {
      const payload = buildCancellationEventPayload(remoteSubscription);
      const event = await upsertReconciliationEvent({
        supabaseAdmin,
        externalId: payload.id,
        eventType: payload.event,
        payload,
        stateNeedsApplication: true,
      });

      if (event.state === "processing") {
        return {
          status: "intervention_required",
          subscriptionId: localSubscription.id,
          reason: `reconciliation_event_processing:${remoteSubscription.id}`,
        };
      }

      if (event.state === "processed") {
        return { status: "cancellation_applied", subscriptionId: localSubscription.id };
      }

      const { data, error } = await supabaseAdmin.rpc(
        "process_pagarme_subscription_cancellation",
        {
          p_webhook_event_id: event.id,
          p_subscription_external_id: remoteSubscription.id,
          p_subscription_status: "canceled",
          p_canceled_at:
            remoteSubscription.canceled_at ??
            remoteSubscription.updated_at ??
            new Date().toISOString(),
        }
      );

      if (error || !(data as { success?: boolean } | null)?.success) {
        throw new Error("A reconciliação do cancelamento falhou.");
      }

      return { status: "cancellation_applied", subscriptionId: localSubscription.id };
    }

    if (decision.kind === "payment_failure") {
      return applyPaymentFailure({
        supabaseAdmin,
        localSubscriptionId: localSubscription.id,
        remoteSubscriptionId: remoteSubscription.id,
        invoice: decision.invoice,
      });
    }

    const appliedInvoiceIds: string[] = [];

    for (const invoice of decision.invoices) {
      const period = getPagarmeInvoicePeriod(invoice);

      if (!period?.start_at || !period.end_at || !remoteSubscription.next_billing_at) {
        return {
          status: "intervention_required",
          subscriptionId: localSubscription.id,
          reason: `invalid_paid_invoice:${invoice.id}`,
        };
      }

      const payload = buildInvoiceEventPayload({
        event: "invoice.paid",
        invoice,
        subscriptionId: remoteSubscription.id,
      });
      const event = await upsertReconciliationEvent({
        supabaseAdmin,
        externalId: payload.id,
        eventType: payload.event,
        payload,
        stateNeedsApplication: true,
      });

      if (event.state === "processing") {
        return {
          status: "intervention_required",
          subscriptionId: localSubscription.id,
          reason: `reconciliation_event_processing:${invoice.id}`,
        };
      }

      if (event.state === "processed") {
        appliedInvoiceIds.push(invoice.id);
        continue;
      }

      const { data, error } = await supabaseAdmin.rpc(
        "process_pagarme_subscription_renewal",
        {
          p_webhook_event_id: event.id,
          p_subscription_external_id: remoteSubscription.id,
          p_invoice_external_id: invoice.id,
          p_invoice_amount: invoice.amount,
          p_invoice_status: invoice.status,
          p_payment_method: invoice.payment_method ?? null,
          p_period_start: period.start_at,
          p_period_end: period.end_at,
          p_next_billing_at: remoteSubscription.next_billing_at,
          p_paid_at:
            invoice.charge?.paid_at ??
            invoice.charge?.updated_at ??
            invoice.updated_at ??
            invoice.created_at ??
            new Date().toISOString(),
        }
      );

      if (error || !(data as { success?: boolean } | null)?.success) {
        const message = (data as { message?: string } | null)?.message;

        return {
          status: "intervention_required",
          subscriptionId: localSubscription.id,
          reason: message ?? `renewal_failed:${invoice.id}`,
        };
      }

      appliedInvoiceIds.push(invoice.id);
    }

    if (decision.subsequentFailure) {
      return applyPaymentFailure({
        supabaseAdmin,
        localSubscriptionId: localSubscription.id,
        remoteSubscriptionId: remoteSubscription.id,
        invoice: decision.subsequentFailure,
      });
    }

    return {
      status: "renewed",
      subscriptionId: localSubscription.id,
      invoiceIds: appliedInvoiceIds,
    };
  } catch (error) {
    return {
      status: "failed",
      subscriptionId: localSubscription.id,
      reason: error instanceof Error ? error.message : "Falha desconhecida na reconciliação.",
    };
  }
}

export async function reconcileDuePagarmeSubscriptions({ limit = 25 } = {}) {
  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new Error("Limite de reconciliação inválido.");
  }

  const supabaseAdmin = createAdminClient();
  const now = new Date();
  const nowIso = now.toISOString();
  const { data, error } = await supabaseAdmin
    .from("subscriptions")
    .select(
      "id, external_id, status, current_period_start, current_period_end, next_billing_at, metadata, updated_at"
    )
    .in("status", ["active", "trial", "past_due"])
    .like("external_id", "sub_%")
    .or(`current_period_end.lt.${nowIso},status.eq.past_due`)
    .or(
      `metadata->>reconciliation_retry_after.is.null,metadata->>reconciliation_retry_after.lte.${nowIso}`
    )
    .order("current_period_end", { ascending: true })
    .limit(limit);

  if (error) {
    throw new Error("Não foi possível localizar assinaturas para reconciliação.");
  }

  const candidates = selectDueReconciliationCandidates(
    (data ?? []) as LocalSubscriptionReconciliationState[],
    now,
    limit
  );
  const results: SubscriptionReconciliationResult[] = [];
  let claimedCount = 0;

  for (const subscription of candidates) {
    const attemptMetadata = buildReconciliationAttemptMetadata(subscription.metadata, now);
    const { data: claimedSubscription, error: claimError } = await supabaseAdmin
      .from("subscriptions")
      .update({ metadata: attemptMetadata, updated_at: nowIso })
      .eq("id", subscription.id)
      .eq("updated_at", subscription.updated_at)
      .or(
        `metadata->>reconciliation_retry_after.is.null,metadata->>reconciliation_retry_after.lte.${nowIso}`
      )
      .select(
        "id, external_id, status, current_period_start, current_period_end, next_billing_at, metadata, updated_at"
      )
      .maybeSingle();

    if (claimError) {
      results.push({
        status: "failed",
        subscriptionId: subscription.id,
        reason: "reconciliation_candidate_claim_failed",
      });
      continue;
    }

    if (!claimedSubscription) {
      continue;
    }

    claimedCount += 1;
    results.push(
      await reconcilePagarmeSubscription(
        claimedSubscription as LocalSubscriptionReconciliationState
      )
    );
  }

  return {
    candidateCount: candidates.length,
    claimedCount,
    results,
  };
}
