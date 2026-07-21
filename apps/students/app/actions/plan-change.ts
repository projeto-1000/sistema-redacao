"use server";

import { createClient } from "@/lib/server";
import { calculatePlanUpgrade, type PlanUpgradeCalculation } from "@/utils/calculate-plan-upgrade";
import { createAdminClient } from "@/lib/admin";
import {
  createPagarmeOrder,
  findPagarmeOrderByCode,
  getPagarmeOrderPaymentResult,
  getPagarmeSubscription,
  listPagarmeSubscriptionItems,
  updatePagarmeSubscriptionItem,
  type PagarmeOrder,
} from "@repo/payments";
import { randomUUID } from "node:crypto";
import { revalidatePath } from "next/cache";

interface UpgradePlanSummary {
  id: string;
  name: string;
  price: number;
  creditsIncluded: number;
}

export interface PlanUpgradePreview extends PlanUpgradeCalculation {
  subscriptionId: string;
  subscriptionExternalId: string | null;

  currentPlan: UpgradePlanSummary;
  newPlan: UpgradePlanSummary;
}

export type ExecutePlanUpgradeResult =
  | {
      success: true;
      alreadyProcessed: boolean;

      paymentId: string;
      orderId: string;

      previousPlanId: string;
      targetPlanId: string;

      additionalCredits: number;
      proratedAmount: number;
    }
  | {
      success: false;
      message: string;
    };

interface PlanUpgradePaymentReservation {
  id: string;
  status: string;
  external_id: string | null;
  idempotency_key: string | null;
  amount: number;
  credits_amount: number | null;
}

interface ReservePlanUpgradePaymentParams {
  userId: string;
  subscriptionId: string;

  currentPlanId: string;
  targetPlanId: string;

  paymentCardId: string | null;

  proratedAmount: number;
  additionalCredits: number;

  currentPeriodStart: string;
  currentPeriodEnd: string;
}

interface DowngradePlanSummary {
  id: string;
  name: string;
  price: number;
  creditsIncluded: number;
}

export interface PlanDowngradePreview {
  subscriptionId: string;
  subscriptionExternalId: string | null;

  currentPeriodEnd: string;

  currentPlan: DowngradePlanSummary;
  newPlan: DowngradePlanSummary;
}

export type SchedulePlanDowngradeResult =
  | {
      success: true;

      subscriptionId: string;
      previousPlanId: string;
      targetPlanId: string;

      scheduledAt: string;
    }
  | {
      success: false;
      message: string;
    };

async function reservePlanUpgradePayment({
  userId,
  subscriptionId,
  currentPlanId,
  targetPlanId,
  paymentCardId,
  proratedAmount,
  additionalCredits,
  currentPeriodStart,
  currentPeriodEnd,
}: ReservePlanUpgradePaymentParams): Promise<PlanUpgradePaymentReservation> {
  const supabaseAdmin = createAdminClient();

  const idempotencyKey = randomUUID();

  const { data: createdPayment, error: createPaymentError } = await supabaseAdmin
    .from("student_payments")
    .insert({
      user_id: userId,
      subscription_id: subscriptionId,
      plan_id: targetPlanId,
      payment_card_id: paymentCardId,

      kind: "plan_upgrade_prorata",
      provider: "pagarme",

      amount: proratedAmount,
      credits_amount: additionalCredits,

      status: "processing",
      payment_method: "credit_card",

      idempotency_key: idempotencyKey,

      metadata: {
        source: "plan_upgrade",

        previous_plan_id: currentPlanId,
        target_plan_id: targetPlanId,

        prorated_amount: proratedAmount,
        additional_credits: additionalCredits,

        current_period_start: currentPeriodStart,
        current_period_end: currentPeriodEnd,

        operation_created_at: new Date().toISOString(),
      },
    })
    .select(
      `
      id,
      status,
      external_id,
      idempotency_key,
      amount,
      credits_amount
      `
    )
    .single();

  if (!createPaymentError && createdPayment) {
    return createdPayment;
  }

  /*
   * Outro processo pode ter reservado o mesmo
   * upgrade simultaneamente.
   */
  if (createPaymentError?.code !== "23505") {
    console.error("[RESERVE_PLAN_UPGRADE_PAYMENT_ERROR]", createPaymentError);

    throw new Error("Não foi possível iniciar o pagamento do upgrade.");
  }

  const { data: existingPayment, error: existingPaymentError } = await supabaseAdmin
    .from("student_payments")
    .select(
      `
      id,
      status,
      external_id,
      idempotency_key,
      amount,
      credits_amount
      `
    )
    .eq("user_id", userId)
    .eq("subscription_id", subscriptionId)
    .eq("plan_id", targetPlanId)
    .eq("kind", "plan_upgrade_prorata")
    .in("status", ["processing", "pending", "paid", "active"])
    .contains("metadata", {
      current_period_start: currentPeriodStart,
    })
    .order("created_at", {
      ascending: false,
    })
    .limit(1)
    .maybeSingle();

  if (existingPaymentError || !existingPayment) {
    console.error("[GET_EXISTING_PLAN_UPGRADE_PAYMENT_ERROR]", existingPaymentError);

    throw new Error("Não foi possível recuperar a operação de upgrade em andamento.");
  }

  return existingPayment;
}

interface ResolvePlanUpgradePaymentContextParams {
  userId: string;
  subscriptionExternalId: string;
  paymentCardId: string | null;
}

interface PlanUpgradePaymentContext {
  localPaymentCardId: string | null;
  pagarmeCustomerId: string;
  pagarmeCardId: string;
}

async function resolvePlanUpgradePaymentContext({
  userId,
  subscriptionExternalId,
  paymentCardId,
}: ResolvePlanUpgradePaymentContextParams): Promise<PlanUpgradePaymentContext> {
  if (!subscriptionExternalId.startsWith("sub_")) {
    throw new Error("A assinatura atual não possui um vínculo válido com a Pagar.me.");
  }

  const supabaseAdmin = createAdminClient();

  const { data: profile, error: profileError } = await supabaseAdmin
    .from("profiles")
    .select("pagarme_customer_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) {
    console.error("[PLAN_UPGRADE_PROFILE_ERROR]", profileError);

    throw new Error("Não foi possível carregar os dados de pagamento do aluno.");
  }

  let localCard: {
    id: string;
    pagarme_card_id: string;
  } | null = null;

  if (paymentCardId) {
    const { data: savedCard, error: savedCardError } = await supabaseAdmin
      .from("student_payment_cards")
      .select(
        `
          id,
          pagarme_card_id
        `
      )
      .eq("id", paymentCardId)
      .eq("user_id", userId)
      .eq("is_active", true)
      .is("deleted_at", null)
      .maybeSingle();

    if (savedCardError) {
      console.error("[PLAN_UPGRADE_SAVED_CARD_ERROR]", savedCardError);

      throw new Error("Não foi possível carregar o cartão da assinatura.");
    }

    localCard = savedCard;
  }

  const pagarmeSubscription = await getPagarmeSubscription({
    subscriptionId: subscriptionExternalId,
  });

  if (pagarmeSubscription.payment_method !== "credit_card") {
    throw new Error(
      "A troca automática de plano está disponível apenas para assinaturas pagas com cartão de crédito."
    );
  }

  const pagarmeCustomerId = profile?.pagarme_customer_id ?? pagarmeSubscription.customer?.id;

  const pagarmeCardId = localCard?.pagarme_card_id ?? pagarmeSubscription.card?.id;

  if (!pagarmeCustomerId || !pagarmeCustomerId.startsWith("cus_")) {
    throw new Error("Não foi possível identificar o cliente da assinatura na Pagar.me.");
  }

  if (!pagarmeCardId || !pagarmeCardId.startsWith("card_")) {
    throw new Error("Não foi possível identificar o cartão utilizado na assinatura.");
  }

  return {
    localPaymentCardId: localCard?.id ?? null,

    pagarmeCustomerId,
    pagarmeCardId,
  };
}

interface ResolvePagarmeSubscriptionItemParams {
  subscriptionExternalId: string;
}

async function resolvePagarmeSubscriptionItem({
  subscriptionExternalId,
}: ResolvePagarmeSubscriptionItemParams) {
  const response = await listPagarmeSubscriptionItems({
    subscriptionId: subscriptionExternalId,
  });

  const activeItems = response.data.filter((item) => item.status === "active" && !item.deleted_at);

  if (activeItems.length === 0) {
    throw new Error("Nenhum item recorrente ativo foi encontrado na assinatura.");
  }

  if (activeItems.length > 1) {
    throw new Error(
      "A assinatura possui mais de um item recorrente ativo e não pode ser alterada automaticamente."
    );
  }

  return activeItems[0];
}

interface CreateOrRecoverPlanUpgradeOrderParams {
  paymentId: string;
  idempotencyKey: string | null;

  pagarmeCustomerId: string;
  pagarmeCardId: string;

  currentPlanId: string;
  targetPlanId: string;

  proratedAmount: number;

  currentPeriodStart: string;
  currentPeriodEnd: string;
}

async function createOrRecoverPlanUpgradeOrder({
  paymentId,
  idempotencyKey,
  pagarmeCustomerId,
  pagarmeCardId,
  currentPlanId,
  targetPlanId,
  proratedAmount,
  currentPeriodStart,
  currentPeriodEnd,
}: CreateOrRecoverPlanUpgradeOrderParams): Promise<PagarmeOrder> {
  if (!idempotencyKey) {
    throw new Error("A operação de upgrade não possui uma chave de idempotência.");
  }

  const orderCode = `plan-upgrade-${paymentId}`;

  /*
   * Recupera um pedido que possa ter sido criado
   * antes de uma interrupção da requisição.
   */
  const existingOrder = await findPagarmeOrderByCode({
    code: orderCode,
  });

  if (existingOrder) {
    return existingOrder;
  }

  return createPagarmeOrder({
    code: orderCode,

    customerId: pagarmeCustomerId,
    cardId: pagarmeCardId,

    amount: proratedAmount,

    itemCode: `plan-upgrade-${targetPlanId}`,

    itemDescription: "Cobrança proporcional por upgrade de plano",

    idempotencyKey,

    metadata: {
      source: "plan_upgrade",
      payment_id: paymentId,

      previous_plan_id: currentPlanId,
      target_plan_id: targetPlanId,

      prorated_amount: String(proratedAmount),

      current_period_start: currentPeriodStart,

      current_period_end: currentPeriodEnd,
    },
  });
}

interface UpdatePlanUpgradePaymentResultParams {
  paymentId: string;

  orderId: string;
  orderStatus: string;

  chargeId: string | null;
  paidAt: string | null;

  isPaid: boolean;
}

async function updatePlanUpgradePaymentResult({
  paymentId,
  orderId,
  orderStatus,
  chargeId,
  paidAt,
  isPaid,
}: UpdatePlanUpgradePaymentResultParams) {
  const supabaseAdmin = createAdminClient();

  const { data: payment, error: paymentError } = await supabaseAdmin
    .from("student_payments")
    .select("metadata")
    .eq("id", paymentId)
    .maybeSingle();

  if (paymentError || !payment) {
    console.error("[GET_PLAN_UPGRADE_PAYMENT_METADATA_ERROR]", paymentError);

    throw new Error("Não foi possível recuperar os dados do pagamento.");
  }

  const currentMetadata =
    payment.metadata && typeof payment.metadata === "object" && !Array.isArray(payment.metadata)
      ? payment.metadata
      : {};

  const { error: updatePaymentError } = await supabaseAdmin
    .from("student_payments")
    .update({
      external_id: orderId,
      status: isPaid ? "paid" : orderStatus,
      paid_at: isPaid ? paidAt : null,

      metadata: {
        ...currentMetadata,

        pagarme_order_id: orderId,
        pagarme_order_status: orderStatus,
        pagarme_charge_id: chargeId,

        payment_processed_at: new Date().toISOString(),
      },

      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentId);

  if (updatePaymentError) {
    console.error("[UPDATE_PLAN_UPGRADE_PAYMENT_ERROR]", updatePaymentError);

    throw new Error("Não foi possível registrar o resultado do pagamento.");
  }
}

interface FinalizePlanUpgradeInDatabaseParams {
  userId: string;
  subscriptionId: string;
  paymentId: string;

  currentPlanId: string;
  targetPlanId: string;

  proratedAmount: number;
  additionalCredits: number;

  orderId: string;
  orderStatus: string;
  chargeId: string | null;
  paidAt: string | null;

  subscriptionItemId: string;

  currentPeriodStart: string;
  currentPeriodEnd: string;
}

interface FinalizePlanUpgradeDatabaseResult {
  success: boolean;
  already_processed: boolean;

  subscription_id: string;
  payment_id: string;
  credit_transaction_id: string | null;

  previous_plan_id?: string;
  target_plan_id?: string;
  additional_credits?: number;
}

async function finalizePlanUpgradeInDatabase({
  userId,
  subscriptionId,
  paymentId,
  currentPlanId,
  targetPlanId,
  proratedAmount,
  additionalCredits,
  orderId,
  orderStatus,
  chargeId,
  paidAt,
  subscriptionItemId,
  currentPeriodStart,
  currentPeriodEnd,
}: FinalizePlanUpgradeInDatabaseParams): Promise<FinalizePlanUpgradeDatabaseResult> {
  const supabaseAdmin = createAdminClient();

  const { data, error } = await supabaseAdmin.rpc("finalize_plan_upgrade", {
    p_user_id: userId,
    p_subscription_id: subscriptionId,
    p_payment_id: paymentId,

    p_expected_current_plan_id: currentPlanId,
    p_target_plan_id: targetPlanId,

    p_prorated_amount: proratedAmount,
    p_additional_credits: additionalCredits,

    p_order_external_id: orderId,
    p_order_status: orderStatus,
    p_charge_external_id: chargeId,
    p_paid_at: paidAt,

    p_subscription_item_external_id: subscriptionItemId,

    p_current_period_start: currentPeriodStart,
    p_current_period_end: currentPeriodEnd,
  });

  if (error) {
    console.error("[FINALIZE_PLAN_UPGRADE_ERROR]", error);

    throw new Error(
      "O pagamento foi aprovado, mas não foi possível concluir a alteração do plano."
    );
  }

  if (!data || typeof data !== "object" || Array.isArray(data)) {
    throw new Error("O banco retornou uma resposta inválida ao finalizar o upgrade.");
  }

  return data as unknown as FinalizePlanUpgradeDatabaseResult;
}

export async function getPlanUpgradePreview(targetPlanId: string): Promise<PlanUpgradePreview> {
  if (!targetPlanId) {
    throw new Error("O plano de destino é obrigatório.");
  }

  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    throw new Error("Você precisa estar logado para alterar o plano.");
  }

  const { data: subscription, error: subscriptionError } = await supabase
    .from("subscriptions")
    .select(
      `
        id,
        external_id,
        plan_id,
        status,
        current_period_start,
        current_period_end,
        cancel_at_period_end,
        pending_plan_id,
        pending_change_type,
        pending_change_at
      `
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (subscriptionError || !subscription) {
    throw new Error("Não foi possível encontrar sua assinatura atual.");
  }

  if (subscription.status !== "active" && subscription.status !== "trial") {
    throw new Error("Sua assinatura atual não permite alteração de plano.");
  }

  if (subscription.cancel_at_period_end) {
    throw new Error("Cancele o encerramento agendado antes de alterar o plano.");
  }

  if (!subscription.current_period_start || !subscription.current_period_end) {
    throw new Error("O período atual da assinatura não está disponível.");
  }

  if (subscription.plan_id === targetPlanId) {
    throw new Error("O plano selecionado já é o seu plano atual.");
  }

  const [currentPlanResult, targetPlanResult] = await Promise.all([
    supabase
      .from("plans")
      .select(
        `
          id,
          name,
          price,
          credits_included,
          interval,
          interval_count,
          is_public
        `
      )
      .eq("id", subscription.plan_id)
      .maybeSingle(),

    supabase
      .from("plans")
      .select(
        `
          id,
          name,
          price,
          credits_included,
          interval,
          interval_count,
          is_public,
          is_active
        `
      )
      .eq("id", targetPlanId)
      .eq("is_active", true)
      .eq("is_public", true)
      .maybeSingle(),
  ]);

  if (currentPlanResult.error || !currentPlanResult.data) {
    console.error("[PLAN_UPGRADE_CURRENT_PLAN_ERROR]", currentPlanResult.error);

    throw new Error("Não foi possível carregar o plano atual.");
  }

  if (targetPlanResult.error || !targetPlanResult.data) {
    console.error("[PLAN_UPGRADE_TARGET_PLAN_ERROR]", targetPlanResult.error);

    throw new Error("O novo plano não está disponível.");
  }

  const currentPlan = currentPlanResult.data;

  const targetPlan = targetPlanResult.data;

  const currentIntervalCount = currentPlan.interval_count ?? 1;

  const targetIntervalCount = targetPlan.interval_count ?? 1;

  /*
   * Inicialmente permitimos upgrade somente entre
   * planos com a mesma periodicidade.
   *
   * Exemplo:
   * Basic mensal -> Premium mensal.
   */
  if (
    currentPlan.interval !== targetPlan.interval ||
    currentIntervalCount !== targetIntervalCount
  ) {
    throw new Error("A troca entre periodicidades diferentes ainda não está disponível.");
  }

  const calculation = calculatePlanUpgrade({
    currentPlanPrice: currentPlan.price,

    newPlanPrice: targetPlan.price,

    currentPlanCredits: currentPlan.credits_included,

    newPlanCredits: targetPlan.credits_included,

    currentPeriodStart: subscription.current_period_start,

    currentPeriodEnd: subscription.current_period_end,
  });

  return {
    ...calculation,

    subscriptionId: subscription.id,

    subscriptionExternalId: subscription.external_id,

    currentPlan: {
      id: currentPlan.id,
      name: currentPlan.name,
      price: currentPlan.price,
      creditsIncluded: currentPlan.credits_included,
    },

    newPlan: {
      id: targetPlan.id,
      name: targetPlan.name,
      price: targetPlan.price,
      creditsIncluded: targetPlan.credits_included,
    },
  };
}

export async function getPlanDowngradePreview(
  targetPlanId: string
): Promise<PlanDowngradePreview | null> {
  const supabase = await createClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const admin = createAdminClient();

  const { data: subscription, error: subscriptionError } = await admin
    .from("subscriptions")
    .select(
      `
          id,
          external_id,
          plan_id,
          status,
          current_period_start,
          current_period_end,
          cancel_at_period_end,
          pending_plan_id,
          pending_change_type,
          pending_change_at
        `
    )
    .eq("user_id", user.id)
    .maybeSingle();

  if (
    subscriptionError ||
    !subscription ||
    subscription.status !== "active" ||
    subscription.cancel_at_period_end ||
    subscription.pending_plan_id ||
    subscription.pending_change_type ||
    subscription.pending_change_at ||
    !subscription.current_period_start ||
    !subscription.current_period_end
  ) {
    return null;
  }

  const { data: plans, error: plansError } = await admin
    .from("plans")
    .select(
      `
        id,
        name,
        price,
        credits_included,
        interval,
        interval_count
      `
    )
    .in("id", [subscription.plan_id, targetPlanId]);

  if (plansError || !plans || plans.length !== 2) {
    return null;
  }

  const currentPlan = plans.find((plan) => plan.id === subscription.plan_id);

  const targetPlan = plans.find((plan) => plan.id === targetPlanId);

  if (
    !currentPlan ||
    !targetPlan ||
    targetPlan.price >= currentPlan.price ||
    targetPlan.interval !== currentPlan.interval ||
    (targetPlan.interval_count ?? 1) !== (currentPlan.interval_count ?? 1)
  ) {
    return null;
  }

  return {
    subscriptionId: subscription.id,
    subscriptionExternalId: subscription.external_id,

    currentPeriodEnd: subscription.current_period_end,

    currentPlan: {
      id: currentPlan.id,
      name: currentPlan.name,
      price: currentPlan.price,
      creditsIncluded: currentPlan.credits_included,
    },

    newPlan: {
      id: targetPlan.id,
      name: targetPlan.name,
      price: targetPlan.price,
      creditsIncluded: targetPlan.credits_included,
    },
  };
}

export async function schedulePlanDowngrade(
  targetPlanId: string
): Promise<SchedulePlanDowngradeResult> {
  try {
    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        message: "Você precisa estar autenticado.",
      };
    }

    const preview = await getPlanDowngradePreview(targetPlanId);

    if (!preview) {
      return {
        success: false,
        message: "Não foi possível validar o downgrade solicitado.",
      };
    }

    if (!preview.subscriptionExternalId) {
      return {
        success: false,
        message: "A assinatura não está vinculada ao Pagar.me.",
      };
    }

    const subscriptionItem = await resolvePagarmeSubscriptionItem({
      subscriptionExternalId: preview.subscriptionExternalId,
    });

    if (!subscriptionItem) {
      return {
        success: false,
        message: "Não foi possível identificar o item recorrente da assinatura.",
      };
    }

    await updatePagarmeSubscriptionItem({
      subscriptionId: preview.subscriptionExternalId,

      itemId: subscriptionItem.id,

      name: preview.newPlan.name,

      description: `Assinatura do plano ${preview.newPlan.name}`,

      price: preview.newPlan.price,

      quantity: 1,

      status: "active",
    });

    const admin = createAdminClient();

    const { data: updatedSubscription, error: updateError } = await admin
      .from("subscriptions")
      .update({
        pending_plan_id: preview.newPlan.id,
        pending_change_type: "downgrade",
        pending_change_at: preview.currentPeriodEnd,
      })
      .eq("id", preview.subscriptionId)
      .eq("user_id", user.id)
      .eq("plan_id", preview.currentPlan.id)
      .eq("status", "active")
      .select("id")
      .maybeSingle();

    if (updateError || !updatedSubscription) {
      console.error("[SCHEDULE_PLAN_DOWNGRADE_DATABASE_ERROR]", updateError);

      return {
        success: false,
        message: "O valor futuro foi atualizado, mas não foi possível registrar o downgrade.",
      };
    }

    revalidatePath("/assinatura");
    revalidatePath("/perfil");

    return {
      success: true,

      subscriptionId: preview.subscriptionId,

      previousPlanId: preview.currentPlan.id,

      targetPlanId: preview.newPlan.id,

      scheduledAt: preview.currentPeriodEnd,
    };
  } catch (error) {
    console.error("[SCHEDULE_PLAN_DOWNGRADE_ERROR]", error);

    return {
      success: false,
      message: "Não foi possível agendar o downgrade. Tente novamente.",
    };
  }
}

export async function executePlanUpgrade(targetPlanId: string): Promise<ExecutePlanUpgradeResult> {
  try {
    if (!targetPlanId) {
      return {
        success: false,
        message: "O plano de destino é obrigatório.",
      };
    }

    const supabase = await createClient();

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      return {
        success: false,
        message: "Você precisa estar logado para alterar o plano.",
      };
    }

    /*
     * O preview é recalculado no servidor no momento
     * da confirmação. Não confiamos no valor exibido
     * anteriormente no navegador.
     */
    const preview = await getPlanUpgradePreview(targetPlanId);

    if (!preview.subscriptionExternalId) {
      return {
        success: false,
        message: "A assinatura atual não possui vínculo com a Pagar.me.",
      };
    }

    const supabaseAdmin = createAdminClient();

    const { data: currentSubscription, error: subscriptionError } = await supabaseAdmin
      .from("subscriptions")
      .select(
        `
          id,
          external_id,
          plan_id,
          status,
          payment_card_id,
          current_period_start,
          current_period_end,
          cancel_at_period_end
        `
      )
      .eq("id", preview.subscriptionId)
      .eq("user_id", user.id)
      .maybeSingle();

    if (subscriptionError || !currentSubscription) {
      console.error("[EXECUTE_PLAN_UPGRADE_SUBSCRIPTION_ERROR]", subscriptionError);

      return {
        success: false,
        message: "Não foi possível carregar sua assinatura atual.",
      };
    }

    if (currentSubscription.plan_id !== preview.currentPlan.id) {
      return {
        success: false,
        message: "Seu plano atual foi alterado. Atualize a página antes de tentar novamente.",
      };
    }

    if (currentSubscription.status !== "active" && currentSubscription.status !== "trial") {
      return {
        success: false,
        message: "Sua assinatura atual não permite upgrade.",
      };
    }

    if (currentSubscription.cancel_at_period_end) {
      return {
        success: false,
        message: "Cancele o encerramento agendado antes de alterar o plano.",
      };
    }

    if (!currentSubscription.current_period_start || !currentSubscription.current_period_end) {
      return {
        success: false,
        message: "O ciclo atual da assinatura não está disponível.",
      };
    }

    const paymentContext = await resolvePlanUpgradePaymentContext({
      userId: user.id,

      subscriptionExternalId: preview.subscriptionExternalId,

      paymentCardId: currentSubscription.payment_card_id,
    });

    const subscriptionItem = await resolvePagarmeSubscriptionItem({
      subscriptionExternalId: preview.subscriptionExternalId,
    });

    if (!subscriptionItem) {
      return {
        success: false,
        message: "Não foi possível identificar o item recorrente da assinatura.",
      };
    }

    const paymentReservation = await reservePlanUpgradePayment({
      userId: user.id,

      subscriptionId: preview.subscriptionId,

      currentPlanId: preview.currentPlan.id,

      targetPlanId: preview.newPlan.id,

      paymentCardId: paymentContext.localPaymentCardId,

      proratedAmount: preview.proratedAmount,

      additionalCredits: preview.additionalCredits,

      currentPeriodStart: preview.currentPeriodStart,

      currentPeriodEnd: preview.currentPeriodEnd,
    });

    const reservedProratedAmount = paymentReservation.amount;

    const reservedAdditionalCredits = paymentReservation.credits_amount;

    if (!reservedAdditionalCredits || reservedAdditionalCredits <= 0) {
      return {
        success: false,
        message: "A reserva do upgrade não possui uma quantidade válida de créditos.",
      };
    }

    const order = await createOrRecoverPlanUpgradeOrder({
      paymentId: paymentReservation.id,

      idempotencyKey: paymentReservation.idempotency_key,

      pagarmeCustomerId: paymentContext.pagarmeCustomerId,

      pagarmeCardId: paymentContext.pagarmeCardId,

      currentPlanId: preview.currentPlan.id,

      targetPlanId: preview.newPlan.id,

      proratedAmount: reservedProratedAmount,

      currentPeriodStart: preview.currentPeriodStart,

      currentPeriodEnd: preview.currentPeriodEnd,
    });

    const paymentResult = getPagarmeOrderPaymentResult(order);

    await updatePlanUpgradePaymentResult({
      paymentId: paymentReservation.id,

      orderId: order.id,
      orderStatus: paymentResult.status,

      chargeId: paymentResult.chargeId,

      paidAt: paymentResult.paidAt,

      isPaid: paymentResult.isPaid,
    });

    if (!paymentResult.isPaid) {
      const isPending = paymentResult.status === "pending" || paymentResult.status === "processing";

      return {
        success: false,

        message: isPending
          ? "O pagamento ainda está sendo processado. Aguarde alguns instantes antes de tentar novamente."
          : "Não foi possível aprovar a cobrança proporcional no cartão da assinatura.",
      };
    }

    /*
     * A cobrança foi aprovada. Agora alteramos o
     * valor das próximas renovações na Pagar.me.
     */
    await updatePagarmeSubscriptionItem({
      subscriptionId: preview.subscriptionExternalId,

      itemId: subscriptionItem.id,

      name: preview.newPlan.name,

      description: `Assinatura do plano ${preview.newPlan.name}`,

      price: preview.newPlan.price,
      quantity: 1,
    });

    /*
     * Somente após cobrança aprovada e recorrência
     * atualizada alteramos o banco local e liberamos
     * a diferença de créditos.
     */
    const databaseResult = await finalizePlanUpgradeInDatabase({
      userId: user.id,

      subscriptionId: preview.subscriptionId,

      paymentId: paymentReservation.id,

      currentPlanId: preview.currentPlan.id,

      targetPlanId: preview.newPlan.id,

      proratedAmount: reservedProratedAmount,

      additionalCredits: reservedAdditionalCredits,

      orderId: order.id,

      orderStatus: paymentResult.status,

      chargeId: paymentResult.chargeId,

      paidAt: paymentResult.paidAt,

      subscriptionItemId: subscriptionItem.id,

      currentPeriodStart: preview.currentPeriodStart,

      currentPeriodEnd: preview.currentPeriodEnd,
    });

    revalidatePath("/assinatura");
    revalidatePath("/perfil");

    return {
      success: true,

      alreadyProcessed: databaseResult.already_processed,

      paymentId: paymentReservation.id,

      orderId: order.id,

      previousPlanId: preview.currentPlan.id,

      targetPlanId: preview.newPlan.id,

      additionalCredits: reservedAdditionalCredits,

      proratedAmount: reservedProratedAmount,
    };
  } catch (error) {
    console.error("[EXECUTE_PLAN_UPGRADE_ERROR]", error);

    return {
      success: false,

      message:
        error instanceof Error ? error.message : "Não foi possível concluir a alteração do plano.",
    };
  }
}
