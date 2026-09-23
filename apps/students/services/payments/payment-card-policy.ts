export type ExtraCreditPaymentCardLifecycleAction = "keep" | "deactivate";

export const EXTRA_CREDIT_CARD_REJECTED_MESSAGE =
  "Não foi possível realizar o pagamento com este cartão. Verifique os dados informados ou tente outro cartão.";

export type PagarmeCardCreationErrorDisposition = "failed" | "processing";

const DEFINITIVE_CARD_FAILURE_STATUSES = new Set([
  "failed",
  "canceled",
  "cancelled",
  "not_authorized",
  "refused",
  "past_due",
  "unpaid",
]);

export function isDefinitiveCardPaymentFailureStatus(status: string | null | undefined) {
  return Boolean(status && DEFINITIVE_CARD_FAILURE_STATUSES.has(status.toLowerCase()));
}

export function isDefinitivePagarmeHttpFailure(status: number) {
  return status >= 400 && status < 500 && ![408, 409, 425, 429].includes(status);
}

export function classifyPagarmeCardCreationError({
  status,
  errorData,
}: {
  status: number | null;
  errorData?: unknown;
}): PagarmeCardCreationErrorDisposition {
  if (status === null) {
    return "processing";
  }

  if ([401, 403, 404, 412].includes(status)) {
    return "failed";
  }

  if (status !== 400 && status !== 422) {
    return "processing";
  }

  const serializedError = JSON.stringify(errorData ?? "").toLowerCase();
  const hasDefinitiveValidationSignal = [
    "card",
    "token",
    "verification",
    "validation",
    "invalid",
    "billing",
  ].some((signal) => serializedError.includes(signal));

  return hasDefinitiveValidationSignal ? "failed" : "processing";
}

export function getExtraCreditPaymentCardLifecycleAction({
  createdLocally,
  status,
}: {
  createdLocally: boolean;
  status: "paid" | "pending" | "failed";
}): ExtraCreditPaymentCardLifecycleAction {
  if (status === "failed" && createdLocally) {
    return "deactivate";
  }

  return "keep";
}

export function isCheckoutPaymentCardConfirmed({
  expectedSubscriptionId,
  actualSubscriptionId,
  subscriptionStatus,
  expectedCardId,
  actualCardId,
}: {
  expectedSubscriptionId: string;
  actualSubscriptionId: string;
  subscriptionStatus: string;
  expectedCardId: string;
  actualCardId: string | null | undefined;
}) {
  return (
    actualSubscriptionId === expectedSubscriptionId &&
    subscriptionStatus === "active" &&
    actualCardId === expectedCardId
  );
}
