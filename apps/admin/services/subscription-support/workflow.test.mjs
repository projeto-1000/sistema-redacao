import assert from "node:assert/strict";
import test from "node:test";
import { runSupportWorkflow } from "./workflow.ts";

const operation = {
  id: "op",
  status: "pending",
  action: "cancel_refund",
  amount: 2000,
  baseline_refunded: 1000,
};
function fixture(overrides = {}) {
  const calls = [];
  const dependencies = {
    claimDispatch: async () => {
      calls.push("claim");
      return true;
    },
    cancel: async () => {
      calls.push("cancel");
      return true;
    },
    readCanceled: async () => {
      calls.push("read-cancel");
      return true;
    },
    readRefundTotal: async () => {
      calls.push("read-refund");
      return 1000;
    },
    refund: async () => {
      calls.push("refund");
      return 3000;
    },
    advance: async (canceled, total, failure) => {
      calls.push({ canceled, total, failure });
      return operation;
    },
    ...overrides,
  };
  return { calls, dependencies };
}

test("refund-only never cancels subscription or reads its cancellation state", async () => {
  const { calls, dependencies } = fixture();
  await runSupportWorkflow({ ...operation, action: "refund_only" }, dependencies);
  assert.ok(calls.includes("refund"));
  assert.ok(!calls.includes("cancel") && !calls.includes("read-cancel"));
});
test("verification never sends a financial request", async () => {
  const { calls, dependencies } = fixture();
  await runSupportWorkflow(operation, dependencies, true);
  assert.ok(!calls.includes("claim") && !calls.includes("cancel") && !calls.includes("refund"));
});
test("duplicate dispatch falls back to verification", async () => {
  const { calls, dependencies } = fixture({ claimDispatch: async () => false });
  await runSupportWorkflow(operation, dependencies);
  assert.ok(!calls.includes("cancel") && !calls.includes("refund"));
});
test("already confirmed cumulative refund is not sent again", async () => {
  const { calls, dependencies } = fixture({ readRefundTotal: async () => 3000 });
  await runSupportWorkflow(operation, dependencies);
  assert.ok(!calls.includes("refund"));
});
test("cancel-only never refunds", async () => {
  const { calls, dependencies } = fixture();
  await runSupportWorkflow({ ...operation, action: "cancel_only", amount: 0 }, dependencies);
  assert.ok(
    calls.includes("cancel") && !calls.includes("refund") && !calls.includes("read-refund")
  );
});
test("failed or unconfirmed cancellation does not issue refund", async () => {
  const { calls, dependencies } = fixture({ cancel: async () => false });
  await assert.rejects(runSupportWorkflow(operation, dependencies));
  assert.ok(!calls.includes("refund"));
  assert.ok(calls.some((call) => call.failure === true));
});
test("unknown refund result stays pending, completed operation does nothing", async () => {
  const { calls, dependencies } = fixture({ refund: async () => null });
  await runSupportWorkflow(operation, dependencies);
  assert.equal(calls.at(-1).total, null);
  const completed = fixture();
  await runSupportWorkflow({ ...operation, status: "completed" }, completed.dependencies);
  assert.deepEqual(completed.calls, []);
});
