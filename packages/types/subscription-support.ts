export type SubscriptionSupportAction =
  | "cancel_only"
  | "cancel_refund"
  | "refund_courtesy"
  | "refund_only";

export interface SubscriptionSupportInput {
  operationId: string;
  studentId: string;
  paymentId: string;
  action: SubscriptionSupportAction;
  amount: number;
  reason: string;
  courtesyCredits?: number;
  courtesyUntil?: string;
}

export interface SubscriptionSupportPayment {
  id: string;
  amount: number;
  paid_at: string;
  credits_amount: number | null;
}

export interface SubscriptionSupportContext {
  studentId: string;
  name: string;
  email: string;
  planName: string;
  periodEnd: string;
  availableCredits: number;
  grantedCredits: number | null;
  usedCredits: number | null;
  payments: SubscriptionSupportPayment[];
  pendingOperation: {
    id: string;
    status: string;
    action: SubscriptionSupportAction;
  } | null;
}

export interface SubscriptionSupportOperation {
  id: string;
  student_id: string;
  payment_id: string;
  subscription_id: string;
  provider_subscription_id: string;
  provider_charge_id: string;
  baseline_refunded: number;
  action: SubscriptionSupportAction;
  amount: number;
  status: string;
}
