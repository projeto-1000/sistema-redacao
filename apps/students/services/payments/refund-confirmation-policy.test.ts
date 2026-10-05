import assert from "node:assert/strict";
import test from "node:test";
import { isConfirmedRefundCharge } from "./refund-confirmation-policy.js";

const refunded = {
  status: "canceled", amount: 8990, canceled_amount: 8990,
  last_transaction: { status: "refunded", success: true, amount: 8990 },
};

test("accepts confirmed full refund with canceled charge status", () => {
  assert.equal(isConfirmedRefundCharge(refunded), true);
  assert.equal(isConfirmedRefundCharge({ status: "refunded" }), true);
});

test("rejects cancellation without successful full refund evidence", () => {
  assert.equal(isConfirmedRefundCharge({ status: "canceled" }), false);
  assert.equal(isConfirmedRefundCharge({ ...refunded, canceled_amount: 100 }), false);
  assert.equal(isConfirmedRefundCharge({ ...refunded, last_transaction: { ...refunded.last_transaction, success: false } }), false);
  assert.equal(isConfirmedRefundCharge({ ...refunded, last_transaction: { ...refunded.last_transaction, amount: 100 } }), false);
  assert.equal(isConfirmedRefundCharge({ ...refunded, last_transaction: { ...refunded.last_transaction, status: "canceled" } }), false);
});
