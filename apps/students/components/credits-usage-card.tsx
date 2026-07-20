import {
  StudentCredits,
  StudentSubscription,
} from "@repo/types";
import { formatDate } from "@repo/utils";
import {
  Gift,
  Plus,
  PlusCircle,
  RefreshCcw,
} from "lucide-react";
import Link from "next/link";

interface CreditsUsageCardProps {
  credits: StudentCredits;
  subscription: StudentSubscription;
}

interface PlanCreditsContent {
  title: string;
  description: string;
  availableCredits: number;
  totalCredits: number | null;
  showProgress: boolean;
}

export function CreditsUsageCard({
  credits,
  subscription,
}: CreditsUsageCardProps) {
  const isFreeTrial =
    subscription.plan_external_id ===
    "internal_free_trial";

  const isMentorship =
    subscription.plan_external_id ===
    "internal_mentoria_free";

  const isLifetime =
    subscription.interval === "lifetime" &&
    !isFreeTrial;

  const planCredits = credits.plan_credits ?? 0;

  function getPlanCreditsContent(): PlanCreditsContent {
    if (isFreeTrial) {
      return {
        title: "Correção gratuita",

        description:
          planCredits > 0
            ? "Disponível até você utilizar"
            : "Crédito gratuito já utilizado",

        availableCredits: planCredits,
        totalCredits: 1,
        showProgress: true,
      };
    }

    if (isMentorship) {
      const cycleNumber =
        subscription.mentorship_cycle_number;

      const cycleEnd =
        subscription.mentorship_cycle_end;

      const description = cycleEnd
        ? cycleNumber === 3
          ? `Último ciclo disponível até ${formatDate(
            cycleEnd,
            "numeric"
          )}`
          : `Próxima liberação em ${formatDate(
            cycleEnd,
            "numeric"
          )}`
        : "Créditos liberados por ciclos";

      return {
        title: "Créditos da Mentoria",
        description,

        availableCredits:
          subscription
            .mentorship_cycle_remaining ??
          planCredits,

        totalCredits:
          subscription.mentorship_cycle_total,

        showProgress:
          subscription.mentorship_cycle_total !==
          null,
      };
    }

    if (isLifetime) {
      return {
        title: "Créditos do Plano",

        description: "Não expiram",

        availableCredits: planCredits,

        totalCredits:
          subscription.credits_included || null,

        showProgress:
          subscription.credits_included > 0,
      };
    }

    return {
      title: "Créditos do Plano",

      description:
        subscription.current_period_end
          ? `Válidos até ${formatDate(
            subscription.current_period_end,
            "numeric"
          )}`
          : "Data de renovação não disponível",

      availableCredits: planCredits,

      totalCredits:
        subscription.credits_included || null,

      showProgress:
        subscription.credits_included > 0,
    };
  }

  const {
    title,
    description,
    availableCredits,
    totalCredits,
    showProgress,
  } = getPlanCreditsContent();

  const planPercentage =
    totalCredits && totalCredits > 0
      ? Math.min(
        Math.max(
          (availableCredits / totalCredits) *
          100,
          0
        ),
        100
      )
      : 0;

  const PlanIcon = isFreeTrial
    ? Gift
    : RefreshCcw;

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm h-full">
      <div className="grid grid-cols-1 divide-y divide-slate-200">
        <div className="p-6 md:p-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h4 className="flex items-center gap-2 font-bold">
                <PlanIcon className="size-4 text-primary" />

                {title}
              </h4>

              <p className="mt-1 text-xs text-slate-500">
                {description}
              </p>
            </div>

            <div className="shrink-0 text-right">
              <span className="text-3xl font-bold text-slate-900">
                {availableCredits}
              </span>

              {totalCredits !== null && (
                <span className="ml-1 text-sm font-medium text-slate-400">
                  / {totalCredits}
                </span>
              )}
            </div>
          </div>

          {showProgress && (
            <div className="h-2.5 w-full rounded-full bg-slate-100">
              <div
                className="h-2.5 rounded-full bg-primary transition-all duration-500"
                style={{
                  width: `${planPercentage}%`,
                }}
              />
            </div>
          )}
        </div>

        <div className="bg-slate-50/30 p-6 md:p-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h4 className="flex items-center gap-2 font-bold">
                <PlusCircle className="size-4 text-secondary" />

                Créditos Avulsos
              </h4>

              <p className="mt-1 text-xs text-slate-500">
                Não expiram
              </p>
            </div>

            <span className="text-3xl font-bold">
              {credits.extra_credits ?? 0}
            </span>
          </div>

          <Link
            href="/assinatura/comprar-creditos"
            className="flex items-center justify-end gap-2 text-right text-[13px] font-medium text-slate-700 transition-colors hover:font-bold hover:text-secondary"
          >
            <Plus className="size-4" />
            Comprar mais créditos
          </Link>
        </div>
      </div>
    </div>
  );
}