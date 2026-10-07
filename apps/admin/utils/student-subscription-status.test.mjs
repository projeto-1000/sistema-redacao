import assert from "node:assert/strict";
import test from "node:test";
import { isStudentCancellationScheduled } from "./student-subscription-status.ts";

test("recognizes scheduled cancellation while preserving active access", () => {
  assert.equal(isStudentCancellationScheduled({ status: "active", cancel_at_period_end: true, cancellation_mode: "end_of_period" }), true);
});

test("does not label completed cancellation or refund as scheduled", () => {
  assert.equal(isStudentCancellationScheduled({ status: "canceled", cancel_at_period_end: true, cancellation_mode: "end_of_period" }), false);
  assert.equal(isStudentCancellationScheduled({ status: "active", cancel_at_period_end: true, cancellation_mode: "withdrawal" }), false);
});

test("normal active and missing subscriptions are not scheduled", () => {
  assert.equal(isStudentCancellationScheduled({ status: "active", cancel_at_period_end: false, cancellation_mode: null }), false);
  assert.equal(isStudentCancellationScheduled(null), false);
});
