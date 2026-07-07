import { CheckoutPageData, CheckoutPlanFeature } from "@/types";
import { type PagarmeBillingAddress, type PagarmePaymentMethod } from "@repo/payments";
import { onlyDigits } from "@repo/utils";

export interface CheckoutBillingAddressInput {
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export function normalizePlanFeatures(features: unknown): CheckoutPlanFeature[] {
  if (!Array.isArray(features)) {
    return [];
  }

  return features
    .map((feature) => {
      if (typeof feature === "string") {
        return {
          text: feature,
          included: true,
        };
      }

      if (typeof feature === "object" && feature !== null && "text" in feature) {
        return {
          text: String(feature.text),
          included: "included" in feature ? Boolean(feature.included) : true,
        };
      }

      return null;
    })
    .filter((feature): feature is CheckoutPlanFeature => Boolean(feature));
}

export function normalizePaymentMethods(
  paymentMethods: unknown
): CheckoutPageData["plan"]["paymentMethods"] {
  const allowedPaymentMethods = ["credit_card", "debit_card", "boleto"] as const;

  if (!Array.isArray(paymentMethods)) {
    return [];
  }

  return paymentMethods.filter(
    (paymentMethod): paymentMethod is CheckoutPageData["plan"]["paymentMethods"][number] =>
      allowedPaymentMethods.includes(paymentMethod as (typeof allowedPaymentMethods)[number])
  );
}

export function isValidPaymentMethod(
  paymentMethod: unknown
): paymentMethod is PagarmePaymentMethod {
  return (
    paymentMethod === "credit_card" || paymentMethod === "debit_card" || paymentMethod === "boleto"
  );
}

export function buildPagarmeBillingAddress(
  address: CheckoutBillingAddressInput
): PagarmeBillingAddress {
  const zipCode = onlyDigits(address.zipCode);
  const state = address.state.trim().toUpperCase();

  if (zipCode.length !== 8) {
    throw new Error("CEP de cobrança inválido.");
  }

  if (state.length !== 2) {
    throw new Error("Estado de cobrança inválido.");
  }

  const line1 = [address.number.trim(), address.street.trim(), address.neighborhood.trim()]
    .filter(Boolean)
    .join(", ");

  if (!line1) {
    throw new Error("Endereço de cobrança inválido.");
  }

  return {
    line_1: line1.slice(0, 256),
    line_2: address.complement?.trim() ? address.complement.trim().slice(0, 128) : undefined,
    zip_code: zipCode,
    city: address.city.trim().slice(0, 64),
    state,
    country: "BR",
  };
}

export function buildSubscriptionCode(userId: string) {
  const compactUserId = userId.replace(/-/g, "").slice(0, 24);
  const timestamp = Date.now().toString(36);

  return `sub_${compactUserId}_${timestamp}`;
}

export function mapPagarmeSubscriptionStatus(
  status: string | null | undefined
): "active" | "past_due" | "canceled" | "unpaid" | "trial" {
  if (status === "active") {
    return "active";
  }

  if (status === "past_due") {
    return "past_due";
  }

  if (status === "canceled") {
    return "canceled";
  }

  if (status === "trial") {
    return "trial";
  }

  return "unpaid";
}
