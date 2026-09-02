import "server-only";

import { createAdminClient } from "@/lib/admin";
import { canTransitionExtraCreditPaymentStatus, type ExtraCreditOrderDecision } from "./policy";

export interface ExtraCreditPurchaseReservation {
  id: string;
  user_id: string;
  subscription_id: string | null;
  payment_card_id: string | null;
  external_id: string | null;
  amount: number;
  credits_amount: number | null;
  status: string;
  idempotency_key: string | null;
  metadata: Record<string, unknown> | null;
}

interface ReserveExtraCreditPurchaseParams {
  operationId: string;
  userId: string;
  subscriptionId: string;
  packageId: string;
  packageName: string;
  amount: number;
  creditsAmount: number;
  paymentSource: "saved_card" | "new_card";
  paymentCardId: string | null;
  orderCode: string;
  idempotencyKey: string;
}

const RESERVATION_COLUMNS = `
  id,
  user_id,
  subscription_id,
  payment_card_id,
  external_id,
  amount,
  credits_amount,
  status,
  idempotency_key,
  metadata
`;

export async function reserveExtraCreditPurchase({
  operationId,
  userId,
  subscriptionId,
  packageId,
  packageName,
  amount,
  creditsAmount,
  paymentSource,
  paymentCardId,
  orderCode,
  idempotencyKey,
}: ReserveExtraCreditPurchaseParams): Promise<ExtraCreditPurchaseReservation> {
  const supabaseAdmin = createAdminClient();
  const { data: createdPayment, error: createPaymentError } = await supabaseAdmin
    .from("student_payments")
    .insert({
      id: operationId,
      user_id: userId,
      subscription_id: subscriptionId,
      plan_id: null,
      payment_card_id: paymentCardId,
      kind: "extra_credits",
      provider: "pagarme",
      external_id: null,
      amount,
      credits_amount: creditsAmount,
      status: "processing",
      payment_method: "credit_card",
      paid_at: null,
      idempotency_key: idempotencyKey,
      metadata: {
        source: "extra_credit_purchase",
        extra_credit_package_id: packageId,
        package_name: packageName,
        price_cents: amount,
        credits_amount: creditsAmount,
        payment_source: paymentSource,
        pagarme_order_code: orderCode,
        operation_created_at: new Date().toISOString(),
      },
    })
    .select(RESERVATION_COLUMNS)
    .single();

  if (!createPaymentError && createdPayment) {
    return createdPayment as ExtraCreditPurchaseReservation;
  }

  if (createPaymentError?.code !== "23505") {
    console.error("[EXTRA_CREDIT_PAYMENT_RESERVATION_ERROR]", createPaymentError);
    throw new Error("Não foi possível iniciar a compra de créditos extras.");
  }

  const { data: existingPayment, error: existingPaymentError } = await supabaseAdmin
    .from("student_payments")
    .select(RESERVATION_COLUMNS)
    .eq("idempotency_key", idempotencyKey)
    .maybeSingle();

  if (existingPaymentError || !existingPayment) {
    console.error("[EXTRA_CREDIT_PAYMENT_RECOVERY_ERROR]", existingPaymentError);
    throw new Error("Não foi possível recuperar a compra de créditos extras.");
  }

  const reservation = existingPayment as ExtraCreditPurchaseReservation;

  if (
    reservation.id !== operationId ||
    reservation.user_id !== userId ||
    reservation.subscription_id !== subscriptionId ||
    reservation.amount !== amount ||
    reservation.credits_amount !== creditsAmount ||
    reservation.idempotency_key !== idempotencyKey ||
    reservation.metadata?.source !== "extra_credit_purchase" ||
    reservation.metadata?.extra_credit_package_id !== packageId ||
    reservation.metadata?.payment_source !== paymentSource ||
    reservation.metadata?.pagarme_order_code !== orderCode
  ) {
    throw new Error("A operação informada pertence a outra compra.");
  }

  if (
    paymentCardId &&
    reservation.payment_card_id &&
    reservation.payment_card_id !== paymentCardId
  ) {
    throw new Error("A operação informada utiliza outro cartão.");
  }

  return reservation;
}

export async function attachPaymentCardToExtraCreditPurchase({
  paymentId,
  userId,
  paymentCardId,
}: {
  paymentId: string;
  userId: string;
  paymentCardId: string;
}) {
  const supabaseAdmin = createAdminClient();
  const { data, error } = await supabaseAdmin
    .from("student_payments")
    .update({
      payment_card_id: paymentCardId,
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentId)
    .eq("user_id", userId)
    .eq("kind", "extra_credits")
    .in("status", ["processing", "pending"])
    .select("id")
    .maybeSingle();

  if (error || !data) {
    console.error("[EXTRA_CREDIT_PAYMENT_CARD_LINK_ERROR]", error);
    throw new Error("Não foi possível vincular o cartão à compra.");
  }
}

export async function recordExtraCreditOrderResult({
  paymentId,
  userId,
  orderId,
  orderStatus,
  decision,
}: {
  paymentId: string;
  userId: string;
  orderId: string;
  orderStatus: string;
  decision: ExtraCreditOrderDecision;
}) {
  if (!/^or_[A-Za-z0-9]+$/.test(orderId)) {
    throw new Error("O identificador do pedido é inválido.");
  }

  const supabaseAdmin = createAdminClient();
  const { data: payment, error: paymentError } = await supabaseAdmin
    .from("student_payments")
    .select("status, external_id, metadata")
    .eq("id", paymentId)
    .eq("user_id", userId)
    .eq("kind", "extra_credits")
    .maybeSingle();

  if (paymentError || !payment) {
    console.error("[EXTRA_CREDIT_PAYMENT_RESULT_LOOKUP_ERROR]", paymentError);
    throw new Error("Não foi possível recuperar a compra para registrar o resultado.");
  }

  if (payment.external_id && payment.external_id !== orderId) {
    throw new Error("A compra local já está vinculada a outro pedido.");
  }

  if (
    !canTransitionExtraCreditPaymentStatus({
      currentStatus: payment.status,
      nextStatus: decision.localStatus,
    })
  ) {
    if (payment.external_id === orderId) {
      return {
        status: payment.status,
        externalId: payment.external_id,
      };
    }

    throw new Error("Uma compra já paga não pode ser rebaixada para outro status.");
  }

  const currentMetadata =
    payment.metadata && typeof payment.metadata === "object" && !Array.isArray(payment.metadata)
      ? payment.metadata
      : {};

  let updateQuery = supabaseAdmin
    .from("student_payments")
    .update({
      external_id: orderId,
      status: decision.localStatus,
      paid_at: decision.localStatus === "paid" ? decision.paidAt : null,
      metadata: {
        ...currentMetadata,
        pagarme_order_id: orderId,
        pagarme_order_status: orderStatus,
        pagarme_charge_id: decision.chargeId,
        pagarme_charge_status: decision.providerStatus,
        payment_processed_at: new Date().toISOString(),
      },
      updated_at: new Date().toISOString(),
    })
    .eq("id", paymentId)
    .eq("user_id", userId)
    .eq("kind", "extra_credits")
    .or(`external_id.is.null,external_id.eq.${orderId}`);

  if (decision.localStatus !== "paid") {
    updateQuery = updateQuery.neq("status", "paid");
  }

  const { data: updatedPayment, error: updateError } = await updateQuery
    .select("id, status, external_id")
    .maybeSingle();

  if (updateError) {
    console.error("[EXTRA_CREDIT_PAYMENT_RESULT_UPDATE_ERROR]", updateError);
    throw new Error("O pagamento foi processado, mas o resultado local não pôde ser salvo.");
  }

  if (updatedPayment) {
    return {
      status: updatedPayment.status,
      externalId: updatedPayment.external_id,
    };
  }

  const { data: convergedPayment, error: convergedPaymentError } = await supabaseAdmin
    .from("student_payments")
    .select("status, external_id")
    .eq("id", paymentId)
    .eq("user_id", userId)
    .eq("kind", "extra_credits")
    .maybeSingle();

  if (convergedPaymentError || !convergedPayment) {
    console.error("[EXTRA_CREDIT_PAYMENT_RESULT_CONVERGENCE_LOOKUP_ERROR]", convergedPaymentError);
    throw new Error("Não foi possível confirmar o resultado concorrente do pagamento.");
  }

  if (convergedPayment.external_id && convergedPayment.external_id !== orderId) {
    throw new Error("A compra local foi vinculada concorrentemente a outro pedido.");
  }

  if (convergedPayment.status === "paid" && convergedPayment.external_id === orderId) {
    return {
      status: convergedPayment.status,
      externalId: convergedPayment.external_id,
    };
  }

  throw new Error("A compra foi alterada concorrentemente e não convergiu para o pagamento.");
}
