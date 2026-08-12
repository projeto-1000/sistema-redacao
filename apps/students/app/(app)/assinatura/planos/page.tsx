import {
  getAvailablePlans,
  getCurrentUserSubscriptionContext,
} from "@/app/actions/plans";
import { PlanGrid } from "@/components/change-plan/plan-grid";
import { PlanHelpCallout } from "@/components/change-plan/plan-helper-callout";
import type { PlanSelectionMode } from "@/types";
import { Button } from "@repo/ui/components/button";
import { PageHeader } from "@repo/ui/components/page-header";
import { ArrowLeft, CircleAlert } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";
import { getSelectionMode } from "@/utils/get-plan-selection-mode";

function getPageContent(mode: PlanSelectionMode) {
  switch (mode) {
    case "change_plan":
      return {
        title: "Alterar plano",
        subtitle:
          "Compare as opções e escolha o plano que melhor atende à sua rotina de estudos.",
      };

    case "canceled_subscription":
      return {
        title: "Escolha seu plano",
        subtitle:
          "Reative seu plano anterior ou escolha uma nova opção para continuar enviando redações.",
      };

    case "payment_issue":
      return {
        title: "Sua assinatura precisa de atenção",
        subtitle:
          "Regularize sua assinatura atual antes de selecionar outro plano.",
      };

    default:
      return {
        title: "Escolha seu plano",
        subtitle:
          "Selecione o plano ideal para continuar enviando redações e evoluindo a cada correção.",
      };
  }
}

export async function generateMetadata(): Promise<Metadata> {
  const context =
    await getCurrentUserSubscriptionContext();

  const mode = getSelectionMode(context);

  return {
    title:
      mode === "change_plan"
        ? "Alterar Plano"
        : "Assinar Plano",
  };
}


export default async function PlansPage() {
  const [currentContext, plans] =
    await Promise.all([
      getCurrentUserSubscriptionContext(),
      getAvailablePlans(),
    ]);

  const selectionMode =
    getSelectionMode(currentContext);

  const { title, subtitle } =
    getPageContent(selectionMode);

  const currentPaidPlanId =
    selectionMode === "change_plan"
      ? currentContext?.planId ?? null
      : null;

  const previousCanceledPlanId =
    selectionMode === "canceled_subscription"
      ? currentContext?.planId ?? null
      : null;

  const backHref = currentContext
    ? "/assinatura"
    : "/perfil";

  return (
    <div className="min-h-dvh space-y-8 px-2 py-4 md:px-10 lg:px-12">
      <Button
        asChild
        variant="ghost"
        className="text-slate-500 hover:bg-transparent! hover:text-primary"
      >
        <Link href={backHref}>
          <ArrowLeft className="mr-2 size-4" />
          Voltar
        </Link>
      </Button>

      <PageHeader
        title={title}
        subtitle={subtitle}
      />

      {selectionMode === "payment_issue" && (
        <div className="mx-auto flex max-w-5xl gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-5 py-4">
          <CircleAlert className="mt-0.5 size-5 shrink-0 text-amber-700" />

          <div>
            <p className="font-bold text-amber-950">
              Regularize sua assinatura
            </p>

            <p className="mt-1 text-sm leading-relaxed text-amber-900/80">
              Existe uma pendência na sua assinatura atual. Resolva essa situação antes de okcontratar ou trocar de plano.
            </p>
          </div>
        </div>
      )}

      <PlanGrid
        plans={plans}
        currentPaidPlanId={currentPaidPlanId}
        previousCanceledPlanId={
          previousCanceledPlanId
        }
        currentPlanName={
          currentContext?.planName ?? null
        }
        currentPlanPrice={
          currentContext?.planPrice ?? null
        }
        currentPlanCreditsIncluded={
          currentContext?.planCreditsIncluded ?? null
        }
        currentPeriodStart={
          currentContext?.currentPeriodStart ?? null
        }
        currentPeriodEnd={
          currentContext?.currentPeriodEnd ?? null
        }
        selectionMode={selectionMode}
      />

      <PlanHelpCallout />
    </div>
  );
}
