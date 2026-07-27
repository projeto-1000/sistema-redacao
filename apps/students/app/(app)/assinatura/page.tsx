import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Sparkles } from "lucide-react";

import {
  getSubscriptionData,
  getSubscriptionHistory,
} from "@/app/actions/subscription";
import { CreditsUsageCard } from "@/components/credits-usage-card";
import { PlanDetailsCard } from "@/components/plan-details-card";
import { parseCreditsTransactionsFilters } from "@/utils/parse-filters";

import { Button } from "@repo/ui/components/button";
import { HistoryList } from "@repo/ui/components/features/history/history-list";
import { PageHeader } from "@repo/ui/components/page-header";

export const metadata: Metadata = {
  title: "Minha Assinatura",
};

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{
    [key: string]:
    | string
    | string[]
    | undefined;
  }>;
}) {
  const resolvedSearchParams = await searchParams;

  const page = Number(resolvedSearchParams?.page) || 1;

  const filters = parseCreditsTransactionsFilters(resolvedSearchParams);

  const data = await getSubscriptionData();

  if (!data) {
    return null;
  }

  const { subscription, credits } = data;

  const subscriptionHistoryData = await getSubscriptionHistory({ filters, page, });

  return (
    <div className="min-h-dvh space-y-8 px-2 py-4 md:px-10 lg:px-12">
      <Button
        asChild
        variant="ghost"
        className="text-slate-500 hover:bg-transparent! hover:text-primary"
      >
        <Link href="/perfil">
          <ArrowLeft className="mr-2 size-4" />
          Voltar para o perfil
        </Link>
      </Button>

      <PageHeader
        title="Minha Assinatura"
        subtitle="Gerencie sua assinatura, créditos e acompanhe seu histórico de uso."
      />

      {!data.hasSubscription && (
        <div className="flex min-h-[250px] flex-col items-center justify-center rounded-3xl border-2 border-dashed border-border bg-slate-100/80 p-12 text-center">
          <div className="mb-6 rounded-2xl border border-slate-100 bg-slate-50 p-4 text-primary">
            <Sparkles className="size-8" />
          </div>

          <h3 className="mb-2 text-2xl font-black tracking-tight">
            Desbloqueie suas correções de redação
          </h3>

          <p className="mb-8 max-w-md text-sm leading-relaxed text-slate-500">
            Você ainda não possui um plano
            ativo.
            <br />
            Escolha o pacote ideal para começar
            a enviar suas redações e receber
            análises detalhadas focadas na sua
            evolução.
          </p>

          <Button
            asChild
            size="lg"
            className="h-12 rounded-xl px-6 font-bold tracking-wide shadow-md transition-all hover:scale-[1.02]"
          >
            <Link href="/assinatura/planos">
              Conhecer nossos planos
            </Link>
          </Button>
        </div>
      )}

      {data.hasSubscription && (
        <>
          <div className="space-y-6">
            <PlanDetailsCard
              subscription={subscription}
              planCredits={
                subscription.plan_external_id ===
                  "internal_free_trial"
                  ? credits?.free_credits ?? 0
                  : credits?.plan_credits ?? 0
              }
            />

            <CreditsUsageCard
              credits={credits}
              subscription={subscription}
            />
          </div>

          <HistoryList
            data={subscriptionHistoryData}
            title="Histórico de créditos e cobranças"
            description="Acompanhe pagamentos, créditos recebidos, envios de redação e expirações."
            emptyMessage="Nenhuma movimentação encontrada."
          />
        </>
      )}
    </div>
  );
}