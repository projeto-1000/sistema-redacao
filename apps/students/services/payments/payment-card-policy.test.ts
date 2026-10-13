import assert from "node:assert/strict";
import test from "node:test";
import {
  classifyPagarmeCardCreationError,
  EXTRA_CREDIT_CARD_REJECTED_MESSAGE,
  getExtraCreditPaymentCardLifecycleAction,
  isDefinitiveCardPaymentFailureStatus,
  isDefinitivePagarmeHttpFailure,
  isCheckoutPaymentCardConfirmed,
} from "./payment-card-policy.js";

test("classifies a 412 card verification failure as terminal before order creation", () => {
  assert.equal(
    classifyPagarmeCardCreationError({
      status: 412,
      errorData: {
        message: "Could not create credit card. The card verification failed.",
      },
    }),
    "failed"
  );
  assert.equal(
    EXTRA_CREDIT_CARD_REJECTED_MESSAGE,
    "Não foi possível realizar o pagamento com este cartão. Verifique os dados informados ou tente outro cartão."
  );
});

test("keeps ambiguous card creation errors processing", () => {
  assert.equal(classifyPagarmeCardCreationError({ status: null }), "processing");
  assert.equal(classifyPagarmeCardCreationError({ status: 408 }), "processing");
  assert.equal(classifyPagarmeCardCreationError({ status: 409 }), "processing");
  assert.equal(classifyPagarmeCardCreationError({ status: 429 }), "processing");
  assert.equal(classifyPagarmeCardCreationError({ status: 500 }), "processing");
});

test("only closes explicit card validation 400 and 422 responses", () => {
  assert.equal(
    classifyPagarmeCardCreationError({
      status: 400,
      errorData: { message: "Invalid card token" },
    }),
    "failed"
  );
  assert.equal(
    classifyPagarmeCardCreationError({
      status: 422,
      errorData: { message: "Card validation failed" },
    }),
    "failed"
  );
  assert.equal(
    classifyPagarmeCardCreationError({
      status: 400,
      errorData: { message: "Unexpected request state" },
    }),
    "processing"
  );
});

test("applies the new-card lifecycle without touching preexisting cards", () => {
  const scenarios = [
    { createdLocally: true, status: "paid", expected: "keep" },
    { createdLocally: true, status: "failed", expected: "deactivate" },
    { createdLocally: false, status: "failed", expected: "keep" },
    { createdLocally: true, status: "pending", expected: "keep" },
    { createdLocally: false, status: "pending", expected: "keep" },
  ] as const;

  for (const scenario of scenarios) {
    assert.equal(
      getExtraCreditPaymentCardLifecycleAction(scenario),
      scenario.expected,
      `${scenario.createdLocally ? "new" : "existing"} + ${scenario.status}`
    );
  }
});

test("distinguishes definitive Pagar.me HTTP failures from ambiguous responses", () => {
  assert.equal(isDefinitivePagarmeHttpFailure(400), true);
  assert.equal(isDefinitivePagarmeHttpFailure(422), true);
  assert.equal(isDefinitivePagarmeHttpFailure(408), false);
  assert.equal(isDefinitivePagarmeHttpFailure(409), false);
  assert.equal(isDefinitivePagarmeHttpFailure(429), false);
  assert.equal(isDefinitivePagarmeHttpFailure(500), false);
});

test("classifies terminal card statuses without treating pending as final", () => {
  for (const status of ["failed", "refused", "not_authorized", "canceled"]) {
    assert.equal(isDefinitiveCardPaymentFailureStatus(status), true, status);
  }

  assert.equal(isDefinitiveCardPaymentFailureStatus("pending"), false);
  assert.equal(isDefinitiveCardPaymentFailureStatus("processing"), false);
});

test("preserves the previous default while a new-card payment is pending or failed", () => {
  assert.equal(
    getExtraCreditPaymentCardLifecycleAction({ createdLocally: true, status: "paid" }),
    "keep"
  );
  assert.equal(
    getExtraCreditPaymentCardLifecycleAction({ createdLocally: true, status: "pending" }),
    "keep"
  );
});

test("keeps the previous default when an extra-credit payment converges from pending to paid", () => {
  assert.equal(
    getExtraCreditPaymentCardLifecycleAction({ createdLocally: true, status: "pending" }),
    "keep"
  );
  assert.equal(
    getExtraCreditPaymentCardLifecycleAction({ createdLocally: true, status: "paid" }),
    "keep"
  );
});

test("allows checkout promotion only after the remote subscription confirms the same card", () => {
  const confirmedCheckout = {
    expectedSubscriptionId: "sub_123",
    actualSubscriptionId: "sub_123",
    subscriptionStatus: "active",
    expectedCardId: "card_123",
    actualCardId: "card_123",
  };

  assert.equal(isCheckoutPaymentCardConfirmed(confirmedCheckout), true);
  assert.equal(
    isCheckoutPaymentCardConfirmed({
      ...confirmedCheckout,
      actualCardId: "card_other",
    }),
    false
  );
  assert.equal(
    isCheckoutPaymentCardConfirmed({
      ...confirmedCheckout,
      subscriptionStatus: "pending",
    }),
    false
  );
});
