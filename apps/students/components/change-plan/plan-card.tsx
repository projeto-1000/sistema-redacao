"use client";

import Link from "next/link";
import { Check } from "lucide-react";

import type { PlanData, PlanSelectionMode } from "@/types";
import { ConfirmChangePlan } from "../confirm-change-plan";

import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import { formatCurrency, getMonthlyEquivalentCents } from "@repo/utils";
import type { PlanUpgradeCalculation } from "@/utils/calculate-plan-upgrade";
interface PlanCardProps {
  plan: PlanData;
  isCurrentPaidPlan: boolean;
  isPreviousCanceledPlan: boolean;

  currentPlanName: string | null;
  currentPlanPrice?: number | null;
  currentPlanCreditsIncluded?: number | null;
  currentPlanInterval?: string | null;
  currentPlanIntervalCount?: number | null;

  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;

  upgradePreview?: PlanUpgradeCalculation | null;

  selectionMode: PlanSelectionMode;
}

export function PlanCard({
  plan,
  isCurrentPaidPlan,
  isPreviousCanceledPlan,
  currentPlanName,
  currentPlanPrice,
  currentPlanCreditsIncluded,
  currentPlanInterval,
  currentPlanIntervalCount,
  currentPeriodStart,
  currentPeriodEnd,
  upgradePreview,
  selectionMode,
}: PlanCardProps) {
  const isQuarterly = plan.interval === "month" && plan.interval_count === 3;

  const displayedPrice = isQuarterly ? getMonthlyEquivalentCents(plan.price, 3) : plan.price;

  const hasSubtitle = Boolean(plan.subtitle?.trim());
  const benefits = (plan.description ?? "")
    .split(/\r?\n/)
    .map((benefit) => benefit.trim())
    .filter(Boolean);

  function renderPlanAction() {
    if (isCurrentPaidPlan) {
      return (
        <Button
          disabled
          className="h-12 w-full cursor-default rounded-xl border border-slate-200 bg-slate-100 font-bold text-slate-400 opacity-100"
        >
          Plano atual
        </Button>
      );
    }

    if (selectionMode === "payment_issue") {
      return (
        <Button asChild variant="outline" className="h-12 w-full rounded-xl font-bold">
          <Link href="/assinatura">Ver minha assinatura</Link>
        </Button>
      );
    }

    if (selectionMode === "canceled_subscription" && isPreviousCanceledPlan) {
      return (
        <Button asChild className="h-12 w-full rounded-xl font-bold">
          <Link href={`/assinatura/checkout?planId=${plan.id}`}>Reativar assinatura</Link>
        </Button>
      );
    }

    if (selectionMode === "change_plan") {
      const involvesQuarterlyCadence =
        isQuarterly || (currentPlanInterval === "month" && currentPlanIntervalCount === 3);

      if (involvesQuarterlyCadence) {
        return (
          <Button disabled className="h-12 w-full rounded-xl font-bold">
            Alteração disponível após o ciclo atual
          </Button>
        );
      }

      const hasCurrentPlanData =
        currentPlanName !== null &&
        currentPlanPrice !== null &&
        currentPlanPrice !== undefined &&
        currentPlanCreditsIncluded !== null &&
        currentPlanCreditsIncluded !== undefined &&
        currentPeriodStart !== null &&
        currentPeriodStart !== undefined &&
        currentPeriodEnd !== null &&
        currentPeriodEnd !== undefined;

      if (!hasCurrentPlanData) {
        return (
          <Button disabled className="h-12 w-full rounded-xl font-bold">
            Dados indisponíveis
          </Button>
        );
      }

      return (
        <ConfirmChangePlan
          newPlan={plan}
          currentPlanName={currentPlanName}
          currentPlanPrice={currentPlanPrice}
          currentPlanCreditsIncluded={currentPlanCreditsIncluded}
          currentPeriodStart={currentPeriodStart}
          currentPeriodEnd={currentPeriodEnd}
          initialUpgradePreview={upgradePreview}
        />
      );
    }

    const buttonLabel =
      selectionMode === "canceled_subscription" ? "Assinar novo plano" : "Assinar agora";

    return (
      <Button
        asChild
        className="h-12 w-full rounded-xl font-bold tracking-wide shadow-sm transition-all hover:scale-[1.01]"
      >
        <Link href={`/assinatura/checkout?planId=${plan.id}`}>{buttonLabel}</Link>
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-3xl border-2 bg-white p-8 transition-all",
        plan.is_recommended ? "border-primary shadow-sm" : "border-slate-100 hover:border-slate-200"
      )}
    >
      {isCurrentPaidPlan && (
        <span className="bg-primary absolute -top-3 right-6 rounded-sm px-3 py-1.5 text-[10px] font-extrabold tracking-wider text-amber-800 uppercase shadow-sm">
          Seu plano atual
        </span>
      )}

      {plan.is_recommended && (
        <span className="absolute -top-3 right-6 rounded-sm  bg-amber-200 px-3 py-1 text-[10px] font-extrabold tracking-wider text-amber-800 uppercase shadow-sm">
          Recomendado
        </span>
      )}

      <h2 className="text-3xl font-bold leading-tight tracking-tight text-slate-800">
        {plan.name}
      </h2>

      {hasSubtitle && (
        <p className="mt-1 min-h-14 text-[16px] leading-relaxed text-slate-500">{plan.subtitle}</p>
      )}

      <div className="my-4 flex flex-1 flex-col">
        {benefits.length > 0 && (
          <ul className="mb-6 space-y-3">
            {benefits.map((benefit, index) => (
              <li key={`${benefit}-${index}`} className="flex items-start gap-3">
                <span className="bg-primary/10 mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full">
                  <Check className="text-primary size-3" strokeWidth={3} />
                </span>
                <span className="text-sm leading-5 font-medium text-slate-600">{benefit}</span>
              </li>
            ))}
          </ul>
        )}

        <div className="mt-auto">
          <p className="flex items-baseline text-4xl font-extrabold tracking-tight text-slate-800">
            <span className="mr-1 text-2xl font-bold">R$</span>

            {(displayedPrice / 100).toFixed(2).replace(".", ",")}

            <span className="ml-1 text-sm font-medium text-slate-500">/mês</span>
          </p>

          {isQuarterly && (
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <p className="text-sm font-bold text-slate-700">
                Cobrança de {formatCurrency(plan.price)} a cada 3 meses
              </p>

              {plan.discount_percentage !== null && (
                <span className="bg-primary/10 text-primary ring-primary/20 inline-flex shrink-0 rounded-full px-2.5 py-1 text-xs font-extrabold tracking-wide uppercase ring-1">
                  {plan.discount_percentage}% OFF
                </span>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-auto">{renderPlanAction()}</div>
    </div>
  );
}
