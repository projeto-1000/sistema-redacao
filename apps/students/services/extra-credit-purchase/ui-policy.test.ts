import assert from "node:assert/strict";
import test from "node:test";
import { EXTRA_CREDIT_CARD_REJECTED_MESSAGE } from "../payments/payment-card-policy.js";
import { getExtraCreditFailureUi, getExtraCreditPaymentView } from "./ui-policy.js";

const paymentId = "11111111-2222-3333-4444-555555555555";

test("shows only the new-card form after selecting a new card", () => {
  assert.equal(getExtraCreditPaymentView("new_card"), "new_card_form");
  assert.equal(getExtraCreditPaymentView("saved_card"), "saved_cards");
});

test("keeps a declined new-card error in the payment section and clears only CVV", () => {
  assert.deepEqual(
    getExtraCreditFailureUi({
      paymentSource: "new_card",
      result: {
        success: false,
        paymentId,
        status: "failed",
        creditsAmount: 4,
        message: EXTRA_CREDIT_CARD_REJECTED_MESSAGE,
      },
    }),
    {
      errorPlacement: "payment",
      rotateOperationId: true,
      clearCvv: true,
    }
  );
});

test("preserves operation and CVV for an ambiguous response", () => {
  assert.deepEqual(
    getExtraCreditFailureUi({
      paymentSource: "new_card",
      result: {
        success: false,
        paymentId,
        status: "processing",
        creditsAmount: 4,
        message: "A operação está sendo verificada.",
      },
    }),
    {
      errorPlacement: "global",
      rotateOperationId: false,
      clearCvv: false,
    }
  );
});

test("keeps saved-card failures in the existing global error area", () => {
  assert.deepEqual(
    getExtraCreditFailureUi({
      paymentSource: "saved_card",
      result: {
        success: false,
        paymentId,
        status: "failed",
        creditsAmount: 4,
        message: EXTRA_CREDIT_CARD_REJECTED_MESSAGE,
      },
    }),
    {
      errorPlacement: "global",
      rotateOperationId: true,
      clearCvv: false,
    }
  );
});
