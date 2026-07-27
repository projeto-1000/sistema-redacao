import type {
  SubscriptionHistoryEvent,
  SubscriptionHistoryRpcRow,
} from "@repo/types";

export function mapSubscriptionHistoryRpcRow(
  row: SubscriptionHistoryRpcRow
): SubscriptionHistoryEvent | null {
  if (row.kind === "credit_transaction") {
    if (!row.transaction_type || row.credit_amount === null) {
      return null;
    }

    return {
      kind: "credit_transaction",

      id: row.id,
      user_id: row.user_id,
      created_at: row.created_at,

      transaction_type: row.transaction_type,
      amount: row.credit_amount,
      description: row.description,

      student_payment_id: row.student_payment_id,

      metadata: row.metadata,
    };
  }

  if (row.kind === "payment") {
    if (row.amount_in_cents === null || !row.payment_status) {
      return null;
    }

    return {
      kind: "payment",

      id: row.id,
      user_id: row.user_id,

      created_at: row.created_at,
      paid_at: row.paid_at,

      amount_in_cents: row.amount_in_cents,
      credits_amount: row.credits_amount,

      status: row.payment_status,
      payment_method: row.payment_method,

      plan_id: row.plan_id,
      plan_name: row.plan_name,

      subscription_id: row.subscription_id,

      metadata: row.metadata,
    };
  }

  return null;
}