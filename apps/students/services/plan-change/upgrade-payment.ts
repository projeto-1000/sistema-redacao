import { createAdminClient } from "@/lib/admin";

import { randomUUID } from "node:crypto";

import { createPagarmeOrder, findPagarmeOrderByCode, type PagarmeOrder } from "@repo/payments";

export interface PlanUpgradePaymentReservation {
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

export async function reservePlanUpgradePayment({
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

export async function createOrRecoverPlanUpgradeOrder({
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

export async function updatePlanUpgradePaymentResult({
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

export async function finalizePlanUpgradeInDatabase({
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
