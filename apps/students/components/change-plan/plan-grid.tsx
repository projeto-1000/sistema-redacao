"use client";

import { useState } from "react";
import type {
  PlanData,
  PlanSelectionMode,
} from "@/types";

import {
  Tabs,
  TabsList,
  TabsTrigger,
} from "@repo/ui/components/tabs";
import { PlanCard } from "./plan-card";


interface PlanGridProps {
  plans: PlanData[];
  currentPaidPlanId: string | null;
  previousCanceledPlanId: string | null;
  currentPlanName: string | null;
  selectionMode: PlanSelectionMode;
}

export function PlanGrid({
  plans,
  currentPaidPlanId,
  previousCanceledPlanId,
  currentPlanName,
  selectionMode,
}: PlanGridProps) {
  const [billingPeriod, setBillingPeriod] =
    useState<"monthly" | "quarterly">(
      "monthly"
    );

  const filteredPlans = plans.filter((plan) => {
    const isMonthly =
      plan.interval === "month" &&
      plan.interval_count === 1;

    const isQuarterly =
      plan.interval === "month" &&
      plan.interval_count === 3;

    if (
      billingPeriod === "monthly" &&
      isMonthly
    ) {
      return true;
    }

    if (
      billingPeriod === "quarterly" &&
      isQuarterly
    ) {
      return true;
    }

    return false;
  });

  return (
    <div className="space-y-8">
      <div className="flex w-full justify-center">
        <Tabs
          defaultValue="monthly"
          onValueChange={(value) =>
            setBillingPeriod(
              value as
              | "monthly"
              | "quarterly"
            )
          }
        >
          <TabsList className="min-h-12 rounded-2xl border border-slate-200 bg-slate-100 p-1">
            <TabsTrigger
              value="monthly"
              className="rounded-xl px-8 py-2.5 text-sm font-bold tracking-tight text-slate-400! data-[state=active]:bg-white data-[state=active]:text-slate-900! data-[state=active]:shadow-sm"
            >
              Mensal
            </TabsTrigger>

            <TabsTrigger
              value="quarterly"
              className="flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-bold tracking-tight text-slate-400! data-[state=active]:bg-white data-[state=active]:text-slate-900! data-[state=active]:shadow-sm"
            >
              Trimestral

              <span className="rounded-md bg-primary/20 px-2 py-0.5 text-[10px] font-black uppercase text-primary">
                Desconto
              </span>
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      <div className="mx-auto grid max-w-5xl grid-cols-1 gap-6 md:grid-cols-2 lg:gap-8">
        {filteredPlans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrentPaidPlan={
              plan.id === currentPaidPlanId
            }
            isPreviousCanceledPlan={
              plan.id ===
              previousCanceledPlanId
            }
            currentPlanName={
              currentPlanName
            }
            selectionMode={selectionMode}
          />
        ))}
      </div>
    </div>
  );
}