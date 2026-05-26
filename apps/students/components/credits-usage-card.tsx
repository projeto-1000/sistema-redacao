import { StudentCredits, StudentSubscription } from "@repo/types";
import { RefreshCcw, PlusCircle, Plus } from "lucide-react";
import Link from "next/link";

export function CreditsUsageCard({ credits, subscription }: { credits: StudentCredits, subscription: StudentSubscription }) {
  const isLifetime = subscription.billing_cycle === 'lifetime' || subscription.status === 'trial';

  const totalPlan = subscription.credits_included || 0;
  const planPercentage = totalPlan > 0 ? ((credits.plan_credits || 0) / totalPlan) * 100 : 0;

  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-sm overflow-hidden">

      <div className="grid grid-cols-1 md:grid-cols-1 divide-y divide-slate-200">
        <div className="p-6 md:p-8">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h4 className="font-bold= flex items-center gap-2">
                <RefreshCcw className="size-4 text-primary" />
                Créditos do Plano
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                {isLifetime ? 'Uso vitalício' : 'Renovam no próximo ciclo'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-3xl font-bold text-slate-900">{credits.plan_credits || 0}</span>
              {totalPlan > 0 && <span className="text-sm text-slate-400 font-medium ml-1">/ {totalPlan}</span>}
            </div>
          </div>

          <div className="w-full bg-slate-100 rounded-full h-2.5">
            <div
              className="bg-primary h-2.5 rounded-full transition-all duration-500"
              style={{ width: `${planPercentage}%` }}
            />
          </div>
        </div>

        <div className="p-6 md:p-8 bg-slate-50/30">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h4 className="font-bold flex items-center gap-2">
                <PlusCircle className="size-4 text-secondary" />
                Créditos Avulsos
              </h4>
              <p className="text-xs text-slate-500 mt-1">Comprados separadamente</p>
            </div>
            <span className="text-3xl font-bold">{credits.extra_credits}</span>
          </div>

          <Link href='/assinatura/comprar-creditos' className="flex items-center gap-2 text-[13px] hover:text-secondary hover:font-bold transition-colors justify-end text-medium text-slate-700 text-right">
            <Plus className="size-4" /> Comprar mais créditos
          </Link>
        </div>

      </div>
    </div>
  );
}