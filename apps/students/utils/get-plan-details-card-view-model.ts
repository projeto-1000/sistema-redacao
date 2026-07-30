import { statusBadgeConfig } from "@repo/constants";
import type { StudentSubscription, SubscriptionStatus } from "@repo/types";
import { formatCurrency, formatDate } from "@repo/utils";

interface GetPlanDetailsCardViewModelParams {
  subscription: StudentSubscription;
  planCredits: number;
}

interface StatusView {
  label: string;
  classes: string;
}

export interface PlanDetailsCardViewModel {
  isCanceled: boolean;
  isCancellationScheduled: boolean;
  isPlanChangeScheduled: boolean;
  hasFinishedFreeTrial: boolean;

  planBadgeLabel: string;
  planTitle: string;

  status: StatusView;

  description: string;

  periodLabel: string;
  periodValue: string;

  actionLabel: string;

  canCancelSubscription: boolean;

  cancellationEffectiveAt: string | null;
}

function getPlanPeriodLabel(subscription: StudentSubscription): string {
  if (subscription.interval === "month") {
    switch (subscription.interval_count) {
      case 1:
        return "Mensal";

      case 3:
        return "Trimestral";

      case 6:
        return "Semestral";

      default:
        return "";
    }
  }

  if (subscription.interval === "year") {
    return "Anual";
  }

  return "";
}

function getRecurringPriceDescription(subscription: StudentSubscription): string {
  const price = formatCurrency(subscription.price);

  if (subscription.interval === "month") {
    switch (subscription.interval_count) {
      case 1:
        return `${price} / mês`;

      case 3:
        return `${price} / trimestre`;

      case 6:
        return `${price} / semestre`;

      default:
        return price;
    }
  }

  if (subscription.interval === "year") {
    return `${price} / ano`;
  }

  return price;
}

function getStatusView({
  subscription,
  isFreeTrial,
  hasFreeCredit,
  isCancellationScheduled,
}: {
  subscription: StudentSubscription;
  isFreeTrial: boolean;
  hasFreeCredit: boolean;
  isCancellationScheduled: boolean;
}): StatusView {
  if (isCancellationScheduled) {
    return {
      label: "Cancelamento agendado",
      classes: "bg-amber-100 text-amber-800",
    };
  }

  if (isFreeTrial) {
    if (hasFreeCredit) {
      return {
        label: "Disponível",
        classes: "bg-emerald-100 text-emerald-700",
      };
    }

    return {
      label: "Concluído",
      classes: "bg-slate-100 text-slate-600",
    };
  }

  return statusBadgeConfig[subscription.status as SubscriptionStatus] ?? statusBadgeConfig.trial;
}

function getDescription({
  subscription,
  isCanceled,
  isCancellationScheduled,
  cancellationEffectiveAt,
  isFreeTrial,
  hasFreeCredit,
  isMentorship,
  isTrial,
  isLifetime,
}: {
  subscription: StudentSubscription;
  isCanceled: boolean;
  isCancellationScheduled: boolean;
  cancellationEffectiveAt: string | null;
  isFreeTrial: boolean;
  hasFreeCredit: boolean;
  isMentorship: boolean;
  isTrial: boolean;
  isLifetime: boolean;
}): string {
  if (isCanceled) {
    return "Sua assinatura foi encerrada. Sua conta continua disponível e você pode assinar novamente quando quiser.";
  }

  if (isCancellationScheduled && cancellationEffectiveAt) {
    return `Seu plano continuará disponível até ${formatDate(
      cancellationEffectiveAt,
      "numeric"
    )}. Depois dessa data, não haverá uma nova cobrança.`;
  }

  if (isFreeTrial) {
    return hasFreeCredit
      ? "Você ganhou uma correção gratuita para conhecer a plataforma."
      : "Seu crédito gratuito já foi utilizado.";
  }

  if (isMentorship) {
    return "Benefício incluído na mentoria";
  }

  if (isTrial) {
    return "Período gratuito";
  }

  if (isLifetime) {
    return "Acesso sem cobrança recorrente";
  }

  return getRecurringPriceDescription(subscription);
}

function getPeriodLabel({
  isCanceled,
  isCancellationScheduled,
  isFreeTrial,
  hasFreeCredit,
  isMentorship,
  isLifetime,
  isTrial,
}: {
  isCanceled: boolean;
  isCancellationScheduled: boolean;
  isFreeTrial: boolean;
  hasFreeCredit: boolean;
  isMentorship: boolean;
  isLifetime: boolean;
  isTrial: boolean;
}): string {
  if (isCanceled) {
    return "Plano encerrado em";
  }

  if (isCancellationScheduled) {
    return "Acesso disponível até";
  }

  if (isFreeTrial) {
    return hasFreeCredit ? "Benefício disponível" : "Teste gratuito";
  }

  if (isMentorship) {
    return "Acesso disponível até";
  }

  if (isLifetime) {
    return "Validade";
  }

  if (isTrial) {
    return "Período gratuito até";
  }

  return "Próxima cobrança";
}

function getPeriodValue({
  subscription,
  isCanceled,
  isCancellationScheduled,
  cancellationEffectiveAt,
  isFreeTrial,
  hasFreeCredit,
  isLifetime,
  isMentorship,
  isTrial,
}: {
  subscription: StudentSubscription;
  isCanceled: boolean;
  isCancellationScheduled: boolean;
  cancellationEffectiveAt: string | null;
  isFreeTrial: boolean;
  hasFreeCredit: boolean;
  isLifetime: boolean;
  isMentorship: boolean;
  isTrial: boolean;
}): string {
  if (isCanceled && cancellationEffectiveAt) {
    return formatDate(cancellationEffectiveAt, "numeric");
  }

  if (isCancellationScheduled && cancellationEffectiveAt) {
    return formatDate(cancellationEffectiveAt, "numeric");
  }

  if (isFreeTrial) {
    return hasFreeCredit ? "1 correção gratuita" : "Correção gratuita utilizada";
  }

  if (isLifetime) {
    return "Acesso vitalício";
  }

  if (isMentorship || isTrial) {
    if (!subscription.current_period_end) {
      return "Data não disponível";
    }

    return formatDate(subscription.current_period_end, "numeric");
  }

  if (!subscription.next_billing_at) {
    return "Data não disponível";
  }

  return formatDate(subscription.next_billing_at, "numeric");
}

function getActionLabel({
  isCanceled,
  isFreeTrial,
  isMentorship,
  hasFinishedFreeTrial,
}: {
  isCanceled: boolean;
  isFreeTrial: boolean;
  isMentorship: boolean;
  hasFinishedFreeTrial: boolean;
}): string {
  if (isCanceled) {
    return "Assinar novamente";
  }

  if (isFreeTrial || isMentorship || hasFinishedFreeTrial) {
    return "Conhecer planos";
  }

  return "Alterar plano";
}

export function getPlanDetailsCardViewModel({
  subscription,
  planCredits,
}: GetPlanDetailsCardViewModelParams): PlanDetailsCardViewModel {
  const isFreeTrial = subscription.plan_external_id === "internal_free_trial";

  const isMentorship = subscription.plan_external_id === "internal_mentoria_free";

  const isLifetime = subscription.interval === "lifetime";

  const isTrial = subscription.status === "trial";

  const isCanceled = subscription.status === "canceled";

  const hasFreeCredit = isFreeTrial && planCredits > 0;

  const hasFinishedFreeTrial = isFreeTrial && planCredits <= 0;

  const isCancellationScheduled = subscription.cancel_at_period_end;

  const isPlanChangeScheduled =
    subscription.pending_change_type === "downgrade" &&
    Boolean(subscription.pending_plan_id) &&
    Boolean(subscription.pending_change_at);

  const cancellationEffectiveAt =
    subscription.cancellation_effective_at ?? subscription.current_period_end ?? null;

  const planPeriodLabel = getPlanPeriodLabel(subscription);

  const shouldShowPlanPeriod =
    !isLifetime && !isMentorship && !isFreeTrial && Boolean(planPeriodLabel);

  const planTitle = shouldShowPlanPeriod
    ? `${subscription.plan_name} • ${planPeriodLabel}`
    : subscription.plan_name;

  const canCancelSubscription =
    subscription.status === "active" &&
    !isLifetime &&
    !isMentorship &&
    !isTrial &&
    !isFreeTrial &&
    !isCancellationScheduled &&
    !isPlanChangeScheduled &&
    Boolean(subscription.current_period_end);

  return {
    isCanceled,
    isCancellationScheduled,
    isPlanChangeScheduled,
    hasFinishedFreeTrial,

    planBadgeLabel: isCanceled ? "Último plano" : "Plano atual",

    planTitle,

    status: getStatusView({
      subscription,
      isFreeTrial,
      hasFreeCredit,
      isCancellationScheduled,
    }),

    description: getDescription({
      subscription,
      isCanceled,
      isCancellationScheduled,
      cancellationEffectiveAt,
      isFreeTrial,
      hasFreeCredit,
      isMentorship,
      isTrial,
      isLifetime,
    }),

    periodLabel: getPeriodLabel({
      isCanceled,
      isCancellationScheduled,
      isFreeTrial,
      hasFreeCredit,
      isMentorship,
      isLifetime,
      isTrial,
    }),

    periodValue: getPeriodValue({
      subscription,
      isCanceled,
      isCancellationScheduled,
      cancellationEffectiveAt,
      isFreeTrial,
      hasFreeCredit,
      isLifetime,
      isMentorship,
      isTrial,
    }),

    actionLabel: getActionLabel({
      isCanceled,
      isFreeTrial,
      isMentorship,
      hasFinishedFreeTrial,
    }),

    canCancelSubscription,

    cancellationEffectiveAt,
  };
}
