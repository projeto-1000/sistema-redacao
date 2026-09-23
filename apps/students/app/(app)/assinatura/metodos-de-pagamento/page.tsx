import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { getPaymentMethodsPageData } from "@/app/actions/payment-methods";
import { PaymentMethodsManager } from "@/components/payments/payment-methods-manager";
import { Button } from "@repo/ui/components/button";
import { PageHeader } from "@repo/ui/components/page-header";
import { AddPaymentCardDialog } from "@/components/payments/add-payment-card-dialog";

export const metadata: Metadata = {
  title: "Métodos de pagamento",
};

export default async function PaymentMethodsPage() {
  const { cards, hasActiveCardSubscription } = await getPaymentMethodsPageData();

  return (
    <div className="min-h-dvh space-y-8 px-2 py-4 md:px-10 lg:px-12">
      <Button
        asChild
        variant="ghost"
        className="hover:text-primary text-slate-500 hover:bg-transparent!"
      >
        <Link href="/assinatura">
          <ArrowLeft className="mr-2 size-4" />
          Voltar para a assinatura
        </Link>
      </Button>

      <PageHeader
        title="Métodos de pagamento"
        subtitle="Gerencie os cartões usados nas suas compras e assinatura."
      >
        <AddPaymentCardDialog
          hasActiveCardSubscription={hasActiveCardSubscription}
        />
      </PageHeader>

      <PaymentMethodsManager cards={cards} hasActiveCardSubscription={hasActiveCardSubscription} />
    </div>
  );
}
