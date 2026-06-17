import { getAvailablePlans, getCurrentUserPlanId } from "@/app/actions/plans";
import { PlanGrid } from "@/components/change-plan/plan-grid";
import { PlanHelpCallout } from "@/components/change-plan/plan-helper-callout";
import { Button } from "@repo/ui/components/button";
import { PageHeader } from "@repo/ui/components/page-header";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  const currentPlanId = await getCurrentUserPlanId();
  return {
    title: currentPlanId ? "Alterar Plano" : "Assinar Plano",
  };
}

export default async function ChangePlanPage() {
  const currentPlanId = await getCurrentUserPlanId();

  const plans = await getAvailablePlans(currentPlanId);

  const isUpgradeFlow = Boolean(currentPlanId);

  const pageTitle = isUpgradeFlow ? "Alterar plano" : "Escolha seu plano";
  const pageSubtitle = isUpgradeFlow
    ? "Escolha o plano que melhor se adapta às suas necessidades de correção."
    : "Selecione o pacote ideal e comece a enviar suas redações hoje mesmo.";

  return (
    <div className="space-y-8 min-h-dvh px-2 md:px-10 lg:px-12 py-4">
      <Button asChild variant='ghost' className="text-slate-500 hover:text-primary hover:bg-transparent!">
        <Link href={isUpgradeFlow ? "/assinatura" : "/perfil"}>
          <ArrowLeft className="size-4 mr-2 " />
          Voltar
        </Link>
      </Button>

      <PageHeader
        title={pageTitle}
        subtitle={pageSubtitle}
      />

      <PlanGrid
        plans={plans}
        currentPlanId={currentPlanId}
        isUpgradeFlow={isUpgradeFlow}
      />

      <PlanHelpCallout />
    </div>
  );
}