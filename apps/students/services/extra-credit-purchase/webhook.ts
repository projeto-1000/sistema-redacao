import "server-only";

import { createAdminClient } from "@/lib/admin";
import type { PagarmeOrder } from "@repo/payments";
import {
  buildExtraCreditPurchaseMetadata,
  buildExtraCreditPurchaseReferences,
  evaluateExtraCreditOrder,
} from "./policy";
import { getExtraCreditPaymentCardLifecycleAction } from "@/services/payments/payment-card-policy";
import {
  deactivatePaymentCardCreatedForOperation,
} from "@/services/payments/payment-cards";

export interface ExtraCreditPaymentForWebhook {
  id: string;
  user_id: string;
  external_id: string | null;
  amount: number;
  credits_amount: number;
  status: string;
  payment_card_id: string | null;
  metadata: Record<string, unknown>;
}

const PAYMENT_COLUMNS = `
  id,
  user_id,
  external_id,
  amount,
  credits_amount,
  status,
  payment_card_id,
  metadata
`;

function isUuid(value: string | undefined): value is string {
  return Boolean(
    value &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  );
}

function assertValidPayment(payment: {
  id: string;
  user_id: string;
  external_id: string | null;
  amount: number;
  credits_amount: number | null;
  status: string;
  payment_card_id: string | null;
  metadata: unknown;
}): ExtraCreditPaymentForWebhook {
  const metadata =
    payment.metadata && typeof payment.metadata === "object" && !Array.isArray(payment.metadata)
      ? (payment.metadata as Record<string, unknown>)
      : null;

  if (
    !Number.isInteger(payment.amount) ||
    payment.amount <= 0 ||
    !Number.isInteger(payment.credits_amount) ||
    !payment.credits_amount ||
    payment.credits_amount <= 0 ||
    !metadata ||
    metadata.source !== "extra_credit_purchase" ||
    !isUuid(
      typeof metadata.extra_credit_package_id === "string"
        ? metadata.extra_credit_package_id
        : undefined
    )
  ) {
    throw new Error("A compra local de créditos extras possui dados inválidos.");
  }

  return {
    ...payment,
    credits_amount: payment.credits_amount,
    metadata,
  };
}

export async function reconcileExtraCreditPaymentCard({
  payment,
  status,
}: {
  payment: ExtraCreditPaymentForWebhook;
  status: "paid" | "failed";
}) {
  if (payment.metadata.payment_source !== "new_card" || !payment.payment_card_id) {
    return;
  }

  const action = getExtraCreditPaymentCardLifecycleAction({
    createdLocally: payment.metadata.payment_card_created_for_operation === true,
    status,
  });

  if (action === "deactivate") {
    await deactivatePaymentCardCreatedForOperation({
      userId: payment.user_id,
      paymentCardId: payment.payment_card_id,
    });
  }
}

export async function resolveExtraCreditPaymentForOrder(order: PagarmeOrder) {
  const supabaseAdmin = createAdminClient();
  const { data: paymentsByOrder, error: orderLookupError } = await supabaseAdmin
    .from("student_payments")
    .select(PAYMENT_COLUMNS)
    .eq("kind", "extra_credits")
    .eq("provider", "pagarme")
    .eq("external_id", order.id)
    .limit(2);

  if (orderLookupError) {
    console.error("[EXTRA_CREDIT_WEBHOOK_ORDER_LOOKUP_ERROR]", orderLookupError);
    throw new Error("Não foi possível localizar a compra pelo pedido.");
  }

  if ((paymentsByOrder?.length ?? 0) > 1) {
    throw new Error("Mais de uma compra local está vinculada ao mesmo pedido.");
  }

  const paymentByOrder = paymentsByOrder?.[0];

  if (paymentByOrder) {
    return assertValidPayment(paymentByOrder);
  }

  const paymentId = order.metadata?.local_payment_id;

  if (!isUuid(paymentId)) {
    throw new Error("O pedido não possui uma referência local válida.");
  }

  const { data: paymentById, error: paymentLookupError } = await supabaseAdmin
    .from("student_payments")
    .select(PAYMENT_COLUMNS)
    .eq("id", paymentId)
    .eq("kind", "extra_credits")
    .eq("provider", "pagarme")
    .maybeSingle();

  if (paymentLookupError || !paymentById) {
    console.error("[EXTRA_CREDIT_WEBHOOK_PAYMENT_LOOKUP_ERROR]", paymentLookupError);
    throw new Error("Não foi possível localizar a compra de créditos extras.");
  }

  return assertValidPayment(paymentById);
}

export function validateExtraCreditOrderForPayment({
  order,
  payment,
}: {
  order: PagarmeOrder;
  payment: ExtraCreditPaymentForWebhook;
}) {
  const packageId = payment.metadata.extra_credit_package_id;

  if (typeof packageId !== "string") {
    throw new Error("A compra local não possui um pacote válido.");
  }

  const references = buildExtraCreditPurchaseReferences(payment.id);
  const expectedMetadata = buildExtraCreditPurchaseMetadata({
    userId: payment.user_id,
    packageId,
    creditsAmount: payment.credits_amount,
    paymentId: payment.id,
  });

  return evaluateExtraCreditOrder({
    order,
    expectedAmount: payment.amount,
    expectedCode: references.orderCode,
    expectedMetadata,
  });
}
