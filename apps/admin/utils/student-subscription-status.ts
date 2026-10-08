type SubscriptionState = {
  status: string;
  cancel_at_period_end?: boolean;
  cancellation_mode?: string | null;
  withdrawal_status?: string | null;
};

export function isStudentCancellationScheduled(subscription: SubscriptionState | null) {
  return Boolean(
    subscription &&
    subscription.status !== "canceled" &&
    subscription.cancel_at_period_end &&
    subscription.cancellation_mode === "end_of_period"
  );
}

export const SCHEDULED_CANCELLATION_BADGE = {
  label: "Cancelamento agendado",
  classes: "bg-amber-50 text-amber-700",
};

export function getStudentSubscriptionPeriodView(
  subscription: SubscriptionState & { interval: string },
  periodEnd: string | null,
) {
  if (subscription.status === "canceled") {
    return {
      dateLabel: periodEnd ? `Encerrado em ${periodEnd}` : "Plano encerrado",
      description: "Os benefícios desta assinatura foram encerrados. A conta e o histórico continuam disponíveis.",
      cycleLabel: "Último ciclo",
    };
  }

  if (subscription.withdrawal_status === "refund_processing" || subscription.withdrawal_status === "operational_issue" || subscription.withdrawal_status === "under_review") {
    return {
      dateLabel: periodEnd ? `Período contratado até ${periodEnd}` : "Período não informado",
      description: subscription.withdrawal_status === "under_review"
        ? "Solicitação de cancelamento em análise. Consulte o histórico para conferir os detalhes e a situação dos créditos."
        : "Reembolso aguardando confirmação. Consulte o histórico para conferir os detalhes e a situação dos créditos.",
      cycleLabel: "Ciclo do atendimento",
    };
  }

  if (subscription.cancel_at_period_end) {
    return {
      dateLabel: periodEnd ? `Benefícios disponíveis até ${periodEnd}` : "Data de encerramento não informada",
      description: "Renovação interrompida. Os benefícios do plano permanecem disponíveis até a data de encerramento.",
      cycleLabel: "Ciclo atual",
    };
  }

  if (subscription.status === "past_due" || subscription.status === "unpaid") {
    return {
      dateLabel: periodEnd ? `Período contratado até ${periodEnd}` : "Sem vigência informada",
      description: subscription.status === "unpaid"
        ? "Assinatura bloqueada por falta de pagamento."
        : "Pagamento em atraso. Consulte as cobranças no histórico.",
      cycleLabel: "Ciclo atual",
    };
  }

  return {
    dateLabel: subscription.interval === "lifetime" ? "Sem vencimento"
      : !periodEnd ? "Sem vigência"
      : subscription.status === "trial" ? `Período de teste até ${periodEnd}` : `Renova em ${periodEnd}`,
    description: subscription.status === "active" && subscription.interval !== "lifetime"
      ? "Renovação automática ao fim do período" : null,
    cycleLabel: "Ciclo atual",
  };
}
