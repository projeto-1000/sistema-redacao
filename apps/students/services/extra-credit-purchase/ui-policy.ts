import type { ExtraCreditPurchaseResult } from "@repo/types";
import { shouldRotateExtraCreditOperationId } from "./policy";
import { EXTRA_CREDIT_CARD_REJECTED_MESSAGE } from "../payments/payment-card-policy";

export type ExtraCreditPaymentSource = "saved_card" | "new_card";
type ExtraCreditPurchaseFailure = Extract<ExtraCreditPurchaseResult, { success: false }>;

export function getExtraCreditPaymentView(paymentSource: ExtraCreditPaymentSource) {
  return paymentSource === "new_card" ? "new_card_form" : "saved_cards";
}

export function getExtraCreditFailureUi({
  paymentSource,
  result,
}: {
  paymentSource: ExtraCreditPaymentSource;
  result: ExtraCreditPurchaseFailure;
}) {
  const rotateOperationId = shouldRotateExtraCreditOperationId(result);
  const isNewCardFailure =
    paymentSource === "new_card" && result.message === EXTRA_CREDIT_CARD_REJECTED_MESSAGE;

  return {
    errorPlacement: isNewCardFailure ? ("payment" as const) : ("global" as const),
    rotateOperationId,
    clearCvv: paymentSource === "new_card" && rotateOperationId,
  };
}
