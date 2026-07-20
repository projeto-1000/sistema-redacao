"use client";

import Link from "next/link";
import {
  CheckCircle2,
  XCircle,
} from "lucide-react";

import type {
  PlanData,
  PlanSelectionMode,
} from "@/types";
import { ConfirmChangePlan } from "../confirm-change-plan";

import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import { formatCurrency } from "@repo/utils";

interface PlanCardProps {
  plan: PlanData;
  isCurrentPaidPlan: boolean;
  isPreviousCanceledPlan: boolean;
  currentPlanName: string | null;
  selectionMode: PlanSelectionMode;
}

export function PlanCard({
  plan,
  isCurrentPaidPlan,
  isPreviousCanceledPlan,
  currentPlanName,
  selectionMode,
}: PlanCardProps) {
  const isPremium = plan.name
    .toLowerCase()
    .includes("premium");

  const isQuarterly =
    plan.interval === "month" &&
    plan.interval_count === 3;

  const displayedPrice = isQuarterly
    ? plan.price / 3
    : plan.price;

  return (
    <div
      className={cn(
        "relative flex h-full flex-col rounded-3xl border-2 bg-white p-8 transition-all",
        isPremium
          ? "border-primary shadow-sm"
          : "border-slate-100 hover:border-slate-200"
      )}
    >
      {isCurrentPaidPlan && (
        <span className="absolute -top-3 right-6 rounded-sm bg-primary px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-950 shadow-sm">
          Seu plano atual
        </span>
      )}

      {isPreviousCanceledPlan &&
        selectionMode ===
        "canceled_subscription" && (
          <span className="absolute -top-3 left-6 rounded-sm bg-slate-700 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-white shadow-sm">
            Plano anterior
          </span>
        )}

      <div className="mb-4 flex items-start justify-between gap-3">
        <h2 className="text-2xl font-bold tracking-tight text-slate-800">
          {plan.name}
        </h2>

        {isPremium && (
          <span className="rounded-full bg-amber-100 px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-amber-800">
            Recomendado
          </span>
        )}
      </div>

      <div className="mb-8">
        <p className="mb-6 min-h-10 text-sm leading-relaxed text-slate-500">
          O pacote ideal focado na evolução constante
          da sua nota.
        </p>

        <p className="flex items-baseline text-4xl font-extrabold tracking-tight text-slate-800">
          <span className="mr-1 text-2xl font-bold">
            R$
          </span>

          {(displayedPrice / 100)
            .toFixed(2)
            .replace(".", ",")}

          <span className="ml-1 text-sm font-medium text-slate-500">
            /mês
          </span>
        </p>

        <div className="mt-1 h-5">
          {isQuarterly && (
            <p className="text-xs font-semibold text-slate-400">
              Cobrança total de{" "}
              {formatCurrency(plan.price)} a cada 3
              meses
            </p>
          )}
        </div>
      </div>

      <ul className="mb-10 flex grow flex-col gap-4">
        {plan.features.map((feature, index) => {
          const isIncluded =
            typeof feature === "string"
              ? true
              : feature.included;

          const text =
            typeof feature === "string"
              ? feature
              : feature.text;

          return (
            <li
              key={`${text}-${index}`}
              className="flex items-center gap-3"
            >
              {isIncluded ? (
                <CheckCircle2 className="size-5 shrink-0 text-primary" />
              ) : (
                <XCircle className="size-5 shrink-0 text-slate-300" />
              )}

              <span
                className={cn(
                  "text-sm font-semibold",
                  isIncluded
                    ? "text-slate-700"
                    : "text-slate-400 line-through decoration-slate-200"
                )}
              >
                {text}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto">
        {isCurrentPaidPlan ? (
          <Button
            disabled
            className="h-12 w-full cursor-default rounded-xl border border-slate-200 bg-slate-100 font-bold text-slate-400 opacity-100"
          >
            Plano atual
          </Button>
        ) : selectionMode ===
          "mentorship_pending" ? (
          <Button
            disabled
            className="h-12 w-full rounded-xl font-bold"
          >
            Disponível em breve
          </Button>
        ) : selectionMode ===
          "payment_issue" ? (
          <Button
            asChild
            variant="outline"
            className="h-12 w-full rounded-xl font-bold"
          >
            <Link href="/assinatura">
              Ver minha assinatura
            </Link>
          </Button>
        ) : selectionMode ===
          "canceled_subscription" &&
          isPreviousCanceledPlan ? (
          <Button
            asChild
            className="h-12 w-full rounded-xl font-bold"
          >
            <Link
              href={`/assinatura/checkout?planId=${plan.id}`}
            >
              Reativar assinatura
            </Link>
          </Button>
        ) : selectionMode === "change_plan" ? (
          <ConfirmChangePlan
            newPlan={plan}
            currentPlanName={
              currentPlanName ??
              "Seu plano atual"
            }
            currentPlanEssays={0}
          />
        ) : (
          <Button
            asChild
            className="h-12 w-full rounded-xl font-bold tracking-wide shadow-sm transition-all hover:scale-[1.01]"
          >
            <Link
              href={`/assinatura/checkout?planId=${plan.id}`}
            >
              {selectionMode ===
                "canceled_subscription"
                ? "Assinar novo plano"
                : "Assinar agora"}
            </Link>
          </Button>
        )}
      </div>
    </div>
  );
}