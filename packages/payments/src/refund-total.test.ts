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
