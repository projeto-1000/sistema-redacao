import { getCheckoutPageData } from "@/app/actions/checkout";
import { Button } from "@repo/ui/components/button";
import { PageHeader } from "@repo/ui/components/page-header";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import type { Metadata } from "next";
import { CheckoutPlanSummaryCard } from "@/components/checkout/checkout-plan-summary-card";
import { CheckoutForm } from "@/components/checkout/checkout-form";

export const metadata: Metadata = {
  title: "Checkout",
};

interface CheckoutPageProps {
  searchParams: Promise<{
    planId?: string | string[];
  }>;
}

export default async function CheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  const params = await searchParams;

  const planId = Array.isArray(params.planId)
    ? params.planId[0]
    : params.planId;

  if (!planId) {
    redirect("/assinatura/planos");
  }

  const data = await getCheckoutPageData(planId);

  if (!data) {
    notFound();
  }

  return (
    <div className="space-y-8 min-h-dvh px-2 md:px-10 lg:px-12 py-4">
      <Button
        asChild
        variant="ghost"
        className="text-slate-500 hover:text-primary hover:bg-transparent!"
      >
        <Link href="/assinatura/planos">
          <ArrowLeft className="size-4 mr-2" />
          Voltar para planos
        </Link>
      </Button>

      <PageHeader
        title="Finalizar assinatura"
        subtitle="Revise seu plano e preencha os dados para ativar sua assinatura."
      />

      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1fr)_400px] gap-8">
        <main className="space-y-6">
          <CheckoutForm
            planId={data.plan.id}
            savedCards={data.savedPaymentCards}
          />
        </main>

        <aside className="xl:sticky xl:top-6 xl:self-start">
          <CheckoutPlanSummaryCard plan={data.plan} />
        </aside>
      </div>
    </div>
  );
}
