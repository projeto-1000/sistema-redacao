"use client";

import { useState } from "react";
import { PlanData } from "@/types";
import { PlanCard } from "./plan-card";
import { Tabs, TabsList, TabsTrigger } from "@repo/ui/components/tabs";

interface PlanGridProps {
  plans: PlanData[];
  currentPlanId: string | null;
  isUpgradeFlow: boolean;
}

export function PlanGrid({ plans, currentPlanId, isUpgradeFlow }: PlanGridProps) {
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "quarterly">("monthly");

  const filteredPlans = plans.filter((plan) => {
    const isMonthly = plan.interval === "month" && plan.interval_count === 1;
    const isQuarterly = plan.interval === "month" && plan.interval_count === 3;

    if (billingPeriod === "monthly" && isMonthly) return true;
    if (billingPeriod === "quarterly" && isQuarterly) return true;

    if (plan.id === currentPlanId && !isMonthly && !isQuarterly) return true;

    return false;
  });

  return (
    <div className="space-y-8">

      <div className="flex justify-center w-full">
        <Tabs
          defaultValue="monthly"
          onValueChange={(value) => setBillingPeriod(value as "monthly" | "quarterly")}
        >
          <TabsList className="min-h-12 p-1 bg-slate-100 border border-slate-200 rounded-2xl">

            <TabsTrigger
              value="monthly"
              className="px-8 py-2.5 rounded-xl text-sm font-bold tracking-tight data-[state=active]:bg-white data-[state=active]:text-slate-900! data-[state=active]:shadow-sm text-slate-400!"
            >
              Mensal
            </TabsTrigger>

            <TabsTrigger
              value="quarterly"
              className="px-6 py-2.5 rounded-xl text-sm font-bold tracking-tight flex items-center gap-2 data-[state=active]:bg-white data-[state=active]:text-slate-900! data-[state=active]:shadow-sm text-slate-400!"
            >
              Trimestral
              <span className="bg-primary/20 text-primary text-[10px] font-black px-2 py-0.5 rounded-md uppercase">
                Desconto
              </span>
            </TabsTrigger>

          </TabsList>
        </Tabs>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8 max-w-5xl mx-auto">
        {filteredPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={plan.id === currentPlanId}
            isUpgradeFlow={isUpgradeFlow}
          />
        ))}
      </div>
    </div>
  );
}