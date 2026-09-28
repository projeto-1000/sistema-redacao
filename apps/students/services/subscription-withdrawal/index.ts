import "server-only";

import {
  cancelPagarmeSubscription,
  listPagarmeSubscriptionInvoices,
  refundPagarmeCharge,
  updatePagarmeSubscriptionItem,
} from "@repo/payments";

import { createAdminClient } from "@/lib/admin";
import { resolvePagarmeSubscriptionItem } from "@/services/plan-change/pagarme";

interface WithdrawalContext {
  requestId: string;
  userId: string;
  subscriptionId: string;
  providerSubscriptionId: string;
  originalActivatedAt: string;
}

interface RefundTarget {
  chargeId: string;
  invoiceId: string | null;
  studentPaymentId: string | null;
  amount: number;
  paidAt: string | null;
  source: "subscription_invoice" | "plan_upgrade";
}

async function markOperationalIssue(
  requestId: string,
  stage: string,
  error: unknown
) {
  const supabaseAdmin = createAdminClient();
  const message = error instanceof Error ? error.message : "Falha operacional não detalhada.";

  const { error: rpcError } = await supabaseAdmin.rpc(
    "mark_subscription_withdrawal_operational_issue",
    {
      p_request_id: requestId,
      p_stage: stage,
      p_message: message,
    }
  );

  if (rpcError) {
    console.error("[MARK_WITHDRAWAL_OPERATIONAL_ISSUE_ERROR]", {
      requestId,
      stage,
      rpcError,
    });
  }
}

export async function holdSubscriptionRenewalForManualReview({
  requestId,
  providerSubscriptionId,
}: Pick<WithdrawalContext, "requestId" | "providerSubscriptionId">) {
  const supabaseAdmin = createAdminClient();
  let providerItemId: string | null = null;

  try {
    const item = await resolvePagarmeSubscriptionItem({
      subscriptionExternalId: providerSubscriptionId,
    });

    const price = item.pricing_scheme.price;
    providerItemId = item.id;

    if (!price) {
      throw new Error("O item recorrente não possui preço fixo para ser bloqueado.");
    }

    await updatePagarmeSubscriptionItem({
      subscriptionId: providerSubscriptionId,
      itemId: item.id,
      name: item.name ?? "Assinatura Projeto 1000",
      description: item.description ?? item.name ?? "Assinatura Projeto 1000",
      price,
      quantity: item.quantity,
      status: "inactive",
    });

    const { error } = await supabaseAdmin.rpc("set_subscription_withdrawal_provider_hold", {
      p_request_id: requestId,
      p_provider_item_id: item.id,
    });

    if (error) {
      throw error;
    }
  } catch (error) {
    if (providerItemId) {
      await supabaseAdmin
        .from("subscription_withdrawal_requests")
        .update({ provider_item_id: providerItemId })
        .eq("id", requestId)
        .is("provider_item_id", null);
    }

    await markOperationalIssue(requestId, "provider_renewal_hold", error);
    throw error;
  }
}

async function collectRefundTargets({
  userId,
  subscriptionId,
  providerSubscriptionId,
  originalActivatedAt,
}: Omit<WithdrawalContext, "requestId">): Promise<RefundTarget[]> {
  const supabaseAdmin = createAdminClient();
  const activatedAt = new Date(originalActivatedAt).getTime();

  if (Number.isNaN(activatedAt)) {
    throw new Error("A data de ativação original da assinatura é inválida.");
  }

  const history = await listPagarmeSubscriptionInvoices({
    subscriptionId: providerSubscriptionId,
    pageSize: 100,
    maxPages: 10,
  });

  if (!history.historyComplete) {
    throw new Error("O histórico completo de faturas não pôde ser consultado.");
  }

  const targets = new Map<string, RefundTarget>();

  for (const invoice of history.invoices) {
    const chargeId = invoice.charge?.id;
    const paidAt = invoice.charge?.paid_at ?? invoice.updated_at ?? invoice.created_at;
    const paidAtMs = paidAt ? new Date(paidAt).getTime() : Number.NaN;

    if (
      invoice.status !== "paid" ||
      !chargeId ||
      !/^ch_[A-Za-z0-9]+$/.test(chargeId) ||
      !Number.isInteger(invoice.amount) ||
      invoice.amount <= 0 ||
      Number.isNaN(paidAtMs) ||
      paidAtMs < activatedAt
    ) {
      continue;
    }

    targets.set(chargeId, {
      chargeId,
      invoiceId: invoice.id,
      studentPaymentId: null,
      amount: invoice.amount,
      paidAt: paidAt ?? null,
      source: "subscription_invoice",
    });
  }

  const { data: upgradePayments, error: upgradePaymentsError } = await supabaseAdmin
    .from("student_payments")
    .select("id, amount, paid_at, metadata")
    .eq("user_id", userId)
    .eq("subscription_id", subscriptionId)
    .eq("kind", "plan_upgrade_prorata")
    .in("status", ["paid", "active"])
    .gte("paid_at", originalActivatedAt);

  if (upgradePaymentsError) {
    throw new Error("Não foi possível consultar os pagamentos de upgrade da assinatura.");
  }

  for (const payment of upgradePayments ?? []) {
    const metadata = payment.metadata as Record<string, unknown>;
    const chargeId = metadata.pagarme_charge_id;

    if (
      typeof chargeId !== "string" ||
      !/^ch_[A-Za-z0-9]+$/.test(chargeId) ||
      !Number.isInteger(payment.amount) ||
      payment.amount <= 0
    ) {
      continue;
    }

    targets.set(chargeId, {
      chargeId,
      invoiceId: null,
      studentPaymentId: payment.id,
      amount: payment.amount,
      paidAt: payment.paid_at,
      source: "plan_upgrade",
    });
  }

  return [...targets.values()];
}

export async function startSubscriptionWithdrawalRefund(context: WithdrawalContext) {
  const supabaseAdmin = createAdminClient();

  try {
    const canceledSubscription = await cancelPagarmeSubscription({
      subscriptionId: context.providerSubscriptionId,
      cancelPendingInvoices: true,
      idempotencyKey: `withdrawal-cancel-${context.requestId}`,
    });

    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({
        cancellation_provider_status: canceledSubscription.status,
        provider_canceled_at: canceledSubscription.canceled_at ?? new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", context.subscriptionId)
      .eq("active_withdrawal_request_id", context.requestId);

    if (error) {
      throw error;
    }
  } catch (error) {
    await markOperationalIssue(context.requestId, "provider_subscription_cancellation", error);
    throw error;
  }

  let targets: RefundTarget[];

  try {
    targets = await collectRefundTargets(context);

    if (targets.length === 0) {
      throw new Error("Nenhuma cobrança paga elegível para reembolso foi encontrada.");
    }
  } catch (error) {
    await markOperationalIssue(context.requestId, "refund_target_discovery", error);
    throw error;
  }

  const refundRows = targets.map((target) => ({
    request_id: context.requestId,
    student_payment_id: target.studentPaymentId,
    provider_charge_id: target.chargeId,
    provider_invoice_id: target.invoiceId,
    amount: target.amount,
    status: "pending",
    idempotency_key: `withdrawal-refund-${context.requestId}-${target.chargeId}`,
    metadata: {
      source: target.source,
      paid_at: target.paidAt,
      provider_subscription_id: context.providerSubscriptionId,
    },
  }));

  const { error: refundRowsError } = await supabaseAdmin
    .from("subscription_withdrawal_refunds")
    .upsert(refundRows, {
      onConflict: "request_id,provider_charge_id",
      ignoreDuplicates: true,
    });

  if (refundRowsError) {
    await markOperationalIssue(context.requestId, "refund_audit_creation", refundRowsError);
    throw refundRowsError;
  }

  const { error: startError } = await supabaseAdmin
    .from("subscription_withdrawal_requests")
    .update({ refund_started_at: new Date().toISOString() })
    .eq("id", context.requestId);

  if (startError) {
    await markOperationalIssue(context.requestId, "refund_start_recording", startError);
    throw startError;
  }

  for (const target of targets) {
    const idempotencyKey = `withdrawal-refund-${context.requestId}-${target.chargeId}`;

    try {
      await refundPagarmeCharge({
        chargeId: target.chargeId,
        amount: target.amount,
        idempotencyKey,
      });

      const { error } = await supabaseAdmin
        .from("subscription_withdrawal_refunds")
        .update({
          status: "processing",
          requested_at: new Date().toISOString(),
          failed_at: null,
          failure_message: null,
        })
        .eq("request_id", context.requestId)
        .eq("provider_charge_id", target.chargeId)
        .neq("status", "refunded");

      if (error) {
        throw error;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Falha ao iniciar o reembolso.";

      await supabaseAdmin
        .from("subscription_withdrawal_refunds")
        .update({
          status: "failed",
          failed_at: new Date().toISOString(),
          failure_message: message,
        })
        .eq("request_id", context.requestId)
        .eq("provider_charge_id", target.chargeId)
        .neq("status", "refunded");

      await markOperationalIssue(context.requestId, "provider_refund", error);
      throw error;
    }
  }
}
