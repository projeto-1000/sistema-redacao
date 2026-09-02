import type { createAdminClient } from "@/lib/admin";
import type { PagarmePaymentMethod } from "@repo/payments";

export type CheckoutSubscriptionStatus = "active" | "past_due" | "canceled" | "unpaid" | "trial";

export interface CheckoutPlanFeature {
  text: string;
  included: boolean;
}

export interface CheckoutPlanData {
  id: string;
  name: string;
  price: number;
  interval: string;
  intervalCount: number | null;
  creditsIncluded: number;
  creditsExpirationDays: number;
  features: CheckoutPlanFeature[];
  paymentMethods: PagarmePaymentMethod[];
}

export interface CheckoutStudentData {
  id: string;
  name: string | null;
  email: string;
  document: string | null;
  phone: string | null;
}

export interface CheckoutPageData {
  plan: CheckoutPlanData;
  student: CheckoutStudentData;
}

export interface CheckoutBillingAddressInput {
  zipCode: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
}

export interface CheckoutProfileForPagarme {
  id: string;
  email: string;
  full_name: string | null;
  document: string | null;
  phone_country_code: string | null;
  phone: string | null;
  pagarme_customer_id: string | null;
}

export interface CreateCheckoutSubscriptionInput {
  planId: string;
  paymentMethod: PagarmePaymentMethod;
  billingAddress: CheckoutBillingAddressInput;
  cardToken?: string;
}

export interface CreateCheckoutSubscriptionResult {
  success: true;
  subscriptionId: string;
  localSubscriptionId: string;
  paymentId: string;
  savedCardId: string | null;
  status: CheckoutSubscriptionStatus;
}

export interface CheckoutPlanForCreditGrant {
  id: string;
  name: string;
  credits_included: number;
  interval: string;
  interval_count: number;
  credits_expiration_days: number | null;
}

export interface GrantSubscriptionCreditsParams {
  supabaseAdmin: ReturnType<typeof createAdminClient>;
  userId: string;
  plan: CheckoutPlanForCreditGrant;
  paymentId: string;
  subscriptionId: string;
}

export interface CheckoutSuccessData {
  subscription: {
    id: string;
    status: string | null;
    paymentMethod: string | null;
    currentPeriodStart: string | null;
    currentPeriodEnd: string | null;
  };
  plan: {
    id: string;
    name: string;
    price: number;
    creditsIncluded: number;
  } | null;
}

export type CheckoutSuccessActionResult =
  | {
      status: "success";
      data: CheckoutSuccessData;
    }
  | {
      status: "unauthenticated";
    }
  | {
      status: "not_found";
    };
