"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { PlanData } from "@/types";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import { ConfirmChangePlan } from "../confirm-change-plan";
import Link from "next/link";
import { formatCurrency } from "@repo/utils";

interface PlanCardProps {
  plan: PlanData;
  isCurrentPlan: boolean;
  isUpgradeFlow: boolean;
}

export function PlanCard({ plan, isCurrentPlan, isUpgradeFlow }: PlanCardProps) {
  const isPremium = plan.name.toLowerCase().includes("premium");
  const isQuarterly = plan.interval === "month" && plan.interval_count === 3;
  const displayedPrice = isQuarterly ? plan.price / 3 : plan.price;

  return (
    <div className={cn(
      "flex flex-col bg-white border-2 rounded-3xl p-8 relative transition-all h-full",
      isPremium ? "border-primary shadow-sm" : "border-slate-100 hover:border-slate-200",
    )}>

      {isCurrentPlan && (
        <span className="absolute -top-3 right-6 bg-primary text-amber-950 text-[10px] font-extrabold px-3 py-1.5 rounded-sm uppercase tracking-wider shadow-sm">
          Seu Plano Atual
        </span>
      )}

      <div className="flex justify-between items-start mb-4">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">
          {plan.name}
        </h2>
        {isPremium && (
          <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            RECOMENDADO
          </span>
        )}
      </div>

      <div className="mb-8">
        <p className="text-sm text-slate-500 mb-6 min-h-10 leading-relaxed">
          {"O pacote ideal focado na evolução constante da sua nota."}
        </p>

        <p className="text-4xl font-extrabold text-slate-800 flex items-baseline tracking-tight">
          <span className="text-2xl mr-1 font-bold">R$</span>
          {(displayedPrice / 100).toFixed(2).replace(".", ",")}
          <span className="text-sm text-slate-500 font-medium ml-1">/mês</span>
        </p>

        <div className="h-5 mt-1">
          {isQuarterly && (
            <p className="text-xs text-slate-400 font-semibold">
              Cobrança total de {formatCurrency(plan.price)} a cada 3 meses
            </p>
          )}
        </div>
      </div>

      <ul className="flex flex-col gap-4 mb-10 grow">
        {plan.features.map((feature: any, index: number) => {
          const isIncluded = typeof feature === "string" ? true : feature.included;
          const text = typeof feature === "string" ? feature : feature.text;

          return (
            <li key={index} className="flex items-center gap-3">
              {isIncluded ? (
                <CheckCircle2 className="size-5 shrink-0 text-primary" />
              ) : (
                <XCircle className="size-5 shrink-0 text-slate-300" />
              )}

              <span className={cn(
                "text-sm font-semibold",
                isIncluded ? "text-slate-700" : "text-slate-400 line-through decoration-slate-200"
              )}>
                {text}
              </span>
            </li>
          );
        })}
      </ul>

      <div className="mt-auto">
        {isCurrentPlan ? (
          <Button
            disabled
            className="w-full h-12 rounded-xl bg-slate-100 text-slate-400 font-bold opacity-100 cursor-default border border-slate-200"
          >
            Ativo Atualmente
          </Button>
        ) : isUpgradeFlow ? (
          <ConfirmChangePlan
            newPlan={plan}
            currentPlanName="Seu plano atual"
            currentPlanEssays={0}
          />
        ) : (
          <Button asChild className="w-full h-12 rounded-xl font-bold tracking-wide transition-all hover:scale-[1.01] shadow-sm">
            <Link href={`/assinatura/checkout?planId=${plan.id}`}>
              Assinar agora
            </Link>
          </Button>
        )}
      </div>

    </div>
  );
}