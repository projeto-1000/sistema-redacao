import assert from "node:assert/strict";
import test from "node:test";
import { getConfirmedRefundTotal } from "./refund-total.js";

test("confirms partial cumulative refunds without assuming subscription cancellation", () => {
  assert.equal(
    getConfirmedRefundTotal({
      status: "paid",
      amount: 8990,
      refunded_amount: 2000,
    }),
    2000,
  );
  assert.equal(
    getConfirmedRefundTotal({
      status: "paid",
      amount: 8990,
      canceled_amount: 2000,
      last_transaction: { status: "refunded", success: true, amount: 2000 },
    }),
    2000,
  );
});

test("does not mistake cancellation or pending refund for money returned", () => {
  assert.equal(
    getConfirmedRefundTotal({ status: "canceled", amount: 8990 }),
    null,
  );
  assert.equal(
    getConfirmedRefundTotal({
      status: "canceled",
      amount: 8990,
      canceled_amount: 8990,
      last_transaction: { status: "canceled", success: true },
    }),
    null,
  );
  assert.equal(
    getConfirmedRefundTotal({
      status: "paid",
      amount: 8990,
      refunded_amount: -1,
    }),
    null,
  );
  assert.equal(
    getConfirmedRefundTotal({
      status: "paid",
      amount: 8990,
      refunded_amount: 9000,
    }),
    null,
  );
});

test("confirms successful partial_refunded transactions using the cumulative canceled amount", () => {
  assert.equal(
    getConfirmedRefundTotal({
      status: "paid",
      amount: 3990,
      canceled_amount: 500,
      last_transaction: { status: "partial_refunded", success: true, amount: 500 },
    }),
    500,
  );
  // The last transaction may represent only the latest of several refunds.
  assert.equal(
    getConfirmedRefundTotal({
      status: "paid",
      amount: 3990,
      canceled_amount: 1000,
      last_transaction: { status: "partial_refunded", success: true, amount: 500 },
    }),
    1000,
  );
});

test("partial refunds require success and a valid cumulative provider amount", () => {
  for (const canceled_amount of [undefined, -1, 4000, 500.5]) {
    assert.equal(
      getConfirmedRefundTotal({
        status: "paid", amount: 3990, canceled_amount,
        last_transaction: { status: "partial_refunded", success: true, amount: 500 },
      }),
      null,
    );
  }
  for (const status of ["partial_refunded", "pending_refund"]) {
    assert.equal(
      getConfirmedRefundTotal({
        status: "paid", amount: 3990, canceled_amount: 500,
        last_transaction: { status, success: false, amount: 500 },
      }),
      null,
    );
  }
});

test("accepts full refund evidence and zero confirmed refunded amount", () => {
  assert.equal(
    getConfirmedRefundTotal({ status: "refunded", amount: 8990 }),
    8990,
  );
  assert.equal(
    getConfirmedRefundTotal({
      status: "paid",
      amount: 8990,
      refunded_amount: 0,
    }),
    0,
  );
  assert.equal(
    getConfirmedRefundTotal({
      status: "canceled",
      amount: 8990,
      canceled_amount: 8990,
      last_transaction: { status: "refunded", success: true, amount: 8990 },
    }),
    8990,
  );
});
