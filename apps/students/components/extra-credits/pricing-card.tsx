import type { CreditPackage } from "@repo/types";
import { Button } from "@repo/ui/components/button";
import { Check, CreditCard } from "lucide-react";
import { ConfirmPurchase } from "./confirm-purchase";
import type { SavedPaymentCard } from "@/app/actions/credits";

function formatPrice(price: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(price);
}

interface PricingCardProps extends CreditPackage {
  savedCards: SavedPaymentCard[];
  purchaseDisabled?: boolean;
}

export function PricingCard(pkg: PricingCardProps) {
  const { credits, price, purchaseDisabled = false } = pkg;

  return (
    <div className="flex min-w-0 flex-col rounded-2xl border border-slate-200 bg-white p-8 transition-shadow hover:shadow-sm">
      <h2 className="text-center text-4xl font-extrabold tracking-tight text-slate-800">
        {credits}
        <span className="ml-2 text-xl font-bold tracking-normal text-slate-500">
          {credits === 1 ? "crédito" : "créditos"}
        </span>
      </h2>

      <div className="my-6 border-b border-slate-100" />

      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-full">
            <Check className="size-3.5 stroke-3" />
          </div>

          <span className="text-sm font-semibold text-slate-600">Créditos extras não expiram</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-primary/10 text-primary flex size-6 shrink-0 items-center justify-center rounded-full">
            <CreditCard className="size-3.5 stroke-3" />
          </div>

          <span className="text-sm font-semibold text-slate-600">
            Sem alteração na sua assinatura
          </span>
        </div>
      </div>

      <div className="mt-8">
        <p className="text-4xl font-extrabold tracking-tight text-slate-800">
          {formatPrice(price)}
        </p>

        <p className="mt-1 text-sm font-semibold text-slate-400">pagamento único</p>
      </div>

      <div className="mt-auto pt-8">
        {purchaseDisabled ? (
          <Button disabled className="h-12 w-full rounded-xl text-base font-bold">
            Comprar créditos
          </Button>
        ) : (
          <ConfirmPurchase packageData={pkg} savedCards={pkg.savedCards} />
        )}
      </div>
    </div>
  );
}
