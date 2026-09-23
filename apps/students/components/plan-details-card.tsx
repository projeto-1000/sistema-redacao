import Link from "next/link";

import type {
  StudentSubscription,
} from "@repo/types";
import { Badge } from "@repo/ui/components/badge";
import { Button } from "@repo/ui/components/button";
import { formatDate } from "@repo/utils";

import { CancelPlanChangeDialog } from "@/components/subscription/cancel-plan-change-dialog";
import { CancelSubscriptionDialog } from "@/components/subscription/cancel-subscription-dialog";
import { getPlanDetailsCardViewModel } from "@/utils/get-plan-details-card-view-model";

interface PlanDetailsCardProps {
  subscription: StudentSubscription;
  planCredits: number;
}

export function PlanDetailsCard({
  subscription,
  planCredits,
}: PlanDetailsCardProps) {
  const viewModel =
    getPlanDetailsCardViewModel({
      subscription,
      planCredits,
    });

  return (
    <div className="flex h-full flex-col justify-between rounded-3xl border border-slate-200 bg-white p-6 shadow-sm md:p-8">
      <div>
        <div className="mb-2 flex items-start justify-between gap-3">
          <Badge
            variant="secondary"
            className="border-0 bg-slate-100 text-slate-600 hover:bg-slate-100"
          >
            {viewModel.planBadgeLabel}
          </Badge>

          <div
            className={`rounded-md border-0 px-2 py-1 text-[12px] font-bold uppercase tracking-wider ${viewModel.status.classes}`}
          >
            {viewModel.status.label}
          </div>
        </div>

        <h2 className="mb-1 text-3xl font-bold capitalize">
          {viewModel.planTitle}
        </h2>

        <p className="font-medium text-slate-500">
          {viewModel.description}
        </p>

        {viewModel.isPlanChangeScheduled &&
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
                    "numeric",
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

        {viewModel.hasFinishedFreeTrial && (
          <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50/60 px-4 py-3">
            <p className="text-sm font-bold">
              Continue evoluindo nas suas redações
            </p>

            <p className="mt-1 text-sm leading-relaxed text-slate-600">
              Escolha um plano para receber novos créditos e continuar enviando redações para correção.
            </p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <hr className="mb-6 border-slate-100" />

        <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-end">
          <div>
            <p className="mb-1 text-xs font-bold uppercase tracking-wider text-slate-400">
              {viewModel.periodLabel}
            </p>

            <p className="text-lg font-bold">
              {viewModel.periodValue}
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
            <Button
              asChild
              variant="outline"
              className="h-11 w-full rounded-xl font-medium md:w-auto"
            >
              <Link href="/assinatura/metodos-de-pagamento">
                Métodos de pagamento
              </Link>
            </Button>

            {viewModel.canCancelSubscription &&
              subscription.current_period_end && (
                <CancelSubscriptionDialog
                  planName={subscription.plan_name}
                  effectiveAt={subscription.current_period_end}
                />
              )}

            {viewModel.isPlanChangeScheduled &&
              subscription.pending_change_at ? (
              <CancelPlanChangeDialog
                currentPlanName={subscription.plan_name}
                pendingPlanName={subscription.pending_plan_name ?? "novo plano"}
                effectiveAt={subscription.pending_change_at}
              />
            ) : (
              <Button
                asChild
                className="h-11 w-full rounded-xl font-medium md:w-auto"
              >
                <Link href="/assinatura/planos">
                  {viewModel.actionLabel}
                </Link>
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
