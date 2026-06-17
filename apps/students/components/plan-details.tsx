import { StudentSubscription, SubscriptionStatus } from "@repo/types";
import { Button } from "@repo/ui/components/button";
import { Badge } from "@repo/ui/components/badge";
import { statusBadgeConfig } from "@repo/constants";
import { formatCurrency, formatDate } from "@repo/utils";
import Link from "next/link";

export function PlanDetailsCard({ subscription }: { subscription: StudentSubscription }) {
  const isLifetime = subscription.interval === 'lifetime' || subscription.status === 'trial';
  const status = statusBadgeConfig[subscription?.status as SubscriptionStatus] || statusBadgeConfig.trial

  function getPlanLabel(): string {
    if (subscription.interval === 'month') {
      if (subscription.interval_count === 1) return 'Mensal';
      if (subscription.interval_count === 3) return 'Trimestral';
      if (subscription.interval_count === 6) return 'Semestral';
    }
    if (subscription.interval === 'year') {
      return 'Anual';
    }
    return '';
  }

  function getPrice(): string {
    if (subscription.status === 'trial') {
      return "Pague apenas quando terminar seu período de teste"
    }

    const price = formatCurrency(subscription.price);
    let suffix = '';

    if (subscription.interval === 'month') {
      if (subscription.interval_count === 1) suffix = '/ mês';
      if (subscription.interval_count === 3) suffix = '/ trimestre';
      if (subscription.interval_count === 6) suffix = '/ semestre';
    } else if (subscription.interval === 'year') {
      suffix = '/ ano';
    }

    return `${price} ${suffix}`;
  }

  const planLabel = getPlanLabel();

  return (
    <div className="rounded-3xl bg-white border border-slate-200 shadow-sm p-6 md:p-8 flex flex-col justify-between h-full">

      <div>
        <div className="flex justify-between items-start mb-2">
          <Badge variant="secondary" className="bg-slate-100 text-slate-600 hover:bg-slate-100 border-0">
            Plano Atual
          </Badge>

          <div className={`border-0 font-bold px-2 py-1 rounded-md text-[12px] uppercase tracking-wider ${status.classes}`}>
            {status.label}
          </div>
        </div>

        <h2 className="text-3xl font-bold capitalize mb-1">
          {subscription.plan_name} {isLifetime || !planLabel ? '' : `• ${planLabel}`}
        </h2>
        <p className="text-slate-500 font-medium">
          {getPrice()}
        </p>
      </div>

      <div className="mt-8">
        <hr className="border-slate-100 mb-6" />

        <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">
              {isLifetime ? 'Validade' : 'Próxima Cobrança'}
            </p>
            <p className="font-bold text-lg">
              {isLifetime ? 'Acesso Vitalício' : formatDate(subscription.current_period_end, 'numeric')}
            </p>
          </div>

          <div className="flex gap-3 w-full md:w-auto">
            {!isLifetime && (
              <Button variant="outline" className="w-full md:w-auto rounded-xl h-11 border-slate-300 text-slate-700">
                Cancelar Assinatura
              </Button>
            )}

            <Button asChild className="w-full md:w-auto rounded-xl h-11 font-medium">
              <Link href='/assinatura/mudar-plano'>
                Alterar Plano
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}