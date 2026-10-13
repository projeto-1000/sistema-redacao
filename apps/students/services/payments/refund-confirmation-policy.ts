export function isConfirmedRefundCharge(charge: {
  status?: string;
  amount?: number;
  canceled_amount?: number;
  last_transaction?: { status?: string; success?: boolean; amount?: number };
}): boolean {
  if (charge.status === "refunded") return true;

  return (
    charge.status === "canceled" &&
    Number.isInteger(charge.amount) &&
    (charge.amount ?? 0) > 0 &&
    charge.canceled_amount === charge.amount &&
    charge.last_transaction?.status === "refunded" &&
    charge.last_transaction.success === true &&
    charge.last_transaction.amount === charge.amount
  );
}
