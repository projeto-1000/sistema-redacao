import { getCreditPackages } from "@/app/actions/credits";
import { PricingCard } from "@/components/pricing-card";
import { PurchaseCallout } from "@/components/purchase-callout";
import { Button } from "@repo/ui/components/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default async function BuyCreditsPage() {
  const packages = await getCreditPackages();

  return (
    <div className="space-y-8 min-h-dvh px-2 md:px-10 lg:px-12 py-4">
      <Button asChild variant='ghost' className="text-slate-500 hover:text-primary hover:bg-transparent!">
        <Link href="/assinatura">
          <ArrowLeft className="size-4 mr-2 " />
          Voltar
        </Link>
      </Button>


      <div className="flex flex-col items-center gap-2 text-center mb-16">
        <h1 className="text-2xl font-extrabold text-foreground md:text-3xl">
          Adicionar Créditos Extras
        </h1>
        <p className="text-md font-medium text-foreground/70">
          Garanta mais revisões para seus estudos. Créditos avulsos não têm validade.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
        {packages.map((pkg) => (
          <PricingCard key={pkg.id} {...pkg} />
        ))}
      </div>

      <PurchaseCallout />
    </div>
  )
}