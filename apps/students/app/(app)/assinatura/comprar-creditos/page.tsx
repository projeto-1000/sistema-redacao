import {
  canPurchaseExtraCredits,
  getCreditPackages,
  getSavedPaymentCards,
} from "@/app/actions/credits";
import { PricingCard } from "@/components/extra-credits/pricing-card";
import { PurchaseCallout } from "@/components/extra-credits/purchase-callout";
import { Button } from "@repo/ui/components/button";
import { ArrowLeft, LockKeyhole } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comprar Créditos Extras",
};

export default async function BuyCreditsPage() {
  const [eligibility, packages] = await Promise.all([
    canPurchaseExtraCredits(),
    getCreditPackages(),
  ]);
  const savedCards = eligibility.eligible ? await getSavedPaymentCards() : [];

  return (
    <div className="min-h-dvh px-4 py-6 md:px-10 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <Button
          asChild
          variant="ghost"
          className="hover:text-primary text-slate-500 hover:bg-transparent!"
        >
          <Link href="/assinatura">
            <ArrowLeft className="mr-2 size-4" />
            Voltar
          </Link>
        </Button>

        <div className="mt-8 mb-12 flex flex-col items-center gap-2 text-center md:mb-14">
          <h1 className="text-foreground text-2xl font-extrabold md:text-3xl">
            Adicionar créditos extras
          </h1>

          <p className="text-foreground/60 max-w-2xl text-sm font-medium md:text-base">
            Mais correções para quando você precisar, sem alterar seu plano.
          </p>
        </div>

        {!eligibility.eligible ? (
          <div className="border-primary/25 from-primary/10 mb-8 rounded-2xl border bg-linear-to-br via-white to-amber-50 px-6 py-8 shadow-sm md:px-10">
            <div className="flex flex-col items-center gap-5 text-center md:flex-row md:text-left">
              <div className="bg-primary/15 text-primary flex size-12 shrink-0 items-center justify-center rounded-full">
                <LockKeyhole className="size-6" />
              </div>

              <div className="flex-1">
                <h2 className="text-foreground text-xl font-extrabold md:text-2xl">
                  Créditos extras são exclusivos para assinantes
                </h2>
                <p className="text-foreground/60 mt-2 text-sm leading-relaxed font-medium md:text-base">
                  Para comprar créditos adicionais, você precisa ter uma assinatura paga ativa.
                </p>
              </div>

              <Button asChild className="shrink-0 rounded-xl px-6 font-bold">
                <Link href="/assinatura/planos">Conhecer planos</Link>
              </Button>
            </div>
          </div>
        ) : null}

        {packages.length > 0 ? (
          <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <PricingCard
                key={pkg.id}
                {...pkg}
                savedCards={savedCards}
                purchaseDisabled={!eligibility.eligible}
              />
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <p className="font-semibold text-slate-600">
              Nenhum pacote de créditos está disponível no momento.
            </p>
          </div>
        )}

        <div className="mt-8">
          <PurchaseCallout />
        </div>
      </div>
    </div>
  );
}
