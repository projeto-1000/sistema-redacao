import { getCreditsHistory, getSubscriptionData } from "@/app/actions/subscription";
import CreditTransactionsTable from "@repo/ui/components/features/credit-history/credits-transactions-table";
import { CreditsUsageCard } from "@/components/credits-usage-card";
import { PlanDetailsCard } from "@/components/plan-details-card";
import { parseCreditsTransactionsFilters } from "@/utils/parse-filters";
import { Button } from "@repo/ui/components/button";
import { PageHeader } from "@repo/ui/components/page-header";
import { ArrowLeft, Sparkles } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Minha Assinatura",
};

export default async function SubscriptionPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {

  const resolvedSearchParams = await searchParams;
  const page = Number(resolvedSearchParams?.page) || 1;

  const filters = parseCreditsTransactionsFilters(resolvedSearchParams);

  const data = await getSubscriptionData();

  if (!data) return null

  const { subscription, credits } = data;

  const creditTransactionsData = await getCreditsHistory({ filters, page })

  return (
    <div className="space-y-8 min-h-dvh px-2 md:px-10 lg:px-12 py-4">
      <Button asChild variant='ghost' className="text-slate-500 hover:text-primary hover:bg-transparent!">
        <Link href="/perfil">
          <ArrowLeft className="size-4 mr-2 " />
          Voltar para o perfil
        </Link>
      </Button>


      <PageHeader
        title="Minha Assinatura"
        subtitle="Gerencie sua assinatura, créditos e acompanhe seu histórico de uso."
      />

      {!data.hasSubscription && (
        <div className="flex flex-col items-center justify-center p-12 rounded-3xl border-2 border-dashed border-border bg-slate-100/80 min-h-[250px] text-center">
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100  mb-6 text-primary">
            <Sparkles className="size-8" />
          </div>

          <h3 className="text-2xl font-black tracking-tight mb-2">
            Desbloqueie suas correções de redação
          </h3>

          <p className="text-slate-500 text-sm max-w-md leading-relaxed mb-8">
            Você ainda não possui um plano ativo. <br />
            Escolha o pacote ideal para começar a enviar suas redações e receber análises detalhadas focadas na sua evolução.
          </p>

          <Button asChild size="lg" className="rounded-xl h-12 px-6 font-bold tracking-wide shadow-md transition-all hover:scale-[1.02]">
            <Link href="/assinatura/planos">
              Conhecer nossos planos
            </Link>
          </Button>
        </div>
      )}

      {data.hasSubscription && (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <PlanDetailsCard
                subscription={subscription}
                planCredits={credits?.plan_credits ?? 0}
              />
            </div>
            <div className="lg:col-span-1">
              <CreditsUsageCard credits={credits} subscription={subscription} />
            </div>
          </div>
          <CreditTransactionsTable data={creditTransactionsData} />
        </>
      )}

    </div>
  )
}