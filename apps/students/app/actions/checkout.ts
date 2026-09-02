"use server";

import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";
import {
  getDataCrazySyncErrorCode,
  syncStudentToDataCrazy,
} from "@/lib/integrations/datacrazy/sync-student";
import type {
  CheckoutPageData,
  CreateCheckoutSubscriptionInput,
  CreateCheckoutSubscriptionResult,
} from "@/types";
import {
  createPagarmeSubscription,
} from "@repo/payments";
import { getOrCreatePagarmeCustomerId } from "@/services/payments/pagarme-customer";
import { createAndSavePaymentCard } from "@/services/payments/payment-cards";
import {
  buildPagarmeBillingAddress,
  buildSubscriptionCode,
  isValidPaymentMethod,
  mapPagarmeSubscriptionStatus,
  normalizePaymentMethods,
  normalizePlanFeatures,
} from "@/utils/checkout-utils";

type CheckoutOperation = "new_subscription" | "subscription_reactivation";

interface FinalizeCheckoutSubscriptionResult {
  success: boolean;
  duplicate: boolean;
  subscription_id: string;
  contract_id: string;
  contract_version: number;
  payment_id: string;
  credit_transaction_id: string | null;
}

type CheckoutBlockReason =
  | "active_paid_subscription"
  | "payment_issue"
  | "unsupported_subscription";

type CheckoutAccess =
  | {
      allowed: true;
      operation: CheckoutOperation;
      currentSubscriptionId: string | null;
      previousSubscriptionExternalId: string | null;
    }
  | {
      allowed: false;
      reason: CheckoutBlockReason;
    };

async function resolveCheckoutAccess({
  userId,
  targetPlanId,
}: {
  userId: string;
  targetPlanId: string;
}): Promise<CheckoutAccess> {
  const supabaseAdmin = createAdminClient();

  const { data: currentSubscription, error: subscriptionError } = await supabaseAdmin
    .from("subscriptions")
    .select(
      `
        id,
        plan_id,
        status,
        external_id
      `
    )
    .eq("user_id", userId)
    .maybeSingle();

  if (subscriptionError) {
    console.error("[CHECKOUT_CURRENT_SUBSCRIPTION_ERROR]", subscriptionError);

    return {
      allowed: false,
      reason: "unsupported_subscription",
    };
  }

  if (!currentSubscription) {
    return {
      allowed: true,
      operation: "new_subscription",
      currentSubscriptionId: null,
      previousSubscriptionExternalId: null,
    };
  }

  const { data: currentPlan, error: currentPlanError } = await supabaseAdmin
    .from("plans")
    .select(
      `
        id,
        external_id,
        price,
        is_public
      `
    )
    .eq("id", currentSubscription.plan_id)
    .maybeSingle();

  if (currentPlanError || !currentPlan) {
    console.error("[CHECKOUT_CURRENT_PLAN_ERROR]", currentPlanError);

    return {
      allowed: false,
      reason: "unsupported_subscription",
    };
  }

  const isFreeTrial = currentPlan.external_id === "internal_free_trial";

  const isMentorship = currentPlan.external_id === "internal_mentoria_free";

  const isPaidPlan = currentPlan.price > 0 && currentPlan.is_public;

  if (isMentorship) {
    return {
      allowed: true,
      operation: "new_subscription",
      currentSubscriptionId: currentSubscription.id,
      previousSubscriptionExternalId: currentSubscription.external_id,
    };
  }

  if (currentSubscription.status === "past_due" || currentSubscription.status === "unpaid") {
    return {
      allowed: false,
      reason: "payment_issue",
    };
  }

  if (
    isPaidPlan &&
    (currentSubscription.status === "active" || currentSubscription.status === "trial")
  ) {
    return {
      allowed: false,
      reason: "active_paid_subscription",
    };
  }

  if (isPaidPlan && currentSubscription.status === "canceled") {
    return {
      allowed: true,
      operation:
        currentSubscription.plan_id === targetPlanId
          ? "subscription_reactivation"
          : "new_subscription",
      currentSubscriptionId: currentSubscription.id,
      previousSubscriptionExternalId: currentSubscription.external_id,
    };
  }

  if (isFreeTrial) {
    return {
      allowed: true,
      operation: "new_subscription",
      currentSubscriptionId: currentSubscription.id,
      previousSubscriptionExternalId: currentSubscription.external_id,
    };
  }

  return {
    allowed: false,
    reason: "unsupported_subscription",
  };
}

function getCheckoutBlockMessage(reason: CheckoutBlockReason): string {
  switch (reason) {
    case "active_paid_subscription":
      return "Você já possui uma assinatura ativa. Utilize a opção de alterar plano.";

    case "payment_issue":
      return "Regularize sua assinatura atual antes de contratar outro plano.";

    default:
      return "Não foi possível iniciar o checkout para sua assinatura atual.";
  }
}

export async function getCheckoutPageData(planId: string): Promise<CheckoutPageData | null> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return null;
  }

  const [planResponse, profileResponse] = await Promise.all([
    supabase
      .from("plans")
      .select(
        `
          id,
          name,
          price,
          interval,
          interval_count,
          credits_included,
          credits_expiration_days,
          features,
          payment_methods,
          external_id,
          is_public
        `
      )
      .eq("id", planId)
      .eq("is_active", true)
      .maybeSingle(),

    supabase
      .from("profiles")
      .select("id, full_name, email, document, phone")
      .eq("id", user.id)
      .maybeSingle(),
  ]);

  if (planResponse.error || profileResponse.error) {
    console.error("[CHECKOUT_DATA_ERROR]", {
      planError: planResponse.error,
      profileError: profileResponse.error,
    });

    return null;
  }

  const plan = planResponse.data;
  const profile = profileResponse.data;

  if (!plan || !profile) {
    return null;
  }

  const paymentMethods = normalizePaymentMethods(plan.payment_methods);

  const canCheckout =
    plan.is_public &&
    plan.price > 0 &&
    Boolean(plan.external_id) &&
    plan.external_id !== "internal_mentoria_free" &&
    paymentMethods.length > 0;

  if (!canCheckout) {
    return null;
  }

  return {
    plan: {
      id: plan.id,
      name: plan.name,
      price: plan.price,
      interval: plan.interval,
      intervalCount: plan.interval_count,
      creditsIncluded: plan.credits_included,
      creditsExpirationDays: plan.credits_expiration_days,
      paymentMethods,
      features: normalizePlanFeatures(plan.features),
    },
    student: {
      id: profile.id,
      name: profile.full_name,
      email: profile.email ?? user.email ?? "",
      document: profile.document,
      phone: profile.phone,
    },
  };
}

export async function createCheckoutSubscription(
  input: CreateCheckoutSubscriptionInput
): Promise<CreateCheckoutSubscriptionResult> {
  const supabase = await createClient();
  const supabaseAdmin = createAdminClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Você precisa estar logado para finalizar a assinatura.");
  }

  if (!isValidPaymentMethod(input.paymentMethod)) {
    throw new Error("Método de pagamento inválido.");
  }

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select(
      `
    id,
    name,
    price,
    external_id,
    is_public,
    payment_methods,
    credits_included,
    credits_expiration_days,
    interval,
    interval_count
  `
    )
    .eq("id", input.planId)
    .eq("is_active", true)
    .maybeSingle();

  if (planError || !plan) {
    throw new Error("Plano não encontrado.");
  }

  const paymentMethods = normalizePaymentMethods(plan.payment_methods);

  const canCheckout =
    plan.is_public &&
    plan.price > 0 &&
    Boolean(plan.external_id) &&
    plan.external_id !== "internal_mentoria_free" &&
    paymentMethods.includes(input.paymentMethod);

  if (!canCheckout) {
    throw new Error("Este plano não está disponível para checkout.");
  }

  const checkoutAccess = await resolveCheckoutAccess({
    userId: user.id,
    targetPlanId: plan.id,
  });

  if (!checkoutAccess.allowed) {
    throw new Error(getCheckoutBlockMessage(checkoutAccess.reason));
  }

  const checkoutOperation = checkoutAccess.operation;

  const pagarmePlanId = plan.external_id;

  if (!pagarmePlanId) {
    throw new Error("Plano sem vínculo com a Pagar.me.");
  }

  const isCardPayment =
    input.paymentMethod === "credit_card" || input.paymentMethod === "debit_card";

  if (isCardPayment && !input.cardToken) {
    throw new Error("Token do cartão não informado.");
  }

  if (isCardPayment && input.cardToken && !input.cardToken.startsWith("token_")) {
    throw new Error("Token do cartão inválido.");
  }

  const billingAddress = buildPagarmeBillingAddress(input.billingAddress);
  const pagarmeCustomerId = await getOrCreatePagarmeCustomerId();

  let savedCardId: string | null = null;
  let pagarmeCardId: string | undefined;

  if (isCardPayment && input.cardToken) {
    const savedCard = await createAndSavePaymentCard({
      userId: user.id,
      customerId: pagarmeCustomerId,
      cardToken: input.cardToken,
      billingAddress,
      label: "Cartão salvo",
      metadata: {
        user_id: user.id,
        plan_id: plan.id,
        source: "students_checkout",
      },
    });

    savedCardId = savedCard.localCardId;
    pagarmeCardId = savedCard.pagarmeCardId;
  }

  const subscriptionCode = buildSubscriptionCode(user.id);

  const pagarmeSubscription = await createPagarmeSubscription({
    code: subscriptionCode,
    planId: pagarmePlanId,
    customerId: pagarmeCustomerId,
    paymentMethod: input.paymentMethod,
    billingAddress,
    cardId: pagarmeCardId,
    cardToken: isCardPayment && !pagarmeCardId ? input.cardToken : undefined,
    boletoDueDays: 3,
    metadata: {
      user_id: user.id,
      plan_id: plan.id,
      local_subscription_code: subscriptionCode,
      source: "students_checkout",
      checkout_operation: checkoutOperation,

      ...(checkoutAccess.previousSubscriptionExternalId
        ? {
            previous_subscription_external_id: checkoutAccess.previousSubscriptionExternalId,
          }
        : {}),
    },
  });

  if (!pagarmeSubscription.id) {
    throw new Error("A Pagar.me não retornou uma assinatura válida.");
  }

  const localSubscriptionStatus = mapPagarmeSubscriptionStatus(pagarmeSubscription.status);

  if (localSubscriptionStatus === "active" && !pagarmeSubscription.next_billing_at) {
    throw new Error("A Pagar.me não informou a próxima data de cobrança.");
  }

  if (isCardPayment && localSubscriptionStatus !== "active") {
    const { error: failedPaymentError } = await supabaseAdmin.from("student_payments").insert({
      user_id: user.id,
      subscription_id: null,
      plan_id: plan.id,
      payment_card_id: savedCardId,
      kind: "subscription",
      provider: "pagarme",
      external_id: pagarmeSubscription.id,
      amount: plan.price,
      credits_amount: plan.credits_included,
      status: pagarmeSubscription.status ?? "failed",
      payment_method: input.paymentMethod,
      paid_at: null,
      metadata: {
        provider: "pagarme",
        pagarme_subscription_id: pagarmeSubscription.id,
        pagarme_customer_id: pagarmeCustomerId,
        pagarme_status: pagarmeSubscription.status,
        local_subscription_code: subscriptionCode,
        failure_reason: "card_payment_failed",
        checkout_operation: checkoutOperation,
        previous_subscription_external_id: checkoutAccess.previousSubscriptionExternalId,
      },
    });

    if (failedPaymentError) {
      throw new Error("Não foi possível registrar a tentativa de pagamento.");
    }

    throw new Error("Pagamento não autorizado. Confira os dados do cartão ou tente outro cartão.");
  }

  const providerSubscriptionItemId =
    pagarmeSubscription.items?.find(
      (item) => item.status === "active" && item.id.startsWith("si_")
    )?.id ??
    pagarmeSubscription.items?.find((item) => item.id.startsWith("si_"))?.id ??
    null;

  const finalizedAt = new Date().toISOString();
  const contractEffectiveAt =
    pagarmeSubscription.current_cycle?.start_at ??
    pagarmeSubscription.created_at ??
    finalizedAt;

  const { data: finalizationData, error: finalizationError } = await supabaseAdmin.rpc(
    "finalize_checkout_subscription",
    {
      p_user_id: user.id,
      p_plan_id: plan.id,
      p_plan_name: plan.name,
      p_price_cents: plan.price,
      p_currency: (pagarmeSubscription.currency ?? "BRL").toUpperCase(),
      p_credits_included: plan.credits_included,
      p_interval: plan.interval,
      p_interval_count: plan.interval_count,
      p_credits_expiration_days: plan.credits_expiration_days,
      p_provider_plan_id: pagarmePlanId,
      p_provider_subscription_item_id: providerSubscriptionItemId,
      p_provider_subscription_id: pagarmeSubscription.id,
      p_subscription_status: localSubscriptionStatus,
      p_current_period_start: pagarmeSubscription.current_cycle?.start_at ?? null,
      p_current_period_end: pagarmeSubscription.current_cycle?.end_at ?? null,
      p_next_billing_at: pagarmeSubscription.next_billing_at ?? null,
      p_payment_method: input.paymentMethod,
      p_payment_card_id: savedCardId,
      p_subscription_metadata: {
        provider: "pagarme",
        pagarme_subscription_id: pagarmeSubscription.id,
        previous_subscription_external_id: checkoutAccess.previousSubscriptionExternalId,
        pagarme_customer_id: pagarmeCustomerId,
        pagarme_status: pagarmeSubscription.status,
        next_billing_at: pagarmeSubscription.next_billing_at ?? null,
        checkout_operation: checkoutOperation,
      },
      p_payment_status: pagarmeSubscription.status ?? localSubscriptionStatus,
      p_paid_at: localSubscriptionStatus === "active" ? finalizedAt : null,
      p_effective_at: contractEffectiveAt,
      p_checkout_operation: checkoutOperation,
      p_previous_subscription_external_id: checkoutAccess.previousSubscriptionExternalId,
    }
  );

  const finalization = finalizationData as FinalizeCheckoutSubscriptionResult | null;

  if (finalizationError || !finalization?.success) {
    console.error("[FINALIZE_CHECKOUT_SUBSCRIPTION_ERROR]", finalizationError);

    throw new Error("Não foi possível concluir a assinatura no sistema.");
  }

  if (!finalization.duplicate) {
    try {
      await syncStudentToDataCrazy(user.id, "subscription_updated");
    } catch (error) {
      console.error("[DATACRAZY_SYNC_ERROR]", {
        user_id: user.id,
        subscription_id: finalization.subscription_id,
        event: "subscription_updated",
        error_code: getDataCrazySyncErrorCode(error),
      });
    }
  }

  return {
    success: true,
    subscriptionId: pagarmeSubscription.id,
    localSubscriptionId: finalization.subscription_id,
    paymentId: finalization.payment_id,
    savedCardId,
    status: localSubscriptionStatus,
  };
}
