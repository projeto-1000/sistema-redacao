import type {
  HistoryDisplayItem,
  SubscriptionHistoryCreditEvent,
  SubscriptionHistoryEvent,
  SubscriptionHistoryPaymentEvent,
} from "@repo/types";
import { formatCurrency } from "./format-currency";

function getMetadataString(
  metadata: Record<string, unknown> | null,
  key: string,
): string | null {
  const value = metadata?.[key];

  return typeof value === "string" && value.trim() ? value : null;
}

function formatCreditsAmount(amount: number, showPositiveSign = false): string {
  const absoluteAmount = Math.abs(amount);
  const label = absoluteAmount === 1 ? "crédito" : "créditos";

  if (amount < 0) {
    return `-${absoluteAmount} ${label}`;
  }

  if (showPositiveSign) {
    return `+${absoluteAmount} ${label}`;
  }

  return `${absoluteAmount} ${label}`;
}

function getCreditSourceDescription(
  metadata: Record<string, unknown> | null,
): string {
  const creditType = getMetadataString(metadata, "credit_type");

  const creditSource = getMetadataString(metadata, "credit_source");

  if (creditType === "free" || creditSource === "free_trial") {
    return "crédito gratuito";
  }

  if (creditType === "extra" || creditSource === "extra") {
    return "crédito adicional";
  }

  if (creditType === "mentorship" || creditSource === "mentorship") {
    return "crédito da mentoria";
  }

  if (creditType === "plan" || creditSource === "plan") {
    return "crédito do plano";
  }

  return "crédito disponível";
}

function getEssayUsageDescription(
  event: SubscriptionHistoryCreditEvent,
): string {
  const creditSource = getCreditSourceDescription(event.metadata);

  const essayTitle = getMetadataString(event.metadata, "title");

  if (essayTitle) {
    return `${creditSource[0]?.toUpperCase()}${creditSource.slice(
      1,
    )} utilizado na redação “${essayTitle}”.`;
  }

  return `${creditSource[0]?.toUpperCase()}${creditSource.slice(
    1,
  )} utilizado no envio da redação.`;
}

function getExpirationDescription(
  event: SubscriptionHistoryCreditEvent,
): string {
  const source = getMetadataString(event.metadata, "source");
  const eventType = getMetadataString(event.metadata, "event_type");
  const grantType = getMetadataString(event.metadata, "grant_type");
  const expirationReason = getMetadataString(
    event.metadata,
    "expiration_reason",
  );

  const absoluteAmount = Math.abs(event.amount);
  const isSingular = absoluteAmount === 1;

  const subject = isSingular ? "1 crédito" : `${absoluteAmount} créditos`;

  const expiredVerb = isSingular ? "expirou" : "expiraram";

  const isCancellation =
    source === "scheduled_subscription_cancellation" ||
    eventType === "subscription.canceled" ||
    expirationReason === "subscription_cancellation" ||
    expirationReason === "cancellation";

  if (isCancellation) {
    return `${subject} do plano ${expiredVerb} após o encerramento da assinatura.`;
  }

  const isCycleExpiration =
    grantType === "subscription_cycle_expiration" ||
    expirationReason === "cycle_end";

  if (isCycleExpiration) {
    const unusedLabel = isSingular ? "não utilizado" : "não utilizados";

    return `${subject} ${unusedLabel} ${expiredVerb} ao final do ciclo anterior.`;
  }

  if (
    event.transaction_type === "free_credit_expiration" ||
    expirationReason === "free_credit_expiration"
  ) {
    const freeLabel = isSingular ? "gratuito" : "gratuitos";

    return `${subject} ${freeLabel} ${expiredVerb} após o prazo de utilização.`;
  }

  if (
    event.transaction_type === "mentorship_expiration" ||
    expirationReason === "mentorship_expiration"
  ) {
    return `${subject} da mentoria ${expiredVerb} após o encerramento do benefício.`;
  }

  return (
    event.description ||
    `${subject} ${expiredVerb} após o fim do período de validade.`
  );
}

function mapCreditEvent(
  event: SubscriptionHistoryCreditEvent,
): HistoryDisplayItem {
  const planName = getMetadataString(event.metadata, "plan_name");

  switch (event.transaction_type) {
    case "free_trial_grant":
      return {
        id: event.id,
        title: "Crédito gratuito",
        description: "Benefício de boas-vindas para conhecer a plataforma.",
        createdAt: event.created_at,
        primaryValue: formatCreditsAmount(event.amount, true),
        secondaryValue: null,
        category: "credit_grant",
        valueTone: "positive",
      };

    case "new_subscription":
      return {
        id: event.id,
        title: "Créditos liberados pela assinatura",
        description: planName
          ? `Créditos referentes à contratação do plano ${planName}.`
          : "Créditos referentes à contratação da assinatura.",
        createdAt: event.created_at,
        primaryValue: formatCreditsAmount(event.amount, true),
        secondaryValue: null,
        category: "credit_grant",
        valueTone: "positive",
      };

    case "plan_renewal":
      return {
        id: event.id,
        title: "Créditos liberados pela renovação",
        description: planName
          ? `Créditos referentes ao novo ciclo do plano ${planName}.`
          : "Créditos referentes ao novo ciclo da assinatura.",
        createdAt: event.created_at,
        primaryValue: formatCreditsAmount(event.amount, true),
        secondaryValue: null,
        category: "credit_grant",
        valueTone: "positive",
      };

    case "subscription_reactivation":
      return {
        id: event.id,
        title: "Créditos liberados pela reativação",
        description: "Créditos referentes à reativação da assinatura.",
        createdAt: event.created_at,
        primaryValue: formatCreditsAmount(event.amount, true),
        secondaryValue: null,
        category: "credit_grant",
        valueTone: "positive",
      };

    case "plan_change":
      return {
        id: event.id,
        title: "Créditos liberados pela mudança de plano",
        description: planName
          ? `Créditos adicionais referentes ao plano ${planName}.`
          : "Créditos adicionais referentes à mudança de plano.",
        createdAt: event.created_at,
        primaryValue: formatCreditsAmount(event.amount, true),
        secondaryValue: null,
        category: "credit_grant",
        valueTone: "positive",
      };

    case "standalone_purchase":
      return {
        id: event.id,
        title: "Compra de créditos adicionais",
        description: "Créditos adquiridos separadamente da assinatura.",
        createdAt: event.created_at,
        primaryValue: formatCreditsAmount(event.amount, true),
        secondaryValue: null,
        category: "credit_grant",
        valueTone: "positive",
      };

    case "mentorship_bonus":
      return {
        id: event.id,
        title: "Créditos da mentoria",
        description: "Benefício de correção incluído na mentoria.",
        createdAt: event.created_at,
        primaryValue: formatCreditsAmount(event.amount, true),
        secondaryValue: null,
        category: "credit_grant",
        valueTone: "positive",
      };

    case "essay_usage":
      return {
        id: event.id,
        title: "Envio de redação",
        description: getEssayUsageDescription(event),
        createdAt: event.created_at,
        primaryValue: formatCreditsAmount(event.amount),
        secondaryValue: null,
        category: "credit_usage",
        valueTone: "negative",
      };

    case "essay_refund":
      return {
        id: event.id,
        title: "Crédito devolvido",
        description:
          event.description ||
          "Crédito devolvido após o cancelamento do envio da redação.",
        createdAt: event.created_at,
        primaryValue: formatCreditsAmount(event.amount, true),
        secondaryValue: null,
        category: "refund",
        valueTone: "positive",
      };

    case "plan_expiration":
    case "free_credit_expiration":
    case "mentorship_expiration":
      return {
        id: event.id,
        title: "Créditos expirados",
        description: getExpirationDescription(event),
        createdAt: event.created_at,
        primaryValue: formatCreditsAmount(event.amount),
        secondaryValue: null,
        category: "credit_expiration",
        valueTone: "negative",
      };

    case "administrative_adjustment":
      if (getMetadataString(event.metadata, "source") === "admin_support") {
        const refundAmount = event.metadata?.refund_amount;
        return {
          id: event.id, title: event.description || "Atendimento da assinatura",
          description: "Ação realizada pelo suporte a pedido do aluno.", createdAt: event.created_at,
          primaryValue: typeof refundAmount === "number" && refundAmount > 0 ? formatCurrency(refundAmount) : event.amount === 0 ? "Registro de atendimento" : formatCreditsAmount(event.amount),
          secondaryValue: null, category: "adjustment", valueTone: "neutral",
          details: {
            label: "Ver detalhes do atendimento", title: event.description || "Atendimento da assinatura",
            description: "O suporte registrou esta ação no histórico da assinatura.",
            reasonLabel: "Motivo informado pelo suporte",
            reason: getMetadataString(event.metadata, "reason") || "Não informado", occurredAt: event.created_at,
          },
        };
      }
      if (
        getMetadataString(event.metadata, "adjustment_kind") ===
        "withdrawal_hold"
      ) {
        return {
          id: event.id,
          title: "Créditos reservados durante a análise",
          description:
            "Os créditos do plano ficaram temporariamente indisponíveis enquanto o pedido de cancelamento era analisado.",
          createdAt: event.created_at,
          primaryValue: formatCreditsAmount(event.amount),
          secondaryValue: null,
          category: "adjustment",
          valueTone: "neutral",
        };
      }

      if (
        getMetadataString(event.metadata, "adjustment_kind") ===
        "withdrawal_hold_release"
      ) {
        const reviewReason = getMetadataString(
          event.metadata,
          "withdrawal_review_reason"
        );
        const reviewedAt = getMetadataString(
          event.metadata,
          "withdrawal_reviewed_at"
        );

        return {
          id: event.id,
          title: "Pedido de cancelamento não aprovado",
          description:
            "A assinatura continua ativa e os créditos do plano voltaram a ficar disponíveis.",
          createdAt: event.created_at,
          primaryValue: formatCreditsAmount(event.amount, true),
          secondaryValue: null,
          category: "adjustment",
          valueTone: "positive",
          details: reviewReason
            ? {
                label: "Ver detalhes da decisão",
                title: "Decisão sobre o pedido de cancelamento",
                description:
                  "A solicitação foi analisada pela equipe e não pôde ser aprovada.",
                reasonLabel: "Motivo informado pela equipe",
                reason: reviewReason,
                occurredAt: reviewedAt,
              }
            : undefined,
        };
      }

      return {
        id: event.id,
        title: "Ajuste de créditos",
        description:
          event.description ||
          "Movimentação realizada pela equipe da plataforma.",
        createdAt: event.created_at,
        primaryValue: formatCreditsAmount(event.amount, event.amount > 0),
        secondaryValue: null,
        category: "adjustment",
        valueTone: event.amount > 0 ? "positive" : "neutral",
      };
  }
}

function getPaymentMethodLabel(paymentMethod: string | null): string {
  switch (paymentMethod) {
    case "credit_card":
      return "cartão de crédito";

    case "pix":
      return "Pix";

    case "boleto":
      return "boleto";

    default:
      return "método de pagamento informado";
  }
}

function mapPaymentEvent(
  event: SubscriptionHistoryPaymentEvent,
): HistoryDisplayItem {
  const normalizedStatus = event.status.toLowerCase();

  const paymentMethod = getPaymentMethodLabel(event.payment_method);

  const isApproved = ["active", "paid", "approved", "succeeded"].includes(
    normalizedStatus,
  );

  const isFailed = [
    "failed",
    "payment_failed",
    "refused",
    "declined",
    "unpaid",
  ].includes(normalizedStatus);

  let description = `Pagamento realizado via ${paymentMethod}.`;
  let valueTone: HistoryDisplayItem["valueTone"] = "neutral";

  if (isApproved) {
    description = `Pagamento aprovado via ${paymentMethod}.`;
  } else if (isFailed) {
    description = `Pagamento não aprovado via ${paymentMethod}.`;
    valueTone = "warning";
  } else if (normalizedStatus === "pending") {
    description = `Pagamento via ${paymentMethod} em processamento.`;
    valueTone = "warning";
  } else if (normalizedStatus === "refunded") {
    description = `Pagamento via ${paymentMethod} estornado.`;
  } else if (normalizedStatus === "canceled") {
    description = `Pagamento via ${paymentMethod} cancelado.`;
  }

  return {
    id: event.id,
    title: event.plan_name
      ? `Cobrança do plano ${event.plan_name}`
      : "Cobrança da assinatura",
    description,
    createdAt: event.paid_at ?? event.created_at,
    primaryValue: formatCurrency(event.amount_in_cents),
    secondaryValue: null,
    category: "payment",
    valueTone,
  };
}

export function mapSubscriptionHistoryItem(
  event: SubscriptionHistoryEvent,
): HistoryDisplayItem {
  if (event.kind === "payment") {
    return mapPaymentEvent(event);
  }

  return mapCreditEvent(event);
}
