import { getCreditPackages, getSavedPaymentCards } from "@/app/actions/credits";
import { PricingCard } from "@/components/extra-credits/pricing-card";
import { PurchaseCallout } from "@/components/extra-credits/purchase-callout";
import { Button } from "@repo/ui/components/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Comprar Créditos Extras",
};

export default async function BuyCreditsPage() {
  const [packages, savedCards] = await Promise.all([
    getCreditPackages(),
    getSavedPaymentCards(),
  ]);

  return (
    <div className="min-h-dvh px-4 py-6 md:px-10 lg:px-12">
      <div className="mx-auto max-w-7xl">
        <Button
          asChild
          variant="ghost"
          className="text-slate-500 hover:bg-transparent! hover:text-primary"
        >
          <Link href="/assinatura">
            <ArrowLeft className="mr-2 size-4" />
            Voltar
          </Link>
        </Button>

        <div className="mb-12 mt-8 flex flex-col items-center gap-2 text-center md:mb-14">
          <h1 className="text-2xl font-extrabold text-foreground md:text-3xl">
            Adicionar créditos extras
          </h1>

          <p className="max-w-2xl text-sm font-medium text-foreground/60 md:text-base">
            Mais correções para quando você precisar, sem alterar seu plano.
          </p>
        </div>

        {packages.length > 0 ? (
          <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2 lg:grid-cols-3">
            {packages.map((pkg) => (
              <PricingCard
                key={pkg.id}
                {...pkg}
                savedCards={savedCards}
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