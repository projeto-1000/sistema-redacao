import type { PagarmeInvoice, PagarmeSubscription } from "@repo/payments";

export interface LocalSubscriptionReconciliationState {
  id: string;
  external_id: string;
  status: "active" | "trial" | "past_due";
  current_period_start: string | null;
  current_period_end: string | null;
  next_billing_at: string | null;
  metadata: Record<string, unknown> | null;
  updated_at: string;
}

export type SubscriptionReconciliationDecision =
  | { kind: "cancel" }
  | { kind: "renew"; invoices: PagarmeInvoice[]; subsequentFailure?: PagarmeInvoice }
  | { kind: "payment_failure"; invoice: PagarmeInvoice }
  | { kind: "synchronized" }
  | { kind: "intervention_required"; reason: string };

export function getPagarmeInvoicePeriod(invoice: PagarmeInvoice) {
  return invoice.period ?? invoice.cycle;
}

function parseTimestamp(value: string | null | undefined) {
  if (!value) {
    return null;
  }

  const timestamp = new Date(value).getTime();

  return Number.isFinite(timestamp) ? timestamp : null;
}

function getInvoiceTimestamp(invoice: PagarmeInvoice) {
  const candidates = [
    invoice.charge?.last_transaction?.updated_at,
    invoice.charge?.last_transaction?.created_at,
    invoice.charge?.paid_at,
    invoice.charge?.updated_at,
    invoice.charge?.created_at,
    invoice.updated_at,
    invoice.created_at,
    invoice.billing_at,
  ];

  for (const candidate of candidates) {
    const timestamp = parseTimestamp(candidate);

    if (timestamp !== null) {
      return timestamp;
    }
  }

  return null;
}

function isSubsequentInvoice(invoice: PagarmeInvoice) {
  return invoice.charge?.recurrence_cycle !== "first";
}

function belongsToSubscription(invoice: PagarmeInvoice, subscriptionId: string) {
  return !invoice.subscription?.id || invoice.subscription.id === subscriptionId;
}

function deduplicateInvoices(invoices: PagarmeInvoice[]) {
  const byId = new Map<string, PagarmeInvoice>();

  for (const invoice of invoices) {
    const previous = byId.get(invoice.id);

    if (!previous) {
      byId.set(invoice.id, invoice);
      continue;
    }

    const previousTimestamp = getInvoiceTimestamp(previous);
    const currentTimestamp = getInvoiceTimestamp(invoice);

    if (
      (currentTimestamp !== null &&
        (previousTimestamp === null || currentTimestamp > previousTimestamp)) ||
      (currentTimestamp === previousTimestamp && invoice.status === "paid")
    ) {
      byId.set(invoice.id, invoice);
    }
  }

  return [...byId.values()];
}

function compareInvoicePeriods(left: PagarmeInvoice, right: PagarmeInvoice) {
  const leftPeriod = getPagarmeInvoicePeriod(left);
  const rightPeriod = getPagarmeInvoicePeriod(right);
  const leftStart = parseTimestamp(leftPeriod?.start_at);
  const rightStart = parseTimestamp(rightPeriod?.start_at);

  if (leftStart !== null && rightStart !== null && leftStart !== rightStart) {
    return leftStart - rightStart;
  }

  const leftEnd = parseTimestamp(leftPeriod?.end_at);
  const rightEnd = parseTimestamp(rightPeriod?.end_at);

  if (leftEnd !== null && rightEnd !== null && leftEnd !== rightEnd) {
    return leftEnd - rightEnd;
  }

  return (getInvoiceTimestamp(left) ?? 0) - (getInvoiceTimestamp(right) ?? 0);
}

function compareFinancialCausality(left: PagarmeInvoice, right: PagarmeInvoice) {
  const periodComparison = compareInvoicePeriods(left, right);

  if (periodComparison !== 0) {
    return periodComparison;
  }

  const leftTimestamp = getInvoiceTimestamp(left);
  const rightTimestamp = getInvoiceTimestamp(right);

  if (leftTimestamp === null || rightTimestamp === null) {
    return null;
  }

  return leftTimestamp - rightTimestamp;
}

export function areSubscriptionPeriodsContinuous(
  currentPeriodEnd: string,
  nextPeriodStart: string
) {
  const currentEnd = parseTimestamp(currentPeriodEnd);
  const nextStart = parseTimestamp(nextPeriodStart);

  if (currentEnd === null || nextStart === null) {
    return false;
  }

  const difference = nextStart - currentEnd;

  return difference >= 0 && difference <= 1000;
}

export function decideSubscriptionReconciliation({
  localSubscription,
  remoteSubscription,
  invoices,
  historyComplete = true,
}: {
  localSubscription: LocalSubscriptionReconciliationState;
  remoteSubscription: PagarmeSubscription;
  invoices: PagarmeInvoice[];
  historyComplete?: boolean;
}): SubscriptionReconciliationDecision {
  if (remoteSubscription.id !== localSubscription.external_id) {
    return {
      kind: "intervention_required",
      reason: "remote_subscription_id_mismatch",
    };
  }

  if (remoteSubscription.status === "canceled") {
    return { kind: "cancel" };
  }

  if (!historyComplete) {
    return {
      kind: "intervention_required",
      reason: "invoice_history_truncated",
    };
  }

  const relevantInvoices = deduplicateInvoices(invoices).filter(
    (invoice) =>
      belongsToSubscription(invoice, remoteSubscription.id) && isSubsequentInvoice(invoice)
  );

  const malformedPaidInvoice = relevantInvoices.find((invoice) => {
    if (invoice.status !== "paid") {
      return false;
    }

    const period = getPagarmeInvoicePeriod(invoice);

    return (
      !invoice.id.startsWith("in_") ||
      !Number.isInteger(invoice.amount) ||
      invoice.amount <= 0 ||
      !period?.start_at ||
      !period.end_at ||
      new Date(period.end_at).getTime() <= new Date(period.start_at).getTime()
    );
  });

  if (malformedPaidInvoice) {
    return {
      kind: "intervention_required",
      reason: `invalid_paid_invoice:${malformedPaidInvoice.id}`,
    };
  }

  const localPeriodEnd = parseTimestamp(localSubscription.current_period_end);

  const paidInvoices = relevantInvoices
    .filter((invoice) => invoice.status === "paid")
    .filter((invoice) => {
      const period = getPagarmeInvoicePeriod(invoice);

      if (!period?.end_at || localPeriodEnd === null) {
        return true;
      }

      const periodEnd = parseTimestamp(period.end_at);

      return periodEnd !== null && periodEnd >= localPeriodEnd;
    })
    .sort(compareInvoicePeriods);

  const lastAppliedInvoiceId = localSubscription.metadata?.last_pagarme_invoice_id;
  const invoicesToApply = paidInvoices.filter((invoice) => {
    const period = getPagarmeInvoicePeriod(invoice);
    const periodEnd = parseTimestamp(period?.end_at);

    return (
      periodEnd === null ||
      localPeriodEnd === null ||
      periodEnd > localPeriodEnd ||
      (localSubscription.status === "past_due" && invoice.id !== lastAppliedInvoiceId)
    );
  });

  if (invoicesToApply.length > 0 && !localSubscription.current_period_end) {
    return {
      kind: "intervention_required",
      reason: "local_period_end_missing",
    };
  }

  let expectedPeriodEnd = localSubscription.current_period_end;

  for (const invoice of invoicesToApply) {
    const period = getPagarmeInvoicePeriod(invoice);
    const periodEnd = parseTimestamp(period?.end_at);

    if (
      expectedPeriodEnd &&
      period?.start_at &&
      periodEnd !== localPeriodEnd &&
      !areSubscriptionPeriodsContinuous(expectedPeriodEnd, period.start_at)
    ) {
      return {
        kind: "intervention_required",
        reason: `invoice_period_gap:${invoice.id}`,
      };
    }

    if (period?.end_at && periodEnd !== localPeriodEnd) {
      expectedPeriodEnd = period.end_at;
    }
  }

  const latestFailedInvoice = relevantInvoices
    .filter((invoice) => invoice.status === "failed")
    .sort((left, right) => compareInvoicePeriods(right, left))[0];
  const latestPaidInvoice = relevantInvoices
    .filter((invoice) => invoice.status === "paid")
    .sort((left, right) => compareInvoicePeriods(right, left))[0];

  let failureIsCausallyLatest = Boolean(latestFailedInvoice);

  if (latestFailedInvoice && localPeriodEnd !== null) {
    const failurePeriodEnd = parseTimestamp(
      getPagarmeInvoicePeriod(latestFailedInvoice)?.end_at
    );

    if (failurePeriodEnd !== null && failurePeriodEnd < localPeriodEnd) {
      failureIsCausallyLatest = false;
    }
  }

  if (latestFailedInvoice && latestPaidInvoice) {
    const comparison = compareFinancialCausality(latestFailedInvoice, latestPaidInvoice);

    if (comparison === null) {
      return {
        kind: "intervention_required",
        reason: `ambiguous_invoice_causality:${latestFailedInvoice.id}`,
      };
    }

    failureIsCausallyLatest = failureIsCausallyLatest && comparison > 0;
  }

  if (invoicesToApply.length > 0) {
    if (!remoteSubscription.next_billing_at) {
      return {
        kind: "intervention_required",
        reason: "remote_next_billing_at_missing",
      };
    }

    const subsequentFailure = failureIsCausallyLatest ? latestFailedInvoice : undefined;

    return { kind: "renew", invoices: invoicesToApply, subsequentFailure };
  }

  if (latestFailedInvoice && failureIsCausallyLatest) {
    const lastFailureInvoiceId =
      localSubscription.metadata?.last_payment_failure_invoice_id;

    if (
      localSubscription.status === "past_due" &&
      lastFailureInvoiceId === latestFailedInvoice.id
    ) {
      return { kind: "synchronized" };
    }

    return { kind: "payment_failure", invoice: latestFailedInvoice };
  }

  const remoteCycle = remoteSubscription.current_cycle;
  const localMatchesRemoteCycle =
    Boolean(remoteCycle?.start_at) &&
    Boolean(remoteCycle?.end_at) &&
    localSubscription.current_period_start === remoteCycle?.start_at &&
    localSubscription.current_period_end === remoteCycle?.end_at &&
    localSubscription.next_billing_at === remoteSubscription.next_billing_at &&
    localSubscription.status === "active";

  if (localMatchesRemoteCycle) {
    return { kind: "synchronized" };
  }

  return {
    kind: "intervention_required",
    reason: "no_reconcilable_remote_event",
  };
}
