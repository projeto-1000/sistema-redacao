import "server-only";

import { createAdminClient } from "@/lib/admin";
import {
  cancelPagarmeSubscription,
  getPagarmeCharge,
  getPagarmeChargeInvoiceId,
  getConfirmedRefundTotal,
  getPagarmeSubscription,
  listPagarmeSubscriptionInvoices,
  refundPagarmeCharge,
} from "@repo/payments";
import type { SubscriptionSupportOperation } from "@repo/types";
import { runSupportWorkflow } from "./workflow";

export async function resolveSupportCharge(
  payment: {
    amount: number;
    paid_at: string;
    metadata: Record<string, unknown>;
  },
  providerSubscriptionId: string,
  requirePaidCharge = true
) {
  const invoices = await listPagarmeSubscriptionInvoices({
    subscriptionId: providerSubscriptionId,
  });
  if (!invoices.historyComplete) throw new Error("O histórico de faturas está incompleto.");
  const matches = invoices.invoices.filter(
    (invoice) =>
      invoice.amount === payment.amount &&
      invoice.charge?.id &&
      (payment.metadata.pagarme_invoice_id === invoice.id ||
        (invoice.charge.paid_at &&
          Math.abs(Date.parse(invoice.charge.paid_at) - Date.parse(payment.paid_at)) < 60_000))
  );
  if (matches.length !== 1)
    throw new Error("Não foi possível identificar uma única cobrança para este pagamento.");
  const invoice = matches[0]!;
  const charge = await getPagarmeCharge({ chargeId: invoice.charge!.id! });
  if (
    charge.amount !== payment.amount ||
    getPagarmeChargeInvoiceId(charge) !== invoice.id ||
    (requirePaidCharge && charge.status !== "paid")
  ) {
    throw new Error("A cobrança não está disponível para reembolso.");
  }
  return charge;
}

export async function processSupportOperation(
  operation: SubscriptionSupportOperation,
  verifyOnly = false
) {
  const admin = createAdminClient();
  const claimDispatch = async () => {
    const { data, error } = await admin
      .from("subscription_support_operations")
      .update({ dispatched_at: new Date().toISOString() })
      .eq("id", operation.id)
      .is("dispatched_at", null)
      .select("id")
      .maybeSingle();
    if (error) throw new Error("Não foi possível reservar o envio do atendimento.");
    return Boolean(data);
  };
  const advance = async (canceled: boolean, total: number | null, failure = false) => {
    const { data, error } = await admin.rpc("advance_subscription_support_operation", {
      p_id: operation.id,
      p_provider_canceled: canceled,
      p_refunded_total: total,
      p_failure: failure,
    });
    if (error) throw new Error("Não foi possível registrar a confirmação do atendimento.");
    return data as SubscriptionSupportOperation;
  };
  return runSupportWorkflow(
    operation,
    {
      claimDispatch,
      advance,
      readCanceled: async () => {
        const subscription = await getPagarmeSubscription({
          subscriptionId: operation.provider_subscription_id,
        });
        return subscription.status === "canceled";
      },
      cancel: async () => {
        const subscription = await cancelPagarmeSubscription({
          subscriptionId: operation.provider_subscription_id,
          cancelPendingInvoices: operation.action === "cancel_only",
          idempotencyKey: `support-cancel-${operation.id}`,
        });
        return subscription.status === "canceled";
      },
      readRefundTotal: async () =>
        getConfirmedRefundTotal(await getPagarmeCharge({ chargeId: operation.provider_charge_id })),
      refund: async () => {
        const charge = await refundPagarmeCharge({
          chargeId: operation.provider_charge_id,
          amount: operation.amount,
          idempotencyKey: `support-refund-${operation.id}`,
        });
        return getConfirmedRefundTotal(charge);
      },
    },
    verifyOnly
  );
}
