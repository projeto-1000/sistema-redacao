import Link from "next/link";

import { statusBadgeConfig } from "@repo/constants";
import type {
  StudentSubscription,
  SubscriptionStatus,
} from "@repo/types";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  formatCurrency,
  formatDate
} from "@repo/utils";

import { CancelPlanChangeDialog } from "@/components/subscription/cancel-plan-change-dialog";
import { CancelSubscriptionDialog } from "@/components/subscription/cancel-subscription-dialog";

interface PlanDetailsCardProps {
  subscription: StudentSubscription;
  planCredits: number;
}

export function PlanDetailsCard({
  subscription,
  planCredits,
}: PlanDetailsCardProps) {
  const isFreeTrial =
    subscription.plan_external_id ===
    "internal_free_trial";

  const isMentorship =
    subscription.plan_external_id ===
    "internal_mentoria_free";

  const isLifetime =
    subscription.interval === "lifetime";

  const isTrial =
    subscription.status === "trial";

  const isCanceled =
    subscription.status === "canceled";

  const hasFreeCredit =
    isFreeTrial && planCredits > 0;

  const hasFinishedFreeTrial =
    isFreeTrial && planCredits <= 0;

  const isCancellationScheduled =
    subscription.cancel_at_period_end;

  const isPlanChangeScheduled =
    subscription.pending_change_type === "downgrade" &&
    Boolean(subscription.pending_plan_id) &&
    Boolean(subscription.pending_change_at);

  const cancellationEffectiveAt =
    subscription.cancellation_effective_at ??
    subscription.current_period_end;

  const canCancelSubscription =
    subscription.status === "active" &&
    !isLifetime &&
    !isMentorship &&
    !isTrial &&
    !isFreeTrial &&
    !isCancellationScheduled &&
    !isPlanChangeScheduled &&
    Boolean(subscription.current_period_end);

  const defaultStatus =
    statusBadgeConfig[
    subscription.status as SubscriptionStatus
    ] ?? statusBadgeConfig.trial;

  const status = isCancellationScheduled
    ? {
      label: "Cancelamento agendado",
      classes:
        "bg-amber-100 text-amber-800",
    }
    : isFreeTrial
      ? hasFreeCredit
        ? {
          label: "Disponível",
          classes:
            "bg-emerald-100 text-emerald-700",
        }
        : {
          label: "Concluído",
          classes:
            "bg-slate-100 text-slate-600",
        }
      : defaultStatus;

  function getPlanLabel(): string {
    if (subscription.interval === "month") {
      if (subscription.interval_count === 1) {
        return "Mensal";
      }

      if (subscription.interval_count === 3) {
        return "Trimestral";
      }

      if (subscription.interval_count === 6) {
        return "Semestral";
      }
    }

    if (subscription.interval === "year") {
      return "Anual";
    }

    return "";
  }

  function getDescription(): string {
    if (isCanceled) {
      return "Sua assinatura foi encerrada. Sua conta continua disponível e você pode assinar novamente quando quiser.";
    }

    if (isCancellationScheduled) {
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

    const price = formatCurrency(
      subscription.price
    );

    let suffix = "";

    if (subscription.interval === "month") {
      if (subscription.interval_count === 1) {
        suffix = "/ mês";
      }

      if (subscription.interval_count === 3) {
        suffix = "/ trimestre";
      }

      if (subscription.interval_count === 6) {
        suffix = "/ semestre";
      }
    } else if (
      subscription.interval === "year"
    ) {
      suffix = "/ ano";
    }

    return `${price} ${suffix}`.trim();
  }

  function getPeriodLabel(): string {
    if (isCanceled) {
      return "Plano encerrado em";
    }

    if (isCancellationScheduled) {
      return "Acesso disponível até";
    }

    if (isFreeTrial) {
      return hasFreeCredit
        ? "Benefício disponível"
        : "Teste gratuito";
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

  function getPeriodValue(): string {
    if (
      isCanceled &&
      cancellationEffectiveAt
    ) {
      return formatDate(
        cancellationEffectiveAt,
        "numeric"
      );
    }

    if (
      isCancellationScheduled &&
      cancellationEffectiveAt
    ) {
      return formatDate(
        cancellationEffectiveAt,
        "numeric"
      );
    }

    if (isFreeTrial) {
      return hasFreeCredit
        ? "1 correção gratuita"
        : "Correção gratuita utilizada";
    }

    if (isLifetime) {
      return "Acesso vitalício";
    }

    if (!subscription.current_period_end) {
      return "Data não disponível";
    }

    return formatDate(
      subscription.current_period_end,
      "numeric"
    );
  }

  function getActionLabel(): string {
    if (isCanceled) {
      return "Assinar novamente";
    }

    if (
      isFreeTrial ||
      isMentorship ||
      hasFinishedFreeTrial
    ) {
      return "Conhecer planos";
    }

    return "Alterar plano";
  }

  const planLabel = getPlanLabel();

  return (
    <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div>
        <div className="mb-2 flex items-start justify-between gap-3">
          <Badge
            variant="secondary"
            className="border-0 bg-slate-100 text-slate-600 hover:bg-slate-100"
          >
            {isCanceled
              ? "Último plano"
              : "Plano atual"}
          </Badge>

          <div
            className={`rounded-md border-0 px-2 py-1 text-[12px] font-bold uppercase tracking-wider ${status.classes}`}
          >
            {status.label}
          </div>
        </div>

        <h2 className="mb-1 text-3xl font-bold capitalize">
          {subscription.plan_name}

          {!isLifetime &&
            !isMentorship &&
            !isFreeTrial &&
            planLabel &&
            ` • ${planLabel}`}
        </h2>

        <p className="font-medium text-slate-500">
          {getDescription()}
        </p>

        {isPlanChangeScheduled &&
          subscription.pending_change_at && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3">
              <p className="text-sm font-bold text-amber-800">
                Alteração de plano agendada
              </p>

              <p className="mt-1 text-sm leading-relaxed text-amber-700">
                Seu plano será alterado para{" "}
                <strong>
                  {subscription.pending_plan_name ??
                    "o novo plano"}
                </strong>{" "}
                em{" "}
                <strong>
                  {formatDate(
                    subscription.pending_change_at,
                    "numeric"
                  )}
                </strong>
                . Até lá, você continua com o plano{" "}
                <strong>
                  {subscription.plan_name}
                </strong>
                .
              </p>
            </div>
          )}

        {hasFinishedFreeTrial && (
          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
            <p className="text-sm font-bold">
              Continue evoluindo nas suas redações
            </p>

            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Escolha um plano para receber novos
              créditos e continuar enviando redações
              para correção.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <hr className="mb-6 border-slate-100" />

        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
              {getPeriodLabel()}
            </p>

            <p className="text-lg font-bold">
              {getPeriodValue()}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
            {canCancelSubscription &&
              subscription.current_period_end && (
                <CancelSubscriptionDialog
                  planName={
                    subscription.plan_name
                  }
                  effectiveAt={
                    subscription.current_period_end
                  }
                />
              )}

            {isPlanChangeScheduled &&
              subscription.pending_change_at ? (
              <CancelPlanChangeDialog
                currentPlanName={
                  subscription.plan_name
                }
                pendingPlanName={
                  subscription.pending_plan_name ??
                  "novo plano"
                }
                effectiveAt={
                  subscription.pending_change_at
                }
              />
            ) : (
              <Button
                asChild
                className="h-11 w-full rounded-xl font-medium md:w-auto"
              >
                <Link href="/assinatura/planos">
                  {getActionLabel()}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}