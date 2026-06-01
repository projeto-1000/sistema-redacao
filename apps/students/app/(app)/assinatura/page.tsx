import { getCreditsHistory, getSubscriptionData } from "@/app/actions/subscription";
import CreditTransactionsTable from "@repo/ui/components/features/credit-history/credits-transactions-table";
import { CreditsUsageCard } from "@/components/credits-usage-card";
import { PlanDetailsCard } from "@/components/plan-details";
import { parseCreditsTransactionsFilters } from "@/utils/parse-filters";
import { Button } from "@repo/ui/components/button";
import { PageHeader } from "@repo/ui/components/page-header";
import { ArrowLeft } from "lucide-react";
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <PlanDetailsCard subscription={subscription} />
        </div>
        <div className="lg:col-span-1">
          <CreditsUsageCard credits={credits} subscription={subscription} />
        </div>
      </div>

      <CreditTransactionsTable data={creditTransactionsData} />
    </div>
  )
}