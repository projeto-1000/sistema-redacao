import { getAvailablePlans, getCurrentUserPlanId } from "@/app/actions/plans";
import { PlanCard } from "@/components/plan-card";
import { PlanHelpCallout } from "@/components/plan-helper-callout";
import { Button } from "@repo/ui/components/button";
import { PageHeader } from "@repo/ui/components/page-header";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function ChangePlanPage() {
  const [plans, currentPlanId] = await Promise.all([
    getAvailablePlans(),
    getCurrentUserPlanId(),
  ]);


  return (
    <div className="space-y-8 min-h-dvh px-2 md:px-10 lg:px-12 py-4">
      <Button asChild variant='ghost' className="text-slate-500 hover:text-primary hover:bg-transparent!">
        <Link href="/assinatura">
          <ArrowLeft className="size-4 mr-2 " />
          Voltar
        </Link>
      </Button>

      <PageHeader
        title="Alterar plano"
        subtitle="Escolha o plano que melhor se adapta às suas necessidades de correção."
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 lg:gap-8">
        {plans.map((plan) => (
          <PlanCard
            key={plan.id}
            plan={plan}
            isCurrentPlan={plan.id === currentPlanId}
          />
        ))}
      </div>

      <PlanHelpCallout />
    </div>
  )
}