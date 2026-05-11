"use client";

import { CheckCircle2, XCircle } from "lucide-react";
import { type PlanData } from "@/app/actions/plans";
import { Button } from "@repo/ui/components/button";
import { cn } from "@repo/ui/lib/utils";
import { ConfirmChangePlan } from "./confirm-change-plan";

interface PlanCardProps {
  plan: PlanData;
  isCurrentPlan: boolean;
}

export function PlanCard({ plan, isCurrentPlan }: PlanCardProps) {
  const isPremium = plan.id === "plan_premium";

  return (
    <div className={cn(
      "flex flex-col bg-white border-2 rounded-3xl p-8 relative transition-all h-full",
      isPremium ? "border-primary" : "border-slate-100 hover:border-slate-200"
    )}>

      {isCurrentPlan && (
        <span className="absolute -top-3 right-6 bg-primary text-amber-950 text-[10px] font-extrabold px-3 py-1.5 rounded-sm uppercase tracking-wider">
          Seu Plano Atual
        </span>
      )}

      <div className="flex justify-between items-start mb-6">
        <h2 className="text-2xl font-bold text-slate-800">{plan.name}</h2>
        {plan.badge && (
          <span className="bg-stone-200 text-stone-600 text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-wider">
            {plan.badge}
          </span>
        )}
      </div>

      <div className="mb-8">
        <p className="text-4xl font-extrabold text-slate-800 flex items-baseline">
          <span className="text-2xl mr-1 font-bold">R$</span>
          {plan.price.toFixed(2).replace(".", ",")}
          <span className="text-sm text-slate-500 font-medium ml-1">/mês</span>
        </p>
      </div>

      <ul className="flex flex-col gap-4 mb-10 grow">
        {plan.features.map((feature, index) => (
          <li key={index} className="flex items-center gap-3">
            {feature.included ? (
              <CheckCircle2 className="size-5 shrink-0 text-primary" />
            ) : (
              <XCircle className="size-5 shrink-0 text-stone-400" />
            )}

            <span className={cn(
              "text-sm font-semibold",
              feature.included ? "text-slate-700" : "text-stone-400"
            )}>
              {feature.text}
            </span>
          </li>
        ))}
      </ul>

      <div className="mt-auto">
        {isCurrentPlan ? (
          <Button
            disabled
            className="w-full h-12 rounded-xl bg-[#F6F4F0] text-stone-400 font-bold opacity-100 cursor-default"
          >
            Ativo Atualmente
          </Button>
        ) : (
          <ConfirmChangePlan
            newPlan={plan}
            currentPlanName="Plano Basic"
            currentPlanEssays={4}
          />
        )}
      </div>

    </div>
  );
}