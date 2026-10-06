import type { SubscriptionSupportOperation } from "@repo/types";

interface SupportWorkflowDependencies {
  claimDispatch: () => Promise<boolean>;
  cancel: () => Promise<boolean>;
  readCanceled: () => Promise<boolean>;
  readRefundTotal: () => Promise<number | null>;
  refund: () => Promise<number | null>;
  advance: (
    canceled: boolean,
    total: number | null,
    failure?: boolean
  ) => Promise<SubscriptionSupportOperation>;
}

// Pure orchestration; integrations live in the server-only service adapter.
export async function runSupportWorkflow(
  operation: SubscriptionSupportOperation,
  dependencies: SupportWorkflowDependencies,
  verifyOnly = false
) {
  if (operation.status === "completed") return operation;
  if (!verifyOnly && !(await dependencies.claimDispatch())) verifyOnly = true;
  let canceled = false;
  try {
    if (operation.action !== "refund_only") {
      canceled = verifyOnly ? await dependencies.readCanceled() : await dependencies.cancel();
      await dependencies.advance(canceled, null);
      if (!verifyOnly && !canceled)
        throw new Error("Cancelamento ainda não confirmado pelo provedor.");
    }
    if (operation.amount === 0) return dependencies.advance(canceled, null);
    let total = await dependencies.readRefundTotal();
    if (!verifyOnly && (total === null || total < operation.baseline_refunded + operation.amount)) {
      total = await dependencies.refund();
    }
    return dependencies.advance(canceled, total);
  } catch (error) {
    await dependencies.advance(canceled, null, true);
    throw error;
  }
}
