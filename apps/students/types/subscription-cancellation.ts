import { subscriptionCancellationReasons } from "@repo/constants";

export { subscriptionCancellationReasons };

export type SubscriptionCancellationReason =
  (typeof subscriptionCancellationReasons)[number]["value"];

export interface RequestSubscriptionCancellationInput {
  operationId: string;
  reason: SubscriptionCancellationReason | null;
  details?: string;
}

export type RequestSubscriptionCancellationResult =
  | {
      success: true;
      kind:
        | "ordinary"
        | "withdrawal_automatic"
        | "withdrawal_manual"
        | "withdrawal_operational_issue";
      effectiveAt: string | null;
      alreadyScheduled: boolean;
      withdrawalStatus?:
        | "under_review"
        | "refund_processing"
        | "refunded"
        | "operational_issue";
    }
  | {
      success: false;
      message: string;
    };
