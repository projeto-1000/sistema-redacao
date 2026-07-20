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

  const isMentorshipPlan =
    subscription.plan_external_id ===
    "internal_mentoria_free";

  const hasMentorshipCycle =
    subscription.mentorship_cycle_number !== null &&
    subscription.mentorship_cycle_total !== null;

  const isLifetime =
    subscription.interval === "lifetime" &&
    !isFreeTrial &&
    !isMentorshipPlan;

  const planCredits =
    credits.plan_credits ?? 0;

  const freeCredits =
    credits.free_credits ?? 0;

  const freeCreditExpiresAt =
    credits.free_credit_expires_at;

  const hasFreeCredit =
    freeCredits > 0 &&
    freeCreditExpiresAt !== null;

  const mentorshipAvailableCredits =
    subscription.mentorship_cycle_remaining ?? 0;

  const mentorshipTotalCredits =
    subscription.mentorship_cycle_total;

  const mentorshipCycleNumber =
    subscription.mentorship_cycle_number;

  const mentorshipCycleEnd =
    subscription.mentorship_cycle_end;

  const mentorshipDescription =
    mentorshipCycleEnd
      ? mentorshipCycleNumber === 3
        ? `Último ciclo disponível até ${formatDate(
          mentorshipCycleEnd,
          "numeric"
        )}`
        : `Próxima liberação em ${formatDate(
          mentorshipCycleEnd,
          "numeric"
        )}`
      : "Créditos liberados por ciclos";

  function getPlanCreditsContent(): PlanCreditsContent {
    if (isFreeTrial) {
      return {
        title: "Correção gratuita",

        description:
          freeCredits > 0
            ? freeCreditExpiresAt
              ? `Válida até ${formatDate(
                freeCreditExpiresAt,
                "numeric"
              )}`
              : "Validade não disponível"
            : "Crédito gratuito utilizado ou expirado",

        availableCredits: freeCredits,
        totalCredits: 1,
        showProgress: true,
      };
    }

    if (isMentorshipPlan) {
      return {
        title: "Créditos da Mentoria",
        description: mentorshipDescription,

        availableCredits:
          mentorshipAvailableCredits,

        totalCredits:
          mentorshipTotalCredits,

        showProgress:
          mentorshipTotalCredits !== null,
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

  const mentorshipPercentage =
    mentorshipTotalCredits &&
      mentorshipTotalCredits > 0
      ? Math.min(
        Math.max(
          (mentorshipAvailableCredits /
            mentorshipTotalCredits) *
          100,
          0
        ),
        100
      )
      : 0;

  const PlanIcon =
    isFreeTrial || isMentorshipPlan
      ? Gift
      : RefreshCcw;

  return (
    <div className="h-full overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
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

        {hasFreeCredit && !isFreeTrial && (
          <div className="bg-slate-50/30 p-6 md:p-8">
            <div className="mb-5 flex items-center justify-between gap-4">
              <div>
                <h4 className="flex items-center gap-2 font-bold">
                  <Gift className="size-4 text-primary" />

                  Correção gratuita
                </h4>

                <p className="mt-1 text-xs text-slate-500">
                  Válida até{" "}
                  {formatDate(
                    freeCreditExpiresAt,
                    "numeric"
                  )}
                </p>
              </div>

              <div className="shrink-0 text-right">
                <span className="text-3xl font-bold text-slate-900">
                  {freeCredits}
                </span>

                <span className="ml-1 text-sm font-medium text-slate-400">
                  / 1
                </span>
              </div>
            </div>

            <div className="h-2.5 w-full rounded-full bg-slate-100">
              <div
                className="h-2.5 rounded-full bg-primary transition-all duration-500"
                style={{
                  width: `${Math.min(
                    freeCredits * 100,
                    100
                  )}%`,
                }}
              />
            </div>
          </div>
        )}

        {hasMentorshipCycle &&
          !isMentorshipPlan && (
            <div className="bg-slate-50/30 p-6 md:p-8">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <h4 className="flex items-center gap-2 font-bold">
                    <Gift className="size-4 text-primary" />

                    Créditos da Mentoria
                  </h4>

                  <p className="mt-1 text-xs text-slate-500">
                    {mentorshipDescription}
                  </p>
                </div>

                <div className="shrink-0 text-right">
                  <span className="text-3xl font-bold text-slate-900">
                    {mentorshipAvailableCredits}
                  </span>

                  {mentorshipTotalCredits !==
                    null && (
                      <span className="ml-1 text-sm font-medium text-slate-400">
                        / {mentorshipTotalCredits}
                      </span>
                    )}
                </div>
              </div>

              {mentorshipTotalCredits !==
                null && (
                  <div className="h-2.5 w-full rounded-full bg-slate-100">
                    <div
                      className="h-2.5 rounded-full bg-primary transition-all duration-500"
                      style={{
                        width: `${mentorshipPercentage}%`,
                      }}
                    />
                  </div>
                )}
            </div>
          )}

        <div className="bg-slate-50/30 p-6 md:p-8">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h4 className="flex items-center gap-2 font-bold">
                <PlusCircle className="size-4 text-secondary" />

                Créditos Extra
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