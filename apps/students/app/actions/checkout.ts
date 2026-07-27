"use server";

import { createClient } from "@/lib/server";
import { createAdminClient } from "@/lib/admin";
import type {
  CheckoutPageData,
  CheckoutProfileForPagarme,
  CreateCheckoutSubscriptionInput,
  CreateCheckoutSubscriptionResult,
} from "@/types";
import {
  createPagarmeCard,
  createPagarmeCustomer,
  createPagarmeSubscription,
} from "@repo/payments";
import {
  buildPagarmeBillingAddress,
  buildSubscriptionCode,
  isValidPaymentMethod,
  mapPagarmeSubscriptionStatus,
  normalizePaymentMethods,
  normalizePlanFeatures,
} from "@/utils/checkout-utils";

type CheckoutOperation = "new_subscription" | "subscription_reactivation";

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

async function getOrCreatePagarmeCustomerId() {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Você precisa estar logado para finalizar a assinatura.");
  }

  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select(
      `
        id,
        email,
        full_name,
        document,
        phone_country_code,
        phone,
        pagarme_customer_id
      `
    )
    .eq("id", user.id)
    .single<CheckoutProfileForPagarme>();

  if (profileError || !profile) {
    throw new Error("Não foi possível encontrar o perfil do aluno.");
  }

  if (!profile.full_name?.trim()) {
    throw new Error("Complete seu nome antes de finalizar a assinatura.");
  }

  if (!profile.document?.trim()) {
    throw new Error("Complete seu CPF antes de finalizar a assinatura.");
  }

  if (!profile.phone_country_code?.trim()) {
    throw new Error("Complete o código do país antes de finalizar a assinatura.");
  }

  if (!profile.phone?.trim()) {
    throw new Error("Complete seu telefone antes de finalizar a assinatura.");
  }

  const customer = await createPagarmeCustomer({
    id: profile.id,
    name: profile.full_name,
    email: profile.email,
    document: profile.document,
    phoneCountryCode: profile.phone_country_code,
    phone: profile.phone,
  });

  if (!customer?.id) {
    throw new Error("A Pagar.me não retornou um cliente válido.");
  }

  if (profile.pagarme_customer_id !== customer.id) {
    const { error: updateError } = await supabase
      .from("profiles")
      .update({
        pagarme_customer_id: customer.id,
      })
      .eq("id", user.id);

    if (updateError) {
      throw new Error("Não foi possível vincular o cliente da Pagar.me ao aluno.");
    }
  }

  return customer.id;
}

async function grantSubscriptionCredits({
  supabaseAdmin,
  userId,
  plan,
  paymentId,
  subscriptionId,
  transactionType,
  previousSubscriptionExternalId,
}: {
  supabaseAdmin: ReturnType<typeof createAdminClient>;
  userId: string;
  plan: {
    id: string;
    name: string;
    credits_included: number;
    interval: string;
    interval_count: number;
    credits_expiration_days: number | null;
  };
  paymentId: string;
  subscriptionId: string;
  transactionType: CheckoutOperation;
  previousSubscriptionExternalId: string | null;
}) {
  if (plan.credits_included <= 0) {
    return;
  }

  const isReactivation = transactionType === "subscription_reactivation";

  const description = isReactivation
    ? `Liberação de ${plan.credits_included} crédito(s) pela reativação do plano ${plan.name}.`
    : `Liberação de ${plan.credits_included} crédito(s) do plano ${plan.name}.`;

  const { error } = await supabaseAdmin.from("credit_transactions").insert({
    user_id: userId,
    type: transactionType,
    amount: plan.credits_included,
    description,
    student_payment_id: paymentId,
    metadata: {
      source: "checkout",
      grant_type: isReactivation ? "subscription_reactivation_cycle" : "subscription_initial_cycle",
      checkout_operation: transactionType,
      subscription_id: subscriptionId,
      previous_subscription_external_id: previousSubscriptionExternalId,
      plan_id: plan.id,
      plan_name: plan.name,
      interval: plan.interval,
      interval_count: plan.interval_count,
      credits_expiration_days: plan.credits_expiration_days,
    },
  });

  if (error && error.code !== "23505") {
    console.error("[GRANT_SUBSCRIPTION_CREDITS_ERROR]", error);

    throw new Error("Não foi possível liberar os créditos da assinatura.");
  }
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

  if (isCardPayment && input.saveCard && input.cardToken) {
    const pagarmeCard = await createPagarmeCard({
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

    if (!pagarmeCard.id || !pagarmeCard.last_four_digits) {
      throw new Error("A Pagar.me não retornou um cartão válido.");
    }

    const now = new Date().toISOString();

    const { error: resetDefaultCardError } = await supabaseAdmin
      .from("student_payment_cards")
      .update({
        is_default: false,
        updated_at: now,
      })
      .eq("user_id", user.id)
      .eq("is_default", true)
      .is("deleted_at", null);

    if (resetDefaultCardError) {
      throw new Error("Não foi possível atualizar o cartão padrão.");
    }

    const { data: savedCard, error: savedCardError } = await supabaseAdmin
      .from("student_payment_cards")
      .insert({
        user_id: user.id,
        pagarme_card_id: pagarmeCard.id,
        brand: pagarmeCard.brand,
        last_four_digits: pagarmeCard.last_four_digits,
        holder_name: pagarmeCard.holder_name,
        exp_month: pagarmeCard.exp_month,
        exp_year: pagarmeCard.exp_year,
        is_default: true,
        is_active: true,
      })
      .select("id")
      .single();

    if (savedCardError || !savedCard) {
      throw new Error("Não foi possível salvar o cartão do aluno.");
    }

    savedCardId = savedCard.id;
    pagarmeCardId = pagarmeCard.id;
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

  const { data: localSubscription, error: subscriptionError } = await supabaseAdmin
    .from("subscriptions")
    .upsert(
      {
        user_id: user.id,
        plan_id: plan.id,
        status: localSubscriptionStatus,

        current_period_start: pagarmeSubscription.current_cycle?.start_at ?? null,
        current_period_end: pagarmeSubscription.current_cycle?.end_at ?? null,
        cancel_at_period_end: false,

        pending_plan_id: null,
        pending_change_type: null,
        pending_change_at: null,

        cancellation_requested_at: null,
        cancellation_effective_at: null,
        cancellation_reason: null,
        cancellation_provider_status: null,
        provider_canceled_at: null,
        canceled_at: null,
        cancellation_metadata: {},

        external_id: pagarmeSubscription.id,
        payment_method: input.paymentMethod,
        payment_card_id: savedCardId,

        metadata: {
          provider: "pagarme",
          pagarme_subscription_id: pagarmeSubscription.id,
          previous_subscription_external_id: checkoutAccess.previousSubscriptionExternalId,
          pagarme_customer_id: pagarmeCustomerId,
          pagarme_status: pagarmeSubscription.status,
          saved_card: Boolean(savedCardId),
          checkout_operation: checkoutOperation,
        },

        updated_at: new Date().toISOString(),
      },
      { onConflict: "user_id" }
    )
    .select("id")
    .single();

  if (subscriptionError || !localSubscription) {
    throw new Error("Não foi possível salvar a assinatura no sistema.");
  }

  const { data: payment, error: paymentError } = await supabaseAdmin
    .from("student_payments")
    .insert({
      user_id: user.id,
      subscription_id: localSubscription.id,
      plan_id: plan.id,
      payment_card_id: savedCardId,
      kind: "subscription",
      provider: "pagarme",
      external_id: pagarmeSubscription.id,
      amount: plan.price,
      credits_amount: plan.credits_included,
      status: pagarmeSubscription.status ?? localSubscriptionStatus,
      payment_method: input.paymentMethod,
      paid_at: localSubscriptionStatus === "active" ? new Date().toISOString() : null,
      metadata: {
        provider: "pagarme",
        pagarme_subscription_id: pagarmeSubscription.id,
        pagarme_customer_id: pagarmeCustomerId,
        pagarme_status: pagarmeSubscription.status,
        local_subscription_code: subscriptionCode,
        checkout_operation: checkoutOperation,
        previous_subscription_external_id: checkoutAccess.previousSubscriptionExternalId,
      },
    })
    .select("id")
    .single();

  if (paymentError || !payment) {
    throw new Error("Não foi possível registrar o pagamento do aluno.");
  }

  if (localSubscriptionStatus === "active") {
    await grantSubscriptionCredits({
      supabaseAdmin,
      userId: user.id,
      plan,
      paymentId: payment.id,
      subscriptionId: localSubscription.id,
      transactionType: checkoutOperation,
      previousSubscriptionExternalId: checkoutAccess.previousSubscriptionExternalId,
    });
  }

  return {
    success: true,
    subscriptionId: pagarmeSubscription.id,
    localSubscriptionId: localSubscription.id,
    paymentId: payment.id,
    savedCardId,
    status: localSubscriptionStatus,
  };
}
