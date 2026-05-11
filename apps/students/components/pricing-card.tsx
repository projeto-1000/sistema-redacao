
import { CreditPackage } from "@repo/types";
import { cn } from "@repo/ui/lib/utils";
import { Award } from "lucide-react";
import { ConfirmPurchase } from "./confirm-purchase";

export function PricingCard(pkg: CreditPackage) {
  const { credits, price, popular } = pkg;

  return (
    <div className={cn(
      "flex-1 flex flex-col items-center bg-white border rounded-2xl p-8 relative min-w-[280px] transition-all",
      popular ? "border-primary shadow-md scale-105" : "border-slate-200"
    )}>
      {popular && (
        <span className="absolute -top-3 right-6 bg-primary text-amber-950 text-xs font-extrabold px-3 py-1 rounded-sm">
          Recomendado
        </span>
      )}

      <div className="flex gap-1 mb-2 text-primary">
        {credits === 1 ? (
          <Award className="size-8" />
        ) : credits === 5 ? (
          <Award className="size-10" />
        ) : (
          <>
            <Award className="size-8" />
            <Award className="size-8" />
          </>
        )}
      </div>

      <div className="flex flex-col items-center gap-4 w-full text-center">
        <h3 className="text-3xl font-extrabold text-slate-800 flex items-baseline gap-1 w-full justify-center">
          {credits} <span className="text-lg font-medium text-slate-500">Crédito{credits > 1 && "s"}</span>
        </h3>

        <div className="border-b border-slate-200 w-full " />
        <p className="text-4xl font-extrabold text-slate-800 mb-4">
          <span className="text-2xl font-bold mr-1">R$</span>
          {price}
        </p>
      </div>

      <ConfirmPurchase packageData={pkg} />
    </div>
  );
}