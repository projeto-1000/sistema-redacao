import { statusBadgeConfig } from "@repo/constants";
import {
  StudentSubscription,
  SubscriptionStatus,
} from "@repo/types";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import {
  formatCurrency,
  formatDate,
} from "@repo/utils";
import Link from "next/link";

interface PlanDetailsCardProps {
  subscription: StudentSubscription;
}

export function PlanDetailsCard({
  subscription,
}: PlanDetailsCardProps) {
  const normalizedPlanName =
    subscription.plan_name.trim().toLowerCase();

  const isMentorship =
    normalizedPlanName === "mentoria";

  const isLifetime =
    subscription.interval === "lifetime";

  const isTrial =
    subscription.status === "trial";

  const canCancelSubscription =
    !isLifetime && !isMentorship && !isTrial;

  const status =
    statusBadgeConfig[
    subscription.status as SubscriptionStatus
    ] ?? statusBadgeConfig.trial;

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

  function getPrice(): string {
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
    if (isLifetime) {
      return "Validade";
    }

    if (isMentorship) {
      return "Acesso disponível até";
    }

    if (isTrial) {
      return "Período gratuito até";
    }

    return "Próxima cobrança";
  }

  function getPeriodValue(): string {
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

  const planLabel = getPlanLabel();

  return (
    <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div>
        <div className="mb-2 flex items-start justify-between">
          <Badge
            variant="secondary"
            className="border-0 bg-slate-100 text-slate-600 hover:bg-slate-100"
          >
            Plano atual
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
            planLabel &&
            ` • ${planLabel}`}
        </h2>

        <p className="font-medium text-slate-500">
          {getPrice()}
        </p>
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

          <div className="flex w-full gap-3 md:w-auto">
            {canCancelSubscription && (
              <Button
                variant="outline"
                className="h-11 w-full rounded-xl border-slate-300 text-slate-700 md:w-auto"
              >
                Cancelar assinatura
              </Button>
            )}

            <Button
              asChild
              className="h-11 w-full rounded-xl font-medium md:w-auto"
            >
              <Link href="/assinatura/mudar-plano">
                {isMentorship
                  ? "Conhecer planos"
                  : "Alterar plano"}
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}