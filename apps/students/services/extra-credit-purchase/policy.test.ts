import assert from "node:assert/strict";
import test from "node:test";
import type { PagarmeOrder } from "@repo/payments";
import {
  buildExtraCreditPurchaseMetadata,
  buildExtraCreditPurchaseReferences,
  canTransitionExtraCreditPaymentStatus,
  evaluateExtraCreditOrder,
} from "./policy.js";

function buildOrder(overrides: Partial<PagarmeOrder> = {}): PagarmeOrder {
  return {
    id: "or_123456",
    code: "extra-credit-11111111222233334444555555555555",
    status: "paid",
    amount: 3990,
    metadata: {
      source: "extra_credit_purchase",
      user_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      extra_credit_package_id: "99999999-8888-7777-6666-555555555555",
      credits_amount: "4",
      local_payment_id: "11111111-2222-3333-4444-555555555555",
    },
    charges: [
      {
        id: "ch_123456",
        status: "paid",
        amount: 3990,
        paid_amount: 3990,
        payment_method: "credit_card",
        paid_at: "2026-09-02T12:00:00.000Z",
      },
    ],
    ...overrides,
  };
}

const expectedCode = "extra-credit-11111111222233334444555555555555";
const expectedMetadata = buildOrder().metadata as Record<string, string>;

test("maps a coherent paid order to paid", () => {
  assert.deepEqual(
    evaluateExtraCreditOrder({
      order: buildOrder(),
      expectedAmount: 3990,
      expectedCode,
      expectedMetadata,
    }),
    {
      localStatus: "paid",
      providerStatus: "paid",
      chargeId: "ch_123456",
      paidAt: "2026-09-02T12:00:00.000Z",
    }
  );
});

test("maps a processing charge to pending", () => {
  const order = buildOrder({
    status: "pending",
    charges: [
      {
        id: "ch_123456",
        status: "processing",
        amount: 3990,
        payment_method: "credit_card",
      },
    ],
  });

  assert.equal(
    evaluateExtraCreditOrder({
      order,
      expectedAmount: 3990,
      expectedCode,
      expectedMetadata,
    }).localStatus,
    "pending"
  );
});

test("maps a refused charge to failed", () => {
  const order = buildOrder({
    status: "failed",
    charges: [
      {
        id: "ch_123456",
        status: "refused",
        amount: 3990,
        payment_method: "credit_card",
      },
    ],
  });

  assert.equal(
    evaluateExtraCreditOrder({
      order,
      expectedAmount: 3990,
      expectedCode,
      expectedMetadata,
    }).localStatus,
    "failed"
  );
});

test("rejects a paid order with a different amount", () => {
  assert.throws(
    () =>
      evaluateExtraCreditOrder({
        order: buildOrder({ amount: 4990 }),
        expectedAmount: 3990,
        expectedCode,
        expectedMetadata,
      }),
    /valor do pedido/
  );
});

test("rejects divergent paid states between order and charge", () => {
  const order = buildOrder({
    status: "paid",
    charges: [
      {
        id: "ch_123456",
        status: "pending",
        amount: 3990,
        payment_method: "credit_card",
      },
    ],
  });

  assert.throws(
    () =>
      evaluateExtraCreditOrder({
        order,
        expectedAmount: 3990,
        expectedCode,
        expectedMetadata,
      }),
    /estados financeiros divergentes/
  );
});

test("rejects an order whose metadata belongs to another operation", () => {
  const order = buildOrder({
    metadata: {
      ...expectedMetadata,
      local_payment_id: "00000000-0000-0000-0000-000000000000",
    },
  });

  assert.throws(
    () =>
      evaluateExtraCreditOrder({
        order,
        expectedAmount: 3990,
        expectedCode,
        expectedMetadata,
      }),
    /metadados do pedido/
  );
});

test("builds stable operation references and safe metadata", () => {
  const operationId = "11111111-2222-3333-4444-555555555555";

  assert.deepEqual(buildExtraCreditPurchaseReferences(operationId), {
    orderCode: expectedCode,
    idempotencyKey: `extra-credit-purchase:${operationId}`,
    cardIdempotencyKey: `extra-credit-card:${operationId}`,
  });

  assert.deepEqual(
    buildExtraCreditPurchaseMetadata({
      userId: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      packageId: "99999999-8888-7777-6666-555555555555",
      creditsAmount: 4,
      paymentId: operationId,
    }),
    {
      source: "extra_credit_purchase",
      user_id: "aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee",
      extra_credit_package_id: "99999999-8888-7777-6666-555555555555",
      credits_amount: "4",
      local_payment_id: operationId,
    }
  );
});

test("allows only monotonic transitions once an extra-credit payment is paid", () => {
  const scenarios = [
    { currentStatus: "processing", nextStatus: "paid", allowed: true },
    { currentStatus: "processing", nextStatus: "pending", allowed: true },
    { currentStatus: "pending", nextStatus: "paid", allowed: true },
    { currentStatus: "paid", nextStatus: "paid", allowed: true },
    { currentStatus: "paid", nextStatus: "pending", allowed: false },
    { currentStatus: "paid", nextStatus: "failed", allowed: false },
  ] as const;

  for (const scenario of scenarios) {
    assert.equal(
      canTransitionExtraCreditPaymentStatus({
        currentStatus: scenario.currentStatus,
        nextStatus: scenario.nextStatus,
      }),
      scenario.allowed,
      `${scenario.currentStatus} -> ${scenario.nextStatus}`
    );
  }
});

test("rejects a stale non-paid decision after a concurrent writer committed paid", () => {
  const staleDecision = "pending" as const;

  assert.equal(
    canTransitionExtraCreditPaymentStatus({
      currentStatus: "processing",
      nextStatus: staleDecision,
    }),
    true
  );

  assert.equal(
    canTransitionExtraCreditPaymentStatus({
      currentStatus: "paid",
      nextStatus: staleDecision,
    }),
    false
  );
});
