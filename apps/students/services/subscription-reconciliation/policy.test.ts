import assert from "node:assert/strict";
import test from "node:test";
import type { PagarmeInvoice, PagarmeSubscription } from "@repo/payments";
import {
  areSubscriptionPeriodsContinuous,
  decideSubscriptionReconciliation,
  type LocalSubscriptionReconciliationState,
} from "./policy.js";
import {
  buildReconciliationAttemptMetadata,
  selectDueReconciliationCandidates,
  shouldReopenProcessedReconciliationEvent,
} from "./queue.js";

const localSubscription: LocalSubscriptionReconciliationState = {
  id: "local-subscription-id",
  external_id: "sub_reconciliation_test",
  status: "active",
  current_period_start: "2026-01-01T00:00:00Z",
  current_period_end: "2026-02-01T00:00:00Z",
  next_billing_at: "2026-02-01T00:00:00Z",
  metadata: {},
  updated_at: "2026-02-01T00:00:00Z",
};

const remoteSubscription: PagarmeSubscription = {
  id: "sub_reconciliation_test",
  payment_method: "credit_card",
  status: "active",
  current_cycle: {
    start_at: "2026-02-01T00:00:00Z",
    end_at: "2026-03-01T00:00:00Z",
  },
  next_billing_at: "2026-04-01T00:00:00Z",
};

function buildInvoice(
  overrides: Partial<PagarmeInvoice> = {}
): PagarmeInvoice {
  return {
    id: "in_reconciliation_test",
    amount: 10000,
    status: "paid",
    payment_method: "credit_card",
    created_at: "2026-02-01T00:00:00Z",
    updated_at: "2026-02-01T00:00:00Z",
    period: {
      start_at: "2026-02-01T00:00:00Z",
      end_at: "2026-03-01T00:00:00Z",
    },
    charge: { recurrence_cycle: "subsequent" },
    subscription: { id: "sub_reconciliation_test" },
    ...overrides,
  };
}

test("selects a paid invoice when an expired local subscription missed its webhook", () => {
  const decision = decideSubscriptionReconciliation({
    localSubscription,
    remoteSubscription,
    invoices: [buildInvoice()],
  });

  assert.equal(decision.kind, "renew");

  if (decision.kind === "renew") {
    assert.deepEqual(decision.invoices.map((invoice) => invoice.id), [
      "in_reconciliation_test",
    ]);
  }
});

test("uses the payment-failure flow when the latest relevant invoice failed", () => {
  const failedInvoice = buildInvoice({
    id: "in_failed_reconciliation_test",
    status: "failed",
  });
  const decision = decideSubscriptionReconciliation({
    localSubscription,
    remoteSubscription,
    invoices: [failedInvoice],
  });

  assert.equal(decision.kind, "payment_failure");

  if (decision.kind === "payment_failure") {
    assert.equal(decision.invoice.id, failedInvoice.id);
  }
});

test("reapplies a recovered paid invoice when the local subscription is past due", () => {
  const recoveredInvoice = buildInvoice({
    period: {
      start_at: localSubscription.current_period_start ?? undefined,
      end_at: localSubscription.current_period_end ?? undefined,
    },
  });
  const decision = decideSubscriptionReconciliation({
    localSubscription: { ...localSubscription, status: "past_due" },
    remoteSubscription,
    invoices: [recoveredInvoice],
  });

  assert.equal(decision.kind, "renew");
});

test("uses the cancellation flow when Pagar.me reports a canceled subscription", () => {
  const decision = decideSubscriptionReconciliation({
    localSubscription,
    remoteSubscription: { ...remoteSubscription, status: "canceled" },
    invoices: [],
  });

  assert.equal(decision.kind, "cancel");
});

test("recognizes a subscription that already matches the remote cycle", () => {
  const decision = decideSubscriptionReconciliation({
    localSubscription: {
      ...localSubscription,
      current_period_start: remoteSubscription.current_cycle?.start_at ?? null,
      current_period_end: remoteSubscription.current_cycle?.end_at ?? null,
      next_billing_at: remoteSubscription.next_billing_at ?? null,
    },
    remoteSubscription,
    invoices: [],
  });

  assert.equal(decision.kind, "synchronized");
});

test("does not silently reconcile an invalid paid invoice", () => {
  const decision = decideSubscriptionReconciliation({
    localSubscription,
    remoteSubscription,
    invoices: [
      buildInvoice({
        period: {
          start_at: "2026-03-01T00:00:00Z",
          end_at: "2026-02-01T00:00:00Z",
        },
      }),
    ],
  });

  assert.equal(decision.kind, "intervention_required");
});

test("orders and deduplicates two overdue paid invoices", () => {
  const first = buildInvoice({ id: "in_first" });
  const second = buildInvoice({
    id: "in_second",
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    period: {
      start_at: "2026-03-01T00:00:00Z",
      end_at: "2026-04-01T00:00:00Z",
    },
  });
  const decision = decideSubscriptionReconciliation({
    localSubscription,
    remoteSubscription,
    invoices: [second, first, { ...first }],
  });

  assert.equal(decision.kind, "renew");

  if (decision.kind === "renew") {
    assert.deepEqual(decision.invoices.map((invoice) => invoice.id), [
      "in_first",
      "in_second",
    ]);
  }
});

test("orders three randomly returned overdue cycles", () => {
  const february = buildInvoice({ id: "in_february" });
  const march = buildInvoice({
    id: "in_march",
    period: {
      start_at: "2026-03-01T00:00:00Z",
      end_at: "2026-04-01T00:00:00Z",
    },
  });
  const april = buildInvoice({
    id: "in_april",
    period: {
      start_at: "2026-04-01T00:00:00Z",
      end_at: "2026-05-01T00:00:00Z",
    },
  });
  const decision = decideSubscriptionReconciliation({
    localSubscription,
    remoteSubscription,
    invoices: [april, february, march],
  });

  assert.equal(decision.kind, "renew");

  if (decision.kind === "renew") {
    assert.deepEqual(decision.invoices.map((invoice) => invoice.id), [
      "in_february",
      "in_march",
      "in_april",
    ]);
  }
});

test("requires intervention when an intermediate cycle is missing", () => {
  const decision = decideSubscriptionReconciliation({
    localSubscription,
    remoteSubscription,
    invoices: [
      buildInvoice({
        id: "in_after_gap",
        period: {
          start_at: "2026-03-01T00:00:00Z",
          end_at: "2026-04-01T00:00:00Z",
        },
      }),
    ],
  });

  assert.deepEqual(decision, {
    kind: "intervention_required",
    reason: "invoice_period_gap:in_after_gap",
  });
});

test("does not advance when invoice pagination is truncated", () => {
  const decision = decideSubscriptionReconciliation({
    localSubscription,
    remoteSubscription,
    invoices: [buildInvoice()],
    historyComplete: false,
  });

  assert.deepEqual(decision, {
    kind: "intervention_required",
    reason: "invoice_history_truncated",
  });
});

test("does not apply an old failure after a later paid invoice already applied", () => {
  const oldFailure = buildInvoice({
    id: "in_old_failure",
    status: "failed",
    created_at: "2026-01-15T00:00:00Z",
    updated_at: "2026-01-15T00:00:00Z",
    period: {
      start_at: "2026-01-01T00:00:00Z",
      end_at: "2026-02-01T00:00:00Z",
    },
  });
  const laterPaid = buildInvoice({ id: "in_later_paid" });
  const decision = decideSubscriptionReconciliation({
    localSubscription: {
      ...localSubscription,
      current_period_start: "2026-02-01T00:00:00Z",
      current_period_end: "2026-03-01T00:00:00Z",
      next_billing_at: remoteSubscription.next_billing_at ?? null,
      metadata: { last_pagarme_invoice_id: laterPaid.id },
    },
    remoteSubscription,
    invoices: [oldFailure, laterPaid],
  });

  assert.equal(decision.kind, "synchronized");
});

test("applies a pending paid invoice without replaying an older failure", () => {
  const oldFailure = buildInvoice({
    id: "in_old_failure",
    status: "failed",
    created_at: "2026-01-15T00:00:00Z",
    updated_at: "2026-01-15T00:00:00Z",
    period: {
      start_at: "2026-01-01T00:00:00Z",
      end_at: "2026-02-01T00:00:00Z",
    },
  });
  const laterPaid = buildInvoice({ id: "in_pending_paid" });
  const decision = decideSubscriptionReconciliation({
    localSubscription,
    remoteSubscription,
    invoices: [laterPaid, oldFailure],
  });

  assert.equal(decision.kind, "renew");

  if (decision.kind === "renew") {
    assert.deepEqual(decision.invoices.map((invoice) => invoice.id), [laterPaid.id]);
    assert.equal(decision.subsequentFailure, undefined);
  }
});

test("applies a failure from the cycle after the latest paid cycle", () => {
  const paid = buildInvoice({ id: "in_paid_previous_cycle" });
  const failure = buildInvoice({
    id: "in_failure_next_cycle",
    status: "failed",
    created_at: "2026-03-01T00:00:00Z",
    updated_at: "2026-03-01T00:00:00Z",
    period: {
      start_at: "2026-03-01T00:00:00Z",
      end_at: "2026-04-01T00:00:00Z",
    },
  });
  const decision = decideSubscriptionReconciliation({
    localSubscription: {
      ...localSubscription,
      current_period_start: "2026-02-01T00:00:00Z",
      current_period_end: "2026-03-01T00:00:00Z",
      metadata: { last_pagarme_invoice_id: paid.id },
    },
    remoteSubscription,
    invoices: [failure, paid],
  });

  assert.equal(decision.kind, "payment_failure");

  if (decision.kind === "payment_failure") {
    assert.equal(decision.invoice.id, failure.id);
  }
});

test("applies a lone failure when there is no later paid evidence", () => {
  const failure = buildInvoice({ id: "in_lone_failure", status: "failed" });
  const decision = decideSubscriptionReconciliation({
    localSubscription,
    remoteSubscription,
    invoices: [failure],
  });

  assert.equal(decision.kind, "payment_failure");
});

test("does not regress a later local period when only an older failure is returned", () => {
  const decision = decideSubscriptionReconciliation({
    localSubscription: {
      ...localSubscription,
      current_period_start: "2026-02-01T00:00:00Z",
      current_period_end: "2026-03-01T00:00:00Z",
      next_billing_at: remoteSubscription.next_billing_at ?? null,
    },
    remoteSubscription,
    invoices: [
      buildInvoice({
        id: "in_old_failure_only",
        status: "failed",
        period: {
          start_at: "2026-01-01T00:00:00Z",
          end_at: "2026-02-01T00:00:00Z",
        },
      }),
    ],
  });

  assert.equal(decision.kind, "synchronized");
});

test("keeps a processed synthetic event terminal unless its state is proven incomplete", () => {
  assert.equal(
    shouldReopenProcessedReconciliationEvent({
      status: "processed",
      stateNeedsApplication: false,
    }),
    false
  );
  assert.equal(
    shouldReopenProcessedReconciliationEvent({
      status: "processed",
      stateNeedsApplication: true,
    }),
    true
  );
});

test("skips candidates in backoff even when more than 25 precede due candidates", () => {
  const now = new Date("2026-06-01T00:00:00Z");
  const candidates = Array.from({ length: 35 }, (_, index) => ({
    ...localSubscription,
    id: `candidate-${index}`,
    metadata:
      index < 25
        ? { reconciliation_retry_after: "2026-06-02T00:00:00Z" }
        : {},
  }));

  assert.deepEqual(
    selectDueReconciliationCandidates(candidates, now, 25).map(
      (candidate) => candidate.id
    ),
    Array.from({ length: 10 }, (_, index) => `candidate-${index + 25}`)
  );
});

test("a problematic candidate in backoff does not block a later candidate", () => {
  const selected = selectDueReconciliationCandidates(
    [
      {
        ...localSubscription,
        id: "problematic",
        metadata: { reconciliation_retry_after: "2026-06-02T00:00:00Z" },
      },
      { ...localSubscription, id: "healthy" },
    ],
    new Date("2026-06-01T00:00:00Z"),
    1
  );

  assert.deepEqual(selected.map((candidate) => candidate.id), ["healthy"]);
});

test("records attempts with deterministic backoff beyond the next hourly run", () => {
  const firstAttempt = buildReconciliationAttemptMetadata(
    {},
    new Date("2026-06-01T00:00:00Z")
  );
  const secondAttempt = buildReconciliationAttemptMetadata(
    firstAttempt,
    new Date("2026-06-01T02:00:00Z")
  );

  assert.equal(firstAttempt.reconciliation_attempt_count, 1);
  assert.equal(firstAttempt.reconciliation_retry_after, "2026-06-01T02:00:00.000Z");
  assert.equal(secondAttempt.reconciliation_attempt_count, 2);
  assert.equal(secondAttempt.reconciliation_retry_after, "2026-06-01T08:00:00.000Z");
});

test("accepts exact or one-second cycle boundaries and rejects larger gaps", () => {
  assert.equal(
    areSubscriptionPeriodsContinuous(
      "2026-02-01T00:00:00Z",
      "2026-02-01T00:00:00Z"
    ),
    true
  );
  assert.equal(
    areSubscriptionPeriodsContinuous(
      "2026-01-31T23:59:59Z",
      "2026-02-01T00:00:00Z"
    ),
    true
  );
  assert.equal(
    areSubscriptionPeriodsContinuous(
      "2026-01-31T23:59:59Z",
      "2026-02-01T00:00:01Z"
    ),
    false
  );
});
