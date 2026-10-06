// A cancellation alone is not proof of a refund. Partial refunds need a
// cumulative provider amount; a transaction ID is not an amount confirmation.
export function getConfirmedRefundTotal(charge: {
  amount: number;
  refunded_amount?: number;
  canceled_amount?: number;
  status: string;
  last_transaction?: { status?: string; success?: boolean; amount?: number };
}): number | null {
  if (!Number.isInteger(charge.amount) || charge.amount <= 0) return null;
  if (
    Number.isInteger(charge.refunded_amount) &&
    (charge.refunded_amount ?? -1) >= 0 &&
    charge.refunded_amount! <= charge.amount
  ) {
    return charge.refunded_amount!;
  }
  if (charge.status === "refunded") return charge.amount;
  if (
    Number.isInteger(charge.canceled_amount) &&
    (charge.canceled_amount ?? -1) >= 0 &&
    charge.canceled_amount! <= charge.amount &&
    charge.last_transaction?.status === "refunded" &&
    charge.last_transaction.success === true
  )
    return charge.canceled_amount!;
  if (
    charge.status === "canceled" &&
    charge.canceled_amount === charge.amount &&
    charge.last_transaction?.status === "refunded" &&
    charge.last_transaction.success === true &&
    charge.last_transaction.amount === charge.amount
  )
    return charge.amount;
  return null;
}
