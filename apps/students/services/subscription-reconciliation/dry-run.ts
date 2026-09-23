import { createAdminClient } from "@/lib/admin";
import {
  getPagarmeSubscription,
  listPagarmeSubscriptionInvoices,
  type PagarmeInvoice,
} from "@repo/payments";
import { listDuePagarmeSubscriptionCandidates } from "./candidates";
import {
  decideSubscriptionReconciliation,
  getPagarmeInvoicePeriod,
  type SubscriptionReconciliationDecision,
} from "./policy";

function summarizeInvoice(invoice: PagarmeInvoice) {
  const period = getPagarmeInvoicePeriod(invoice);

  return {
    id: invoice.id,
    status: invoice.status,
    periodStart: period?.start_at ?? null,
    periodEnd: period?.end_at ?? null,
  };
}

function getDecisionReason(decision: SubscriptionReconciliationDecision) {
  return decision.kind === "intervention_required" ? decision.reason : null;
}

function getInvoicesThatWouldBeApplied(decision: SubscriptionReconciliationDecision) {
  if (decision.kind === "renew") {
    return [
      ...decision.invoices.map(summarizeInvoice),
      ...(decision.subsequentFailure
        ? [summarizeInvoice(decision.subsequentFailure)]
        : []),
    ];
  }

  if (decision.kind === "payment_failure") {
    return [summarizeInvoice(decision.invoice)];
  }

  return [];
}

export async function dryRunDuePagarmeSubscriptions({ limit = 25 } = {}) {
  const supabaseAdmin = createAdminClient();
  const candidates = await listDuePagarmeSubscriptionCandidates({
    supabaseAdmin,
    now: new Date(),
    limit,
  });

  const results = [];

  for (const localSubscription of candidates) {
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

      results.push({
        localSubscriptionId: localSubscription.id,
        externalId: localSubscription.external_id,
        localStatus: localSubscription.status,
        currentPeriodStart: localSubscription.current_period_start,
        currentPeriodEnd: localSubscription.current_period_end,
        remoteStatus: remoteSubscription.status,
        invoiceCount: invoiceHistory.invoices.length,
        invoiceHistoryComplete: invoiceHistory.historyComplete,
        decision: decision.kind,
        reason: getDecisionReason(decision),
        invoicesThatWouldBeApplied: getInvoicesThatWouldBeApplied(decision),
        interventionRequired: decision.kind === "intervention_required",
      });
    } catch {
      results.push({
        localSubscriptionId: localSubscription.id,
        externalId: localSubscription.external_id,
        localStatus: localSubscription.status,
        currentPeriodStart: localSubscription.current_period_start,
        currentPeriodEnd: localSubscription.current_period_end,
        remoteStatus: null,
        invoiceCount: 0,
        invoiceHistoryComplete: false,
        decision: "remote_lookup_failed",
        reason: "remote_lookup_failed",
        invoicesThatWouldBeApplied: [],
        interventionRequired: true,
      });
    }
  }

  return {
    dryRun: true,
    candidateCount: candidates.length,
    results,
  };
}
