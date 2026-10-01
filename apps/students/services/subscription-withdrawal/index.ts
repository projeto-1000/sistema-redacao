import "server-only";

import {
  cancelPagarmeSubscription,
  getPagarmeChargeInvoiceId,
  getPagarmeSubscription,
  isPagarmeChargeFullyRefunded,
  listPagarmeInvoiceCharges,
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
  alreadyRefunded: boolean;
  refundedAt: string | null;
  providerRefundId: string | null;
}

interface RefundDiscoveryContext extends Omit<WithdrawalContext, "requestId"> {
  providerLocalSubscriptionCode?: string;
}

async function markOperationalIssue(requestId: string, stage: string, error: unknown) {
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
  providerLocalSubscriptionCode,
}: RefundDiscoveryContext): Promise<RefundTarget[]> {
  const supabaseAdmin = createAdminClient();
  const activatedAt = new Date(originalActivatedAt).getTime();

  if (Number.isNaN(activatedAt)) {
    throw new Error("A data de ativação original da assinatura é inválida.");
  }

  const { data: initialPayment, error: initialPaymentError } = await supabaseAdmin
    .from("student_payments")
    .select("metadata")
    .eq("user_id", userId)
    .eq("subscription_id", subscriptionId)
    .eq("kind", "subscription")
    .in("status", ["paid", "active"])
    .order("paid_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (initialPaymentError) {
    throw new Error("Não foi possível consultar os identificadores do pagamento inicial.");
  }

  const initialPaymentMetadata = initialPayment?.metadata as Record<string, unknown> | undefined;
  const localSubscriptionCode =
    providerLocalSubscriptionCode ?? initialPaymentMetadata?.local_subscription_code;

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
    if (!Number.isInteger(invoice.amount) || invoice.amount <= 0) {
      continue;
    }

    const invoiceCreatedAt = invoice.created_at
      ? new Date(invoice.created_at).getTime()
      : Number.NaN;
    const chargeSearchStart = new Date(
      Math.min(activatedAt, Number.isNaN(invoiceCreatedAt) ? activatedAt : invoiceCreatedAt) -
        5 * 60 * 1000
    ).toISOString();

    const chargeHistory = await listPagarmeInvoiceCharges({
      invoiceId: invoice.id,
      createdSince: chargeSearchStart,
      pageSize: 30,
      maxPages: 10,
    });

    if (!chargeHistory.historyComplete) {
      throw new Error(`O histórico de cobranças da fatura ${invoice.id} está incompleto.`);
    }

    for (const charge of chargeHistory.candidates) {
      const paidAt = charge.paid_at ?? charge.updated_at ?? charge.created_at;
      const paidAtMs = paidAt ? new Date(paidAt).getTime() : Number.NaN;
      const chargeInvoiceId = getPagarmeChargeInvoiceId(charge);
      const metadataMatchesSubscription =
        typeof localSubscriptionCode === "string" &&
        localSubscriptionCode.length > 0 &&
        charge.metadata?.user_id === userId &&
        charge.metadata.local_subscription_code === localSubscriptionCode &&
        charge.amount === invoice.amount;
      const alreadyRefunded = isPagarmeChargeFullyRefunded(charge);

      if (
        (chargeInvoiceId !== invoice.id && !metadataMatchesSubscription) ||
        (charge.status !== "paid" && !alreadyRefunded) ||
        !/^ch_[A-Za-z0-9]+$/.test(charge.id) ||
        !Number.isInteger(charge.amount) ||
        charge.amount <= 0 ||
        Number.isNaN(paidAtMs) ||
        (!metadataMatchesSubscription && paidAtMs < activatedAt - 5 * 60 * 1000)
      ) {
        continue;
      }

      targets.set(charge.id, {
        chargeId: charge.id,
        invoiceId: chargeInvoiceId ?? invoice.id,
        studentPaymentId: null,
        amount: charge.amount,
        paidAt: paidAt ?? null,
        source: "subscription_invoice",
        alreadyRefunded,
        refundedAt: charge.refunded_at ?? charge.updated_at ?? null,
        providerRefundId: charge.last_transaction?.id ?? null,
      });
    }
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
      alreadyRefunded: false,
      refundedAt: null,
      providerRefundId: null,
    });
  }

  return [...targets.values()];
}

export async function startSubscriptionWithdrawalRefund(context: WithdrawalContext) {
  const supabaseAdmin = createAdminClient();
  let targets: RefundTarget[];

  try {
    const providerSubscription = await getPagarmeSubscription({
      subscriptionId: context.providerSubscriptionId,
    });
    targets = await collectRefundTargets({
      ...context,
      providerLocalSubscriptionCode:
        providerSubscription.metadata?.local_subscription_code ?? providerSubscription.code,
    });

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

  try {
    // Do not cancel invoices before refunding: Pagar.me changes the paid charge
    // to canceled, which prevents the refund request from targeting it safely.
    const canceledSubscription = await cancelPagarmeSubscription({
      subscriptionId: context.providerSubscriptionId,
      cancelPendingInvoices: false,
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

  const confirmRefund = async (
    chargeId: string,
    refundedAt: string | null | undefined,
    providerRefundId: string | null | undefined
  ) => {
    const { data, error } = await supabaseAdmin.rpc(
      "process_subscription_withdrawal_refund_confirmation",
      {
        p_provider_charge_id: chargeId,
        p_refunded_at: refundedAt ?? new Date().toISOString(),
        p_provider_refund_id: providerRefundId ?? null,
      }
    );

    if (error) {
      throw error;
    }

    const result = data as { matched?: boolean } | null;

    if (!result?.matched) {
      throw new Error(
        "O estorno foi confirmado no Pagar.me, mas não foi possível vinculá-lo ao pedido local."
      );
    }
  };

  for (const target of targets) {
    const idempotencyKey = `withdrawal-refund-${context.requestId}-${target.chargeId}`;

    try {
      if (target.alreadyRefunded) {
        await confirmRefund(target.chargeId, target.refundedAt, target.providerRefundId);
        continue;
      }

      const refundedCharge = await refundPagarmeCharge({
        chargeId: target.chargeId,
        amount: target.amount,
        idempotencyKey,
      });

      if (isPagarmeChargeFullyRefunded(refundedCharge)) {
        await confirmRefund(
          refundedCharge.id,
          refundedCharge.refunded_at ?? refundedCharge.updated_at,
          refundedCharge.last_transaction?.id
        );
        continue;
      }

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
