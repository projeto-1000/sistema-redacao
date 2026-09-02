import type { PagarmeOrder } from "@repo/payments";
import type { ExtraCreditPurchaseStatus } from "@repo/types";

const PENDING_STATUSES = new Set(["pending", "processing"]);
const FAILED_STATUSES = new Set(["failed", "canceled", "cancelled", "not_authorized", "refused"]);

export function buildExtraCreditPurchaseReferences(operationId: string) {
  const compactOperationId = operationId.replaceAll("-", "");

  return {
    orderCode: `extra-credit-${compactOperationId}`,
    idempotencyKey: `extra-credit-purchase:${operationId}`,
    cardIdempotencyKey: `extra-credit-card:${operationId}`,
  };
}

export function buildExtraCreditPurchaseMetadata({
  userId,
  packageId,
  creditsAmount,
  paymentId,
}: {
  userId: string;
  packageId: string;
  creditsAmount: number;
  paymentId: string;
}) {
  return {
    source: "extra_credit_purchase",
    user_id: userId,
    extra_credit_package_id: packageId,
    credits_amount: String(creditsAmount),
    local_payment_id: paymentId,
  };
}

export interface ExtraCreditOrderDecision {
  localStatus: Exclude<ExtraCreditPurchaseStatus, "processing">;
  providerStatus: string;
  chargeId: string;
  paidAt: string | null;
}

export function canTransitionExtraCreditPaymentStatus({
  currentStatus,
  nextStatus,
}: {
  currentStatus: string;
  nextStatus: ExtraCreditOrderDecision["localStatus"];
}) {
  return currentStatus !== "paid" || nextStatus === "paid";
}

export function evaluateExtraCreditOrder({
  order,
  expectedAmount,
  expectedCode,
  expectedMetadata,
}: {
  order: PagarmeOrder;
  expectedAmount: number;
  expectedCode: string;
  expectedMetadata: Record<string, string>;
}): ExtraCreditOrderDecision {
  if (!/^or_[A-Za-z0-9]+$/.test(order.id)) {
    throw new Error("A Pagar.me retornou um identificador de pedido inválido.");
  }

  if (order.code && order.code !== expectedCode) {
    throw new Error("O pedido retornado não corresponde à operação local.");
  }

  if (
    !order.metadata ||
    Object.entries(expectedMetadata).some(([key, value]) => order.metadata?.[key] !== value)
  ) {
    throw new Error("Os metadados do pedido não correspondem à operação local.");
  }

  if (!Number.isInteger(order.amount) || order.amount !== expectedAmount) {
    throw new Error("O valor do pedido retornado não corresponde ao pacote selecionado.");
  }

  if (!order.charges || order.charges.length !== 1) {
    throw new Error("O pedido retornado não possui exatamente uma cobrança.");
  }

  const [charge] = order.charges;

  if (!charge || !/^ch_[A-Za-z0-9]+$/.test(charge.id)) {
    throw new Error("A Pagar.me retornou uma cobrança inválida.");
  }

  if (!Number.isInteger(charge.amount) || charge.amount !== expectedAmount) {
    throw new Error("O valor da cobrança não corresponde ao pacote selecionado.");
  }

  if (charge.payment_method && charge.payment_method !== "credit_card") {
    throw new Error("O meio de pagamento retornado não corresponde ao solicitado.");
  }

  const orderStatus = order.status.toLowerCase();
  const chargeStatus = charge.status.toLowerCase();
  const orderPaid = orderStatus === "paid";
  const chargePaid = chargeStatus === "paid";

  if (orderPaid !== chargePaid) {
    throw new Error("O pedido e a cobrança retornaram estados financeiros divergentes.");
  }

  if (orderPaid && chargePaid) {
    if (charge.paid_amount !== undefined && charge.paid_amount !== expectedAmount) {
      throw new Error("O valor pago não corresponde ao pacote selecionado.");
    }

    if (!charge.paid_at || Number.isNaN(Date.parse(charge.paid_at))) {
      throw new Error("A cobrança paga não possui uma data de pagamento válida.");
    }

    return {
      localStatus: "paid",
      providerStatus: chargeStatus,
      chargeId: charge.id,
      paidAt: charge.paid_at,
    };
  }

  if (FAILED_STATUSES.has(orderStatus) || FAILED_STATUSES.has(chargeStatus)) {
    return {
      localStatus: "failed",
      providerStatus: chargeStatus,
      chargeId: charge.id,
      paidAt: null,
    };
  }

  if (PENDING_STATUSES.has(orderStatus) && PENDING_STATUSES.has(chargeStatus)) {
    return {
      localStatus: "pending",
      providerStatus: chargeStatus,
      chargeId: charge.id,
      paidAt: null,
    };
  }

  throw new Error("A Pagar.me retornou um estado de pagamento não reconhecido.");
}
